import type { Runner } from './catalog.repository';

/** semester_summary repositories: latest-attempt marks, scale, upserts, rank refresh. */

async function getGradeScale(runner: Runner) {
  const { rows } = await runner.query('SELECT grade, min_marks, max_marks, grade_point FROM grade_scale');
  return rows;
}

async function getLatestMarks(runner: Runner, rollNos: string[]) {
  if (!rollNos || !rollNos.length) return [];
  const { rows } = await runner.query(
    `SELECT roll_no, semester, institution_code, credits, internal, external, total, grade, is_absent,
            paper_name, paper_code
     FROM (
       SELECT sr.roll_no, e.semester, st.institution_code, p.credits,
              m.internal, m.external, m.total, m.grade, m.is_absent,
              p.name AS paper_name, p.code AS paper_code,
              ROW_NUMBER() OVER (PARTITION BY sr.roll_no, m.paper_pk ORDER BY sr.id DESC) AS rn
       FROM marks m
       JOIN student_results sr ON sr.id = m.result_id
       JOIN exams e ON e.id = sr.exam_id
       JOIN students st ON st.roll_no = sr.roll_no
       JOIN papers p ON p.id = m.paper_pk
       WHERE sr.roll_no = ANY($1)
     ) t WHERE rn = 1
     ORDER BY semester, paper_code NULLS LAST, paper_name NULLS LAST`,
    [rollNos]
  );
  return rows;
}

async function upsertSummaries(runner: Runner, rows: Array<Record<string, unknown>>) {
  if (!rows || !rows.length) return [];
  const { batchUpsert } = await import('./catalog.repository');
  return batchUpsert(runner, {
    table: 'semester_summary',
    columns: ['roll_no', 'semester', 'sgpa', 'cgpa', 'total_credits', 'has_backlog'],
    rows: rows.map((r) => [r.roll_no, r.semester, r.sgpa, r.cgpa, r.total_credits, r.has_backlog]),
    conflict: '(roll_no, semester)',
    update:
      'sgpa = EXCLUDED.sgpa, cgpa = EXCLUDED.cgpa, total_credits = EXCLUDED.total_credits, ' +
      'has_backlog = EXCLUDED.has_backlog, updated_at = NOW()',
  });
}

async function refreshRanks(runner: Runner) {
  await runner.query(
    `UPDATE semester_summary s
     SET college_rank = r.college_rank, university_rank = r.university_rank, updated_at = NOW()
     FROM (
       SELECT s2.roll_no, s2.semester,
              RANK() OVER (PARTITION BY st.institution_code, s2.semester ORDER BY s2.sgpa DESC) AS college_rank,
              RANK() OVER (PARTITION BY s2.semester ORDER BY s2.sgpa DESC) AS university_rank
       FROM semester_summary s2
       JOIN students st ON st.roll_no = s2.roll_no
     ) r
     WHERE s.roll_no = r.roll_no AND s.semester = r.semester`
  );
}

const summaryRepository = { getGradeScale, getLatestMarks, upsertSummaries, refreshRanks };

export { summaryRepository };
export default summaryRepository;
