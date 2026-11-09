import { describe, it, expect } from 'vitest';
import { gradePoint, pointForMark, hasBacklog, sgpa, cgpa } from '../src/utils/calculations';

// Test-local copy of the seeded bands (production code reads grade_scale from DB).
const SCALE = [
  { grade: 'O', min_marks: 90, max_marks: 100, grade_point: 10 },
  { grade: 'A+', min_marks: 75, max_marks: 89, grade_point: 9 },
  { grade: 'A', min_marks: 65, max_marks: 74, grade_point: 8 },
  { grade: 'B+', min_marks: 55, max_marks: 64, grade_point: 7 },
  { grade: 'B', min_marks: 50, max_marks: 54, grade_point: 6 },
  { grade: 'C', min_marks: 45, max_marks: 49, grade_point: 5 },
  { grade: 'P', min_marks: 40, max_marks: 44, grade_point: 4 },
  { grade: 'F', min_marks: 0, max_marks: 39, grade_point: 0 },
];

describe('gradePoint boundaries', () => {
  const cases = [
    [100, 10], [90, 10], [89, 9], [75, 9], [74, 8], [65, 8], [64, 7],
    [55, 7], [54, 6], [50, 6], [49, 5], [45, 5], [44, 4], [40, 4], [39, 0], [0, 0],
  ];
  for (const [total, gp] of cases) {
    it(`${total} -> ${gp}`, () => expect(gradePoint(total, SCALE)).toBe(gp));
  }
  it('absent (null total) -> 0', () => {
    expect(pointForMark(null, SCALE)).toBe(0);
    expect(pointForMark(84, SCALE)).toBe(9);
  });
});

describe('sgpa', () => {
  it('weights by credits and counts fails/absent as 0', () => {
    expect(sgpa([{ credits: 4, gradePoint: 10 }, { credits: 4, gradePoint: 0 }])).toBe(5);
  });
  it('rounds to 2 decimals', () => {
    expect(sgpa([{ credits: 3, gradePoint: 7 }, { credits: 3, gradePoint: 8 }])).toBe(7.5);
    expect(sgpa([{ credits: 4, gradePoint: 9 }, { credits: 2, gradePoint: 7 }])).toBe(8.33);
  });
  it('empty paper set -> 0 (no crash)', () => {
    expect(sgpa([])).toBe(0);
  });
});

describe('cgpa', () => {
  it('weights semester SGPAs by semester credits', () => {
    expect(cgpa([{ sgpa: 9, credits: 20 }, { sgpa: 7, credits: 10 }])).toBe(8.33);
  });
  it('empty -> 0', () => {
    expect(cgpa([])).toBe(0);
  });
});

describe('hasBacklog', () => {
  it('true for F or absent, false otherwise', () => {
    expect(hasBacklog([{ grade: 'A+', is_absent: false }])).toBe(false);
    expect(hasBacklog([{ grade: 'F', is_absent: false }])).toBe(true);
    expect(hasBacklog([{ grade: 'A', is_absent: true }])).toBe(true);
    expect(hasBacklog([])).toBe(false);
  });
});
