import { sgpa, cgpa, pointForMark, hasBacklog } from '../utils/calculations';
import summaryRepo from '../repositories/summary.repository';
import { Runner } from '../repositories/catalog.repository';

export interface ResultsServiceDeps {
  summary?: typeof summaryRepo;
  students?: { search: (runner: Runner, q: string, limit: number, offset: number) => Promise<{ items: unknown[]; total: number }> };
  runner?: Runner;
}

export function createResultsService(deps: ResultsServiceDeps = {}) {
  const summary = deps.summary ?? summaryRepo;

  async function recomputeSummaries(runner: Runner, rollNos: string[]) {
    const rolls = [...new Set((rollNos || []).filter(Boolean))];
    if (!rolls.length) return { students: 0, semesters: 0 };
    const db = runner as { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> };
    const [scale, marks] = await Promise.all([
      summary.getGradeScale(db),
      summary.getLatestMarks(db, rolls),
    ]);
    const byStudent = new Map<string, Map<number, any[]>>();
    for (const row of marks) {
      if (!byStudent.has(row.roll_no)) byStudent.set(row.roll_no, new Map());
      const sems = byStudent.get(row.roll_no)!;
      if (!sems.has(row.semester)) sems.set(row.semester, []);
      sems.get(row.semester)!.push(row);
    }
    const semRows: Array<Record<string, unknown>> = [];
    for (const [roll, sems] of byStudent) {
      const aggs = [];
      for (const [semester, rows] of sems) {
        const papers = rows.map((r) => ({ credits: r.credits, gradePoint: pointForMark(r.total, scale) }));
        const credits = rows.reduce((a, r) => a + (r.credits || 0), 0);
        aggs.push({ semester, sgpa: sgpa(papers), credits, backlog: hasBacklog(rows) });
      }
      const c = cgpa(aggs.map((a) => ({ sgpa: a.sgpa, credits: a.credits })));
      for (const a of aggs) {
        semRows.push({
          roll_no: roll,
          semester: a.semester,
          sgpa: a.sgpa,
          cgpa: c,
          total_credits: a.credits,
          has_backlog: a.backlog,
        });
      }
    }
    if (semRows.length) await summary.upsertSummaries(runner, semRows);
    await summary.refreshRanks(runner);
    return { students: byStudent.size, semesters: semRows.length };
  }

  async function getStudentResult({ rollNo, semester }: { rollNo: string; semester?: number }) {
    const runner: Runner = deps.runner ?? ({ query: async () => ({ rows: [] }) } as Runner);
    const scale = await summary.getGradeScale(runner);
    const marks = (await summary.getLatestMarks(runner, [rollNo])) as Array<Record<string, unknown>>;
    const rows = (semester ? marks.filter((m) => m.semester === semester) : marks) as Array<Record<string, unknown>>;
    const sgpaVal = sgpa(rows.map((r) => ({ credits: (r.credits as number) ?? 0, gradePoint: pointForMark(r.total as number, scale) })));
    const cgpaVal = cgpa(rows.map((r) => ({ sgpa: sgpaVal, credits: (r.credits as number) ?? 0 })));
    return {
      student: { rollNo },
      summary: { semester: (rows[0] as { semester?: number })?.semester ?? semester ?? 0, sgpa: sgpaVal, cgpa: cgpaVal, marks: rows },
      marks: rows,
    };
  }

  async function searchStudents({ q, limit, page }: { q: string; limit: number; page: number }) {
    const students = deps.students ?? { search: async () => ({ items: [], total: 0 }) };
    const { items, total } = await students.search(
      deps.runner ?? ({ query: async () => ({ rows: [] }) } as Runner),
      q,
      limit,
      (page - 1) * limit
    );
    return { items, page, limit, total };
  }

  return { recomputeSummaries, getStudentResult, searchStudents };
}

import db from '../config/db';
export default createResultsService({ runner: db as unknown as Runner });
export { createResultsService as createResultService };
