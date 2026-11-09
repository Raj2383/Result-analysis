import type { PoolClient } from 'pg';

export interface Runner {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  release?: () => void;
}

const CHUNK = 500;

/** Generic batched INSERT ... ON CONFLICT upsert. */
async function batchUpsert(runner: Runner, opts: {
  table: string;
  columns: string[];
  rows: unknown[][];
  conflict: string;
  update: string;
  returning?: string;
}) {
  const out: any[] = [];
  for (let i = 0; i < opts.rows.length; i += CHUNK) {
    const chunk = opts.rows.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const groups = chunk.map((row, ri) => {
      const placeholders = row.map((_, ci) => `$${ri * row.length + ci + 1}`);
      values.push(...row);
      return `(${placeholders.join(',')})`;
    });
    const sql =
      `INSERT INTO ${opts.table} (${opts.columns.join(',')}) VALUES ${groups.join(',')}` +
      ` ON CONFLICT ${opts.conflict} DO UPDATE SET ${opts.update}` +
      (opts.returning ? ` RETURNING ${opts.returning}` : '');
    const { rows: returned } = await runner.query(sql, values);
    out.push(...returned);
  }
  return out;
}

export const KNOWN_PROGRAMMES: Record<string, { name: string; short_name: string; degree_level: string }> = {
  '020': { name: 'Bachelor of Computer Applications', short_name: 'BCA', degree_level: 'UG' },
  '044': { name: 'Master of Computer Applications', short_name: 'MCA', degree_level: 'PG' },
  '027': { name: 'B.Tech (Computer Science & Engineering)', short_name: 'B.Tech CSE', degree_level: 'UG' },
  '028': { name: 'B.Tech (Electronics & Communication Engineering)', short_name: 'B.Tech ECE', degree_level: 'UG' },
  '017': { name: 'Bachelor of Business Administration', short_name: 'BBA', degree_level: 'UG' },
  '031': { name: 'Bachelor of Commerce (Honours)', short_name: 'B.Com (Hons)', degree_level: 'UG' },
  '040': { name: 'B.A. LL.B. (Honours)', short_name: 'BA LLB', degree_level: 'UG' },
  '088': { name: 'B.Tech (Artificial Intelligence & Data Science)', short_name: 'B.Tech AI-DS', degree_level: 'UG' },
};

async function upsertProgrammes(runner: Runner, codes: string[]) {
  const uniq = [...new Set((codes || []).filter(Boolean))];
  if (!uniq.length) return [];
  const rows = uniq.map((c) => {
    const meta = KNOWN_PROGRAMMES[c];
    return [c, meta?.name || `Programme ${c}`, meta?.short_name || c, meta?.degree_level || 'UG'];
  });
  return batchUpsert(runner, {
    table: 'programmes',
    columns: ['code', 'name', 'short_name', 'degree_level'],
    rows,
    conflict: '(code)',
    update: 'name = EXCLUDED.name, short_name = EXCLUDED.short_name, degree_level = EXCLUDED.degree_level',
  });
}

async function getProgrammes(runner: Runner) {
  const { rows } = await runner.query(
    `SELECT
       p.code,
       COALESCE(p.short_name, p.code) AS short_name,
       COALESCE(p.name, p.code) AS name,
       p.degree_level,
       COUNT(DISTINCT st.roll_no)::int AS student_count
     FROM programmes p
     LEFT JOIN students st ON st.programme_code = p.code
     GROUP BY p.code, p.short_name, p.name, p.degree_level
     HAVING COUNT(DISTINCT st.roll_no) > 0
     ORDER BY student_count DESC, p.code ASC`
  );
  return rows;
}

async function upsertInstitutions(runner: Runner, institutions: Array<{ code: string; name: string }>) {
  const uniq = [...new Map((institutions || []).map((x) => [x.code, x])).values()];
  if (!uniq.length) return [];
  return batchUpsert(runner, {
    table: 'institutions',
    columns: ['code', 'name'],
    rows: uniq.map((x) => [x.code, x.name]),
    conflict: '(code)',
    update: 'name = EXCLUDED.name',
  });
}

async function upsertSchemes(runner: Runner, schemes: Array<{ scheme_id: string; institution_code?: string | null; programme_code?: string | null; semester?: number | null }>) {
  const valid = (schemes || []).filter((s) => s.scheme_id && s.semester != null);
  if (!valid.length) return [];
  return batchUpsert(runner, {
    table: 'schemes',
    columns: ['scheme_id', 'institution_code', 'programme_code', 'semester'],
    rows: valid.map((s) => [s.scheme_id, s.institution_code || null, s.programme_code || null, s.semester]),
    conflict: '(scheme_id)',
    update: 'institution_code = EXCLUDED.institution_code, semester = EXCLUDED.semester',
  });
}

async function upsertPapers(
  runner: Runner,
  papers: Array<{
    scheme_id: string;
    paper_id: string;
    code?: string | null;
    name?: string;
    credits?: number;
    paper_type?: string | null;
    exam_mode?: string | null;
    kind?: string | null;
    minor_max?: number | null;
    major_max?: number | null;
    max_marks?: number | null;
    pass_marks?: number | null;
  }>
) {
  if (!papers || !papers.length) return [];
  return batchUpsert(runner, {
    table: 'papers',
    columns: [
      'scheme_id', 'paper_id', 'code', 'name', 'credits', 'paper_type',
      'exam_mode', 'kind', 'minor_max', 'major_max', 'max_marks', 'pass_marks',
    ],
    rows: papers.map((p) => [
      p.scheme_id, p.paper_id, p.code || null, p.name, p.credits,
      p.paper_type || null, p.exam_mode || null, p.kind || null,
      p.minor_max ?? null, p.major_max ?? null, p.max_marks ?? null, p.pass_marks ?? null,
    ]),
    conflict: '(scheme_id, paper_id)',
    update: [
      'code = EXCLUDED.code', 'name = EXCLUDED.name', 'credits = EXCLUDED.credits',
      'paper_type = EXCLUDED.paper_type', 'exam_mode = EXCLUDED.exam_mode', 'kind = EXCLUDED.kind',
      'minor_max = EXCLUDED.minor_max', 'major_max = EXCLUDED.major_max',
      'max_marks = EXCLUDED.max_marks', 'pass_marks = EXCLUDED.pass_marks',
    ].join(', '),
    returning: 'id, scheme_id, paper_id',
  });
}

const catalogRepository = { batchUpsert, upsertProgrammes, getProgrammes, upsertInstitutions, upsertSchemes, upsertPapers };

export { catalogRepository, batchUpsert, upsertProgrammes, getProgrammes, upsertInstitutions, upsertSchemes, upsertPapers };
export default catalogRepository;
