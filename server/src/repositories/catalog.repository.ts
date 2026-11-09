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

async function upsertProgrammes(runner: Runner, codes: string[]) {
  const uniq = [...new Set((codes || []).filter(Boolean))];
  if (!uniq.length) return [];
  return batchUpsert(runner, {
    table: 'programmes',
    columns: ['code', 'name'],
    rows: uniq.map((c) => [c, c]),
    conflict: '(code)',
    update: 'name = programmes.name',
  });
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

const catalogRepository = { batchUpsert, upsertProgrammes, upsertInstitutions, upsertSchemes, upsertPapers };

export { catalogRepository, batchUpsert };
export default catalogRepository;
