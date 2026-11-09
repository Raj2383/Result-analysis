import { pool } from '../config/db';

/** Aggregate analytics read model – consumed by the /analytics endpoints. */
export interface AnalyticsRepoDeps {
  getSummary: (filters: Record<string, unknown>) => Promise<unknown>;
  getCollegeStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getSubjectStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
}

function buildSummaryWhere(filters: Record<string, unknown>) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters.batchYear != null) {
    values.push(Number(filters.batchYear));
    clauses.push(`ss.batch_year = $${values.length}`);
  }
  if (filters.semester != null) {
    values.push(Number(filters.semester));
    clauses.push(`ss.semester = $${values.length}`);
  }
  if (filters.instCode) {
    values.push(String(filters.instCode));
    clauses.push(`i.inst_code = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, values };
}

export const analyticsRepository: AnalyticsRepoDeps = {
  getSummary: async (filters = {}) => {
    const { where, values } = buildSummaryWhere(filters);
    const { rows } = await pool.query(
      `
      SELECT
        COUNT(*)::int AS students,
        COUNT(*)::int AS evaluated,
        ROUND(AVG(ss.cgpa)::numeric, 2) AS avg_cgpa,
        ROUND(AVG(ss.percentage)::numeric, 2) AS avg_percentage,
        SUM(CASE WHEN ss.overall_status = 'PASS' THEN 1 ELSE 0 END)::int AS passed,
        SUM(CASE WHEN ss.overall_status <> 'PASS' THEN 1 ELSE 0 END)::int AS failed,
        SUM(ss.backlog_count)::int AS backlog_total,
        SUM(ss.grace_papers_count)::int AS grace_papers,
        SUM(ss.total_grace_marks)::int AS grace_marks
      FROM semester_summary ss
      JOIN institutions i ON i.inst_id = ss.inst_id
      ${where}
    `,
      values,
    );
    const row = (rows[0] ?? {}) as Record<string, number | null>;
    const evaluated = Number(row.evaluated ?? 0);
    const passed = Number(row.passed ?? 0);
    return {
      students: Number(row.students ?? 0),
      evaluated,
      passed,
      failed: Number(row.failed ?? 0),
      pass_rate: evaluated > 0 ? Number(((passed / evaluated) * 100).toFixed(2)) : 0,
      avg_cgpa: Number(row.avg_cgpa ?? 0),
      avg_percentage: Number(row.avg_percentage ?? 0),
      backlog_total: Number(row.backlog_total ?? 0),
      grace_papers: Number(row.grace_papers ?? 0),
      grace_marks: Number(row.grace_marks ?? 0),
    };
  },

  getCollegeStats: async (filters = {}) => {
    const { where, values } = buildSummaryWhere(filters);
    const { rows } = await pool.query(
      `
      SELECT
        i.inst_code,
        i.inst_name,
        i.canonical_name,
        COUNT(*)::int AS students,
        ROUND(AVG(ss.cgpa)::numeric, 2) AS avg_cgpa,
        ROUND(AVG(ss.sgpa)::numeric, 2) AS avg_sgpa,
        ROUND((SUM(CASE WHEN ss.overall_status = 'PASS' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS pass_rate
      FROM semester_summary ss
      JOIN institutions i ON i.inst_id = ss.inst_id
      ${where}
      GROUP BY i.inst_code, i.inst_name, i.canonical_name
      ORDER BY avg_cgpa DESC NULLS LAST, students DESC
      LIMIT 20
    `,
      values,
    );
    return rows;
  },

  getSubjectStats: async (filters = {}) => {
    const clauses: string[] = ['m.is_effective_latest = TRUE'];
    const values: unknown[] = [];
    if (filters.batchYear != null) {
      values.push(Number(filters.batchYear));
      clauses.push(`s.batch_year = $${values.length}`);
    }
    if (filters.semester != null) {
      values.push(Number(filters.semester));
      clauses.push(`m.semester = $${values.length}`);
    }
    if (filters.instCode) {
      values.push(String(filters.instCode));
      clauses.push(`i.inst_code = $${values.length}`);
    }
    const where = `WHERE ${clauses.join(' AND ')}`;
    const { rows } = await pool.query(
      `
      SELECT
        m.paper_id_code AS paper_code,
        COALESCE(MAX(p.title), MAX(p.paper_code), m.paper_id_code) AS paper_name,
        COUNT(*)::int AS appeared,
        SUM(CASE WHEN m.is_passed THEN 1 ELSE 0 END)::int AS passed,
        ROUND((SUM(CASE WHEN m.is_passed THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS pass_rate,
        ROUND(AVG(m.total_score)::numeric, 2) AS avg_total
      FROM marks m
      JOIN students s ON s.roll_no = m.student_roll_no
      JOIN institutions i ON i.inst_id = s.inst_id
      LEFT JOIN papers p ON p.paper_id = m.paper_id OR p.paper_id_code = m.paper_id_code
      ${where}
      GROUP BY m.paper_id_code
      HAVING COUNT(*) >= 1
      ORDER BY pass_rate DESC NULLS LAST, appeared DESC
      LIMIT 20
    `,
      values,
    );
    return rows;
  },
};

export default analyticsRepository;
