import { describe, it, expect } from 'vitest';
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
} from '../../src/parsers/ggsipuTokenParser';

describe('ggsipuTokenParser – GGSIPU token matchers', () => {
  it('matches institution header', () => {
    expect(matchInstitution('Institution Code: 142 Institution: ABC COLLEGE')).toEqual({ code: '142', name: 'ABC COLLEGE' });
    expect(matchInstitution('random line')).toBeNull();
  });
  it('matches scheme id + semester', () => {
    expect(matchSchemeId('SchemeID: 480202021001')).toBe('480202021001');
    expect(matchSemester('Sem./Year: 3')).toBe(3);
    expect(matchSemester('noise')).toBeNull();
  });
  it('matches exam headers (regular + reappear)', () => {
    expect(matchExamHeader('Batch: 2022 Examination: REGULAR December, 2024')).toEqual({
      batch: '2022', exam_type: 'REGULAR', session: 'December, 2024',
    });
    expect(matchExamHeader('Batch: 2021 Examination: REAPPEAR May, 2024')?.exam_type).toBe('REAPPEAR');
  });
  it('matches student header (roll + name until SID:)', () => {
    expect(matchStudentHeader('00111102022PRIYAM KUMAR JHASID: 480000053814SchemeID: 480202021001')).toEqual({
      roll_no: '00111102022', name: 'PRIYAM KUMAR JHA', sid: '480000053814', scheme_id: '480202021001',
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
    const row = parsePaperRow('01 020301 BCA301 OPERATING SYSTEM & LINUX PROGRAMMING 4 THEORY UES COMPULSORY DROPPABLE 25 75 100 40');
    expect(row).toMatchObject({ paper_id: '020301', code: 'BCA301', credits: 4, paper_type: 'THEORY', exam_mode: 'UES', kind: 'COMPULSORY DROPPABLE', minor_max: 25, major_max: 75, max_marks: 100, pass_marks: 40 });
    const practical = parsePaperRow('03 020305 BCA305 SUMMER TRAINING 2 PRACTICAL UES COMPULSORY -- 75 100 40');
    expect(practical).toMatchObject({ minor_max: null, credits: 2, paper_type: 'PRACTICAL' });
    expect(parsePaperRow('total garbage line here')).toBeNull();
  });
});
