import { describe, it, expect } from 'vitest';
import { evaluateOrdinance11 } from '../../src/utils/ordinance11';

describe('ordinance11 – GGSIPU Ordinance 11 edge cases', () => {
  it('grace marks: 15/21 internal/external, printed 40(P)* -> GRACE_PASS', () => {
    const r = evaluateOrdinance11({ internalRaw: '15', externalRaw: '21', totalGradeRaw: '40(P)*' });
    expect(r.internalScore).toBe(15);
    expect(r.externalScore).toBe(21);
    expect(r.computedSum).toBe(36);
    expect(r.totalScore).toBe(40);
    expect(r.isGrace).toBe(true);
    expect(r.graceAmount).toBe(4);
    expect(r.grade).toBe('P');
    expect(r.gradePoint).toBe(4);
    expect(r.isPassed).toBe(true);
    expect(r.paperStatus).toBe('GRACE_PASS');
  });

  it('numeric zero is not absent: 16/0 -> 16(F) fails', () => {
    const r = evaluateOrdinance11({ internalRaw: '16', externalRaw: '0', totalGradeRaw: '16(F)' });
    expect(r.internalScore).toBe(16);
    expect(r.externalScore).toBe(0);
    expect(r.isAbsentInternal).toBe(false);
    expect(r.isAbsentExternal).toBe(false);
    expect(r.totalScore).toBe(16);
    expect(r.grade).toBe('F');
    expect(r.isPassed).toBe(false);
  });

  it('absent internal: A/44 -> A(F) marks paper ABSENT', () => {
    const r = evaluateOrdinance11({ internalRaw: 'A', externalRaw: '44', totalGradeRaw: 'A(F)' });
    expect(r.internalScore).toBeNull();
    expect(r.externalScore).toBe(44);
    expect(r.isAbsentInternal).toBe(true);
    expect(r.isAbsentExternal).toBe(false);
    expect(r.totalScore).toBeNull();
    expect(r.paperStatus).toBe('ABSENT');
  });

  it('NUES dash: 90/- -> 90(O) passes on the single component', () => {
    const r = evaluateOrdinance11({ internalRaw: '90', externalRaw: '-', totalGradeRaw: '90(O)' });
    expect(r.isNuesDash).toBe(true);
    expect(r.totalScore).toBe(90);
    expect(r.grade).toBe('O');
    expect(r.gradePoint).toBe(10);
    expect(r.isPassed).toBe(true);
  });

  it('low internal aggregate still passes under Ordinance 11 (3+41=44 -> P)', () => {
    const r = evaluateOrdinance11({ internalRaw: '3', externalRaw: '41', totalGradeRaw: '44(P)' });
    expect(r.isPassed).toBe(true);
    expect(r.grade).toBe('P');
    expect(r.gradePoint).toBe(4);
    expect(r.belowComponentCutoff).toBe(false);
  });

  it('strict component cutoffs flag below-cutoff when enabled', () => {
    const r = evaluateOrdinance11({ internalRaw: '3', externalRaw: '41', totalGradeRaw: '44(P)', minInternalPct: 40 });
    expect(r.belowComponentCutoff).toBe(true);
  });
});
