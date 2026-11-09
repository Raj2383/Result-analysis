import { pool } from '../config/db';

/** Overview read models – consumed by the /overview endpoints. */
export interface OverviewRepoDeps {
  getKpis: (filters: Record<string, unknown>) => Promise<unknown>;
  getBatches: () => Promise<unknown[]>;
  getInstitutions: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getRecentUploads: () => Promise<unknown[]>;
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

export const overviewRepository: OverviewRepoDeps = {
  getKpis: async (filters = {}) => {
    const { where, values } = buildSummaryWhere(filters);
    const { rows } = await pool.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM students) AS students,
        COUNT(*)::int AS evaluated,
        SUM(CASE WHEN ss.overall_status = 'PASS' THEN 1 ELSE 0 END)::int AS passed,
        SUM(CASE WHEN ss.overall_status <> 'PASS' THEN 1 ELSE 0 END)::int AS failed,
        ROUND(AVG(ss.cgpa)::numeric, 2) AS avg_cgpa,
        SUM(ss.credits_earned)::int AS credits_earned,
        SUM(ss.backlog_count)::int AS backlog_total
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
      credits_earned: Number(row.credits_earned ?? 0),
      backlog_total: Number(row.backlog_total ?? 0),
    };
  },
  getBatches: async () => {
    const { rows } = await pool.query('SELECT DISTINCT batch_year FROM semester_summary ORDER BY batch_year DESC');
    return rows.map((r) => Number((r as { batch_year: number }).batch_year));
  },
  getInstitutions: async () => {
    const { rows } = await pool.query('SELECT inst_code, inst_name, canonical_name, short_code FROM institutions ORDER BY inst_code');
    return rows;
  },
  getRecentUploads: async () => {
    const { rows } = await pool.query(
      `SELECT upload_id, original_filename, file_size_bytes, status, students_parsed, results_upserted, marks_upserted, started_at, completed_at
       FROM uploads
       ORDER BY started_at DESC
       LIMIT 10`,
    );
    return rows;
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

export default overviewRepository;
