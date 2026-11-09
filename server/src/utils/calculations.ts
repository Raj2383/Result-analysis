/**
 * Pure calculation helpers – full logic lands in Phase 4 with unit tests.
 * ASSUMPTION: grade bands below mirror the `grade_scale` seed data; runtime code
 * must read grade_scale from DB, never hard-code these bands outside tests/seeds.
 */

export interface GradeScaleRow {
  grade: string;
  min_marks: number;
  max_marks: number;
  grade_point: number;
}

export interface PaperLike {
  credits: number;
  gradePoint: number;
}

export interface SemesterAgg {
  semester: number;
  sgpa: number;
  credits: number;
  backlog: boolean;
}

/** Round to 2 decimals. */
export function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Map total marks -> grade point using injected scale rows. */
export function gradePoint(total: number, scale: GradeScaleRow[]): number {
  const row = scale.find((r) => total >= r.min_marks && total <= r.max_marks);
  return row ? row.grade_point : 0;
}

/** Grade point for one mark row. Absent (null total) counts as 0. */
export function pointForMark(total: number | null, scale: GradeScaleRow[]): number {
  if (total == null) return 0;
  return gradePoint(total, scale);
}

/** Backlog after the latest attempt: any paper failed (F) or absent. */
export function hasBacklog(marks: Array<{ grade: string; is_absent: boolean }>): boolean {
  return (marks || []).some((x) => x.is_absent || String(x.grade || '').toUpperCase() === 'F');
}

/** SGPA = Σ(credits × gp) / Σ(credits). Failed/absent count as gp 0. */
export function sgpa(papers: Array<PaperLike>): number {
  const credits = papers.reduce((s, p) => s + p.credits, 0);
  if (!credits) return 0;
  return round2(papers.reduce((s, p) => s + p.credits * p.gradePoint, 0) / credits);
}

/** CGPA = Σ(SGPA_sem × credits_sem) / Σ(credits_sem). */
export function cgpa(semesters: Array<{ sgpa: number; credits: number }>): number {
  const credits = semesters.reduce((s, x) => s + x.credits, 0);
  if (!credits) return 0;
  return round2(semesters.reduce((s, x) => s + x.sgpa * x.credits, 0) / credits);
}

const calculations = { round2, gradePoint, pointForMark, hasBacklog, sgpa, cgpa };
export default calculations;
