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
  if (filters.semester != null && String(filters.semester).trim() !== '' && String(filters.semester) !== 'all') {
    values.push(Number(filters.semester));
    clauses.push(`ss.semester = $${values.length}`);
  }
  if (filters.instCode && String(filters.instCode).trim() !== '' && String(filters.instCode) !== 'all') {
    values.push(String(filters.instCode));
    clauses.push(`st.institution_code = $${values.length}`);
  }
  const prog = String(filters.programmeCode || filters.course || '').trim();
  if (prog && prog !== 'all') {
    values.push(prog);
    clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
  }
  const rawBatch = Number(filters.batch || filters.year);
  if (!isNaN(rawBatch) && rawBatch > 0) {
    const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
    const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
    values.push(shortBatch, fullBatch);
    clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, values };
}

export const analyticsRepository: AnalyticsRepoDeps = {
  getSummary: async (filters = {}) => {
    const { where, values } = buildSummaryWhere(filters);
    const { rows } = await pool.query(
      `SELECT
        COUNT(*)::int AS students,
        COUNT(*)::int AS evaluated,
        ROUND(AVG(ss.cgpa)::numeric, 2) AS avg_cgpa,
        0 AS avg_percentage,
        SUM(CASE WHEN ss.has_backlog = FALSE THEN 1 ELSE 0 END)::int AS passed,
        SUM(CASE WHEN ss.has_backlog = TRUE  THEN 1 ELSE 0 END)::int AS failed,
        SUM(CASE WHEN ss.has_backlog = TRUE THEN 1 ELSE 0 END)::int AS backlog_total,
        0 AS grace_papers,
        0 AS grace_marks
       FROM semester_summary ss
       JOIN students st ON st.roll_no = ss.roll_no
       LEFT JOIN programmes pr ON pr.code = st.programme_code
       ${where}`,
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
      avg_percentage: 0,
      backlog_total: Number(row.backlog_total ?? 0),
      grace_papers: 0,
      grace_marks: 0,
    };
  },

  getCollegeStats: async (filters = {}) => {
    const { where, values } = buildSummaryWhere(filters);
    const { rows } = await pool.query(
      `SELECT
        st.institution_code,
        i.name AS inst_name,
        COUNT(*)::int AS students,
        ROUND(AVG(ss.cgpa)::numeric, 2) AS avg_cgpa,
        ROUND(AVG(ss.sgpa)::numeric, 2) AS avg_sgpa,
        ROUND((SUM(CASE WHEN ss.has_backlog = FALSE THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS pass_rate
       FROM semester_summary ss
       JOIN students st ON st.roll_no = ss.roll_no
       LEFT JOIN programmes pr ON pr.code = st.programme_code
       LEFT JOIN institutions i ON i.code = st.institution_code
       ${where}
       GROUP BY st.institution_code, i.name
       ORDER BY avg_cgpa DESC NULLS LAST, students DESC
       LIMIT 20`,
      values,
    );
    return rows;
  },

  getSubjectStats: async (filters = {}) => {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.semester != null && String(filters.semester).trim() !== '' && String(filters.semester) !== 'all') {
      values.push(Number(filters.semester));
      clauses.push(`e.semester = $${values.length}`);
    }
    if (filters.instCode && String(filters.instCode).trim() !== '' && String(filters.instCode) !== 'all') {
      values.push(String(filters.instCode));
      clauses.push(`st.institution_code = $${values.length}`);
    }
    const prog = String(filters.programmeCode || filters.course || '').trim();
    if (prog && prog !== 'all') {
      values.push(prog);
      clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
    }
    const rawBatch = Number(filters.batch || filters.year);
    if (!isNaN(rawBatch) && rawBatch > 0) {
      const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
      const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
      values.push(shortBatch, fullBatch);
      clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT
        p.paper_id AS paper_code,
        COALESCE(p.name, p.code, p.paper_id) AS paper_name,
        COUNT(*)::int AS appeared,
        SUM(CASE WHEN m.grade NOT IN ('F','AB','RL','D','CAN') THEN 1 ELSE 0 END)::int AS passed,
        ROUND((SUM(CASE WHEN m.grade NOT IN ('F','AB','RL','D','CAN') THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS pass_rate,
        ROUND(AVG(m.total)::numeric, 2) AS avg_total
       FROM marks m
       JOIN student_results sr ON sr.id = m.result_id
       JOIN students st ON st.roll_no = sr.roll_no
       LEFT JOIN programmes pr ON pr.code = st.programme_code
       JOIN exams e ON e.id = sr.exam_id
       JOIN papers p ON p.id = m.paper_pk
       ${where}
       GROUP BY p.paper_id, p.name, p.code
       HAVING COUNT(*) >= 1
       ORDER BY pass_rate DESC NULLS LAST, appeared DESC
       LIMIT 20`,
      values,
    );
    return rows;
  },
};

export default analyticsRepository;
