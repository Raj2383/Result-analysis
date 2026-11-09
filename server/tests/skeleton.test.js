import { describe, it, expect } from 'vitest';
import { sgpa, cgpa, gradePoint } from '../src/utils/calculations';
import { parseRollNumber, isValidRollNumber } from '../src/utils/rollNumber';

// Phase 1 skeleton – real assertions land with Phase 2–4 implementation.
describe('phase-1 skeleton', () => {
  it('sgpa smoke', () => {
    expect(sgpa([{ credits: 4, gradePoint: 9 }])).toBe(9);
  });
  it('cgpa smoke', () => {
    expect(cgpa([{ sgpa: 9, credits: 20 }])).toBe(9);
  });
  it('roll parsing smoke', () => {
    expect(parseRollNumber('00111102022').institutionCode).toBe('111');
    expect(isValidRollNumber('00111102022')).toBe(true);
  });
  it('gradePoint smoke', () => {
    const scale = [{ grade: 'O', min_marks: 90, max_marks: 100, grade_point: 10 }];
    expect(gradePoint(95, scale)).toBe(10);
  });
});
