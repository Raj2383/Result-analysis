/**
 * GGSIPU Ordinance 11 pure domain logic:
 *  - Pass rule: combined total (internal + external) >= 40% of 100 (40 marks).
 *  - Grace marks (`*`): official printed total/grade always wins; compute grace_amount.
 *  - Absent (`A`) vs numeric zero (`0`) vs NUES dash (`-`).
 *  - Low internal aggregate pass (Ordinance 11 overrides strict component cutoffs by default).
 */

export interface Ordinance11Input {
  internalRaw: string;
  externalRaw: string;
  totalGradeRaw: string;
  minInternalPct?: number | null;
  minExternalPct?: number | null;
}

export interface Ordinance11Result {
  internalScore: number | null;
  externalScore: number | null;
  computedSum: number | null;
  totalScore: number | null;
  grade: string;
  gradePoint: number;
  creditPoints: number;
  isGrace: boolean;
  graceAmount: number;
  isAbsentInternal: boolean;
  isAbsentExternal: boolean;
  isNuesDash: boolean;
  isPassed: boolean;
  paperStatus: 'PASS' | 'GRACE_PASS' | 'FAIL' | 'ABSENT' | 'RL' | 'DETAINED' | 'CANCELLED' | 'ALREADY_PASSED';
  belowComponentCutoff: boolean;
}

/** Grade lookup bands come from DB (grade_scale); this map is only a fallback mirror for pure unit tests. */
const GRADE_BANDS: Array<{ grade: string; min: number; max: number; point: number }> = [
  { grade: 'O', min: 90, max: 100, point: 10 },
  { grade: 'A+', min: 75, max: 89, point: 9 },
  { grade: 'A', min: 65, max: 74, point: 8 },
  { grade: 'B+', min: 55, max: 64, point: 7 },
  { grade: 'B', min: 50, max: 54, point: 6 },
  { grade: 'C', min: 45, max: 49, point: 5 },
  { grade: 'P', min: 40, max: 44, point: 4 },
  { grade: 'F', min: 0, max: 39, point: 0 },
];

export function gradePointFor(total: number | null | undefined, scale?: Array<{ grade: string; min_marks: number; max_marks: number; grade_point: number }>): number {
  if (total == null) return 0;
  const row = scale?.find((r) => total >= r.min_marks && total <= r.max_marks);
  if (row) return row.grade_point;
  const band = GRADE_BANDS.find((b) => total >= b.min && total <= b.max);
  return band ? band.point : 0;
}

export function evaluateOrdinance11(input: Ordinance11Input, scale?: Array<{ grade: string; min_marks: number; max_marks: number; grade_point: number }>): Ordinance11Result {
  const internalRaw = String(input.internalRaw ?? '').trim();
  const externalRaw = String(input.externalRaw ?? '').trim();
  const totalGradeRaw = String(input.totalGradeRaw ?? '').trim();

  const isAbsentInternal = internalRaw.toUpperCase() === 'A';
  const isAbsentExternal = externalRaw.toUpperCase() === 'A';
  const isNuesDash = internalRaw.toUpperCase() === '-' || externalRaw.toUpperCase() === '-';

  const internalScore = isAbsentInternal || isNuesDash ? null : Number(internalRaw) || 0;
  const externalScore = isAbsentExternal || isNuesDash ? null : Number(externalRaw) || 0;

  let totalScore: number | null = null;
  let grade = 'F';
  let isGrace = false;

  const absentTotal = /^A$/i.test(totalGradeRaw) || /A/i.test(totalGradeRaw.split('(')[0] || '');
  const graceStar = /\*/i.test(totalGradeRaw);
  const gradeMatch = /^A?\s*(\d{1,3})?\s*\(\s*([A-Z+]*)\s*\)?\s*(\*)?$/i.exec(totalGradeRaw.trim());

  if (gradeMatch) {
    const rawTotal = gradeMatch[1];
    const rawGrade = (gradeMatch[2] || '').trim().toUpperCase();
    isGrace = Boolean(gradeMatch[3]);
    if (rawTotal) {
      totalScore = Number(rawTotal);
      grade = rawGrade || 'F';
    } else {
      totalScore = null;
      grade = 'AB';
    }
  } else if (totalGradeRaw) {
    const m = /^(\d{1,3})\s*\(\s*([A-Z+]*)\s*\)?\s*(\*)?$/i.exec(totalGradeRaw.trim());
    if (m) {
      totalScore = Number(m[1]);
      grade = (m[2] || 'F').toUpperCase();
      isGrace = Boolean(m[3]);
    }
  }

  const gp = gradePointFor(totalScore, scale);
  const gradeRow = scale?.find((r) => r.grade === grade);
  const finalGradePoint = gradeRow ? gradeRow.grade_point : gp;
  const credit = 4; // placeholder credits — real credits come from scheme papers in services
  const creditPoints = finalGradePoint * credit;

  const passing = totalScore != null && totalScore >= 40 && finalGradePoint > 0;
  const componentCutoff = (pct: number | null | undefined, score: number | null, max: number) =>
    pct != null && score != null && score < Math.round((max * pct) / 100);

  const belowComponentCutoff =
    componentCutoff(input.minInternalPct, internalScore, 25) || componentCutoff(input.minExternalPct, externalScore, 75);

  let paperStatus: Ordinance11Result['paperStatus'];
  if (isGrace) paperStatus = 'GRACE_PASS';
  else if (totalScore == null) paperStatus = 'ABSENT';
  else if (totalScore >= 40 && finalGradePoint > 0) paperStatus = 'PASS';
  else paperStatus = 'FAIL';

  const isPassed = paperStatus === 'PASS' || paperStatus === 'GRACE_PASS';

  const computedSum = internalScore == null || externalScore == null ? null : internalScore + externalScore;
  const graceAmount = totalScore != null && computedSum != null ? Math.max(0, totalScore - computedSum) : 0;

  return {
    internalScore,
    externalScore,
    computedSum,
    totalScore,
    grade,
    gradePoint: finalGradePoint,
    creditPoints,
    isGrace,
    graceAmount,
    isAbsentInternal,
    isAbsentExternal,
    isNuesDash,
    isPassed,
    paperStatus,
    belowComponentCutoff,
  };
}

export default { evaluateOrdinance11, gradePointFor };
