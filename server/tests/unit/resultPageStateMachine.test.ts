import { describe, it, expect } from 'vitest';
import { parseResultText } from '../../src/parsers/resultPageStateMachine';

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

describe('resultPageStateMachine – parseResultText', () => {
  it('extracts institutions, schemes, papers, students, marks, grace, absent, CS', () => {
    const out = parseResultText([SCHEME_PAGE, RESULT_PAGE]);
    expect(out.institutions).toEqual([{ code: '142', name: 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES' }]);
    expect(out.schemes).toMatchObject([{ scheme_id: '480202021001', institution_code: '142', semester: 3 }]);
    expect(out.papers).toHaveLength(3);
    expect(out.exams).toMatchObject([{ batch: '2022', exam_type: 'REGULAR', semester: 3 }]);
    expect(out.students.map((s) => s.roll_no)).toEqual(['00111102022', '00211102022']);
    const r1 = out.results.find((r) => r.roll_no === '00111102022');
    expect(r1?.credits_secured).toBe(10);
    expect(r1?.marks).toHaveLength(3);
    const r2 = out.results.find((r) => r.roll_no === '00211102022');
    expect(r2?.marks[0]).toMatchObject({ total: null, grade: 'F', is_absent: true });
    expect(r2?.credits_secured).toBe(0);
  });

  it('is deterministic (idempotent parse)', () => {
    expect(parseResultText([SCHEME_PAGE, RESULT_PAGE])).toEqual(parseResultText([SCHEME_PAGE, RESULT_PAGE]));
  });

  it('never crashes on garbage input', () => {
    const out = parseResultText(['total nonsense', '123', '', '   ']);
    expect(out.students).toEqual([]);
    expect(out.results).toEqual([]);
  });
});
