import { describe, it, expect } from 'vitest';
import { parseResultText } from '../src/parsers/resultPageStateMachine';
import {
  matchInstitution,
  matchSchemeId,
  matchSemester,
  matchExamHeader,
  matchStudentHeader,
  matchPaperEntry,
  matchScoreLine,
  matchTotalLine,
  matchLoneInteger,
  parsePaperRow,
} from '../src/parsers/ggsipuTokenParser';

// Fixtures copied from the spec format (ARCHITECTURE.md §5) – also serve as living docs.
const SCHEME_PAGE = [
  'Institution Code: 142 Institution: VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES',
  'SchemeID: 480202021001 Sem./Year: 3',
  '01 020301 BCA301 OPERATING SYSTEM & LINUX PROGRAMMING 4 THEORY UES COMPULSORY DROPPABLE 25 75 100 40',
  '02 020303 BCA303 COMPUTER NETWORKS 4 THEORY UES COMPULSORY DROPPABLE 25 75 100 40',
  '03 020305 BCA305 SUMMER TRAINING 2 PRACTICAL UES COMPULSORY -- 75 100 40',
].join('\n');

const RESULT_PAGE = [
  'Batch: 2022 Examination: REGULAR December, 2024',
  '00111102022PRIYAM KUMAR JHASID: 480000053814SchemeID: 480202021001',
  '020301(4)',
  '21 63',
  '84(A+)',
  '020303(4)',
  '25 65',
  '90(O)',
  '020305(2)',
  '- 70',
  '40(P)*',
  '10',
  '00211102022NEHA SHARMASID: 480000053815SchemeID: 480202021001',
  '020301(4)',
  '10 A',
  'A(F)',
  '0',
].join('\n');

describe('line matchers', () => {
  it('matches institution header', () => {
    expect(matchInstitution('Institution Code: 142 Institution: ABC COLLEGE')).toEqual({
      code: '142',
      name: 'ABC COLLEGE',
    });
    expect(matchInstitution('random line')).toBeNull();
  });

  it('matches scheme id and semester', () => {
    expect(matchSchemeId('SchemeID: 480202021001')).toBe('480202021001');
    expect(matchSemester('Sem./Year: 3')).toBe(3);
    expect(matchSemester('noise')).toBeNull();
  });

  it('matches exam headers (regular + reappear)', () => {
    expect(matchExamHeader('Batch: 2022 Examination: REGULAR December, 2024')).toEqual({
      batch: '2022',
      exam_type: 'REGULAR',
      session: 'December, 2024',
    });
    expect(matchExamHeader('Batch: 2021 Examination: REAPPEAR May, 2024').exam_type).toBe('REAPPEAR');
  });

  it('matches student header (roll + name until SID:)', () => {
    expect(matchStudentHeader('00111102022PRIYAM KUMAR JHASID: 480000053814SchemeID: 480202021001')).toEqual({
      roll_no: '00111102022',
      name: 'PRIYAM KUMAR JHA',
      sid: '480000053814',
      scheme_id: '480202021001',
    });
  });

  it('matches paper entry, scores, totals incl. grace/absent/odd cases', () => {
    expect(matchPaperEntry('020301(4)')).toEqual({ paper_id: '020301', credits: 4 });
    expect(matchScoreLine('21 63')).toEqual({ internal: 21, external: 63, externalAbsent: false });
    expect(matchScoreLine('- 70')).toEqual({ internal: null, external: 70, externalAbsent: false });
    expect(matchScoreLine('10 A')).toEqual({ internal: 10, external: null, externalAbsent: true });
    expect(matchTotalLine('84(A+)')).toEqual({ total: 84, grade: 'A+', is_grace: false, totalAbsent: false });
    expect(matchTotalLine('40(P)*')).toEqual({ total: 40, grade: 'P', is_grace: true, totalAbsent: false });
    expect(matchTotalLine('A(F)')).toEqual({ total: null, grade: 'F', is_grace: false, totalAbsent: true });
    expect(matchTotalLine('A')).toEqual({ total: null, grade: 'F', is_grace: false, totalAbsent: true });
    expect(matchLoneInteger('27')).toBe(27);
  });

  it('parses scheme paper rows, incl. two-word kind and -- minor', () => {
    const row = parsePaperRow(
      '01 020301 BCA301 OPERATING SYSTEM & LINUX PROGRAMMING 4 THEORY UES COMPULSORY DROPPABLE 25 75 100 40'
    );
    expect(row).toMatchObject({
      paper_id: '020301',
      code: 'BCA301',
      name: 'OPERATING SYSTEM & LINUX PROGRAMMING',
      credits: 4,
      paper_type: 'THEORY',
      exam_mode: 'UES',
      kind: 'COMPULSORY DROPPABLE',
      minor_max: 25,
      major_max: 75,
      max_marks: 100,
      pass_marks: 40,
    });
    const practical = parsePaperRow('03 020305 BCA305 SUMMER TRAINING 2 PRACTICAL UES COMPULSORY -- 75 100 40');
    expect(practical).toMatchObject({ minor_max: null, credits: 2, paper_type: 'PRACTICAL' });
    expect(parsePaperRow('total garbage line here')).toBeNull();
  });
});

describe('parseResultText', () => {
  it('extracts institutions, schemes, papers, students, marks, grace, absent, CS', () => {
    const out = parseResultText([SCHEME_PAGE, RESULT_PAGE]);

    expect(out.institutions).toEqual([{ code: '142', name: 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES' }]);
    expect(out.schemes).toMatchObject([{ scheme_id: '480202021001', institution_code: '142', semester: 3 }]);
    expect(out.papers).toHaveLength(3);
    expect(out.exams).toMatchObject([{ batch: '2022', exam_type: 'REGULAR', semester: 3 }]);

    expect(out.students.map((s) => s.roll_no)).toEqual(['00111102022', '00211102022']);
    expect(out.students[0]).toMatchObject({ name: 'PRIYAM KUMAR JHA', institution_code: '142' });

    const r1 = out.results.find((r) => r.roll_no === '00111102022');
    expect(r1.credits_secured).toBe(10); // 4+4+2, all passed
    expect(r1.marks).toHaveLength(3);
    expect(r1.marks[0]).toMatchObject({ paper_id: '020301', internal: 21, external: 63, total: 84, grade: 'A+', is_absent: false, is_grace: false });
    expect(r1.marks[2]).toMatchObject({ internal: null, total: 40, grade: 'P', is_grace: true });

    const r2 = out.results.find((r) => r.roll_no === '00211102022');
    expect(r2.marks[0]).toMatchObject({ total: null, grade: 'F', is_absent: true });
    expect(r2.credits_secured).toBe(0); // CS = 0 must not crash or vanish
  });

  it('is deterministic (idempotent parse)', () => {
    const a = parseResultText([SCHEME_PAGE, RESULT_PAGE]);
    const b = parseResultText([SCHEME_PAGE, RESULT_PAGE]);
    expect(b).toEqual(a);
  });

  it('never crashes on garbage input', () => {
    const out = parseResultText(['total nonsense', '123', '', '   ']);
    expect(out.students).toEqual([]);
    expect(out.results).toEqual([]);
  });

  it('skips students outside any exam context with a warning', () => {
    const out = parseResultText(['00111102022LATE ENTRY SID: 1SchemeID: 480202021001']);
    expect(out.students).toEqual([]);
    expect(out.meta.warnings.length).toBeGreaterThan(0);
  });
});
