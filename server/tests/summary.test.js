import { describe, it, expect, vi } from 'vitest';
import { createResultsService } from '../src/services/result.service';

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

// Sem 1: 95 (10) x4cr + 80 (9) x4cr -> SGPA 9.5, 8 credits, no backlog.
// Sem 2: 30 (0, F) x4cr -> SGPA 0, backlog. CGPA = (9.5*8 + 0*4)/12 = 6.33.
const MARKS = [
  { roll_no: '00111102022', semester: 1, institution_code: '142', credits: 4, total: 95, grade: 'O', is_absent: false },
  { roll_no: '00111102022', semester: 1, institution_code: '142', credits: 4, total: 80, grade: 'A+', is_absent: false },
  { roll_no: '00111102022', semester: 2, institution_code: '142', credits: 4, total: 30, grade: 'F', is_absent: false },
];

function makeSummary(overrides = {}) {
  const calls = {};
  return {
    calls,
    getGradeScale: vi.fn(async () => SCALE),
    getLatestMarks: vi.fn(async () => MARKS),
    upsertSummaries: vi.fn(async (runner, rows) => {
      calls.upserted = rows;
      return [];
    }),
    refreshRanks: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('recomputeSummaries', () => {
  it('writes per-semester SGPA + global CGPA + backlog, then refreshes ranks', async () => {
    const summary = makeSummary();
    const svc = createResultsService({ summary });
    const runner = {};

    const out = await svc.recomputeSummaries(runner, ['00111102022']);

    expect(summary.getLatestMarks).toHaveBeenCalledWith(runner, ['00111102022']);
    expect(summary.calls.upserted).toEqual([
      { roll_no: '00111102022', semester: 1, sgpa: 9.5, cgpa: 6.33, total_credits: 8, has_backlog: false },
      { roll_no: '00111102022', semester: 2, sgpa: 0, cgpa: 6.33, total_credits: 4, has_backlog: true },
    ]);
    expect(summary.refreshRanks).toHaveBeenCalledWith(runner);
    expect(out).toEqual({ students: 1, semesters: 2 });
  });

  it('dedupes rolls and skips students with no marks', async () => {
    const summary = makeSummary({ getLatestMarks: vi.fn(async () => []) });
    const svc = createResultsService({ summary });

    const out = await svc.recomputeSummaries({}, ['00111102022', '00111102022']);

    expect(summary.getLatestMarks).toHaveBeenCalledWith({}, ['00111102022']);
    expect(summary.upsertSummaries).not.toHaveBeenCalled();
    expect(summary.refreshRanks).toHaveBeenCalled();
    expect(out).toEqual({ students: 0, semesters: 0 });
  });

  it('does nothing for empty input', async () => {
    const summary = makeSummary();
    const svc = createResultsService({ summary });

    await expect(svc.recomputeSummaries({}, [])).resolves.toEqual({ students: 0, semesters: 0 });
    expect(summary.getGradeScale).not.toHaveBeenCalled();
  });
});
