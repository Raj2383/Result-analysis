import { Runner } from './catalog.repository';

// Ranking queries for topper views.
// Ties: deterministically sorted by score DESC, roll_no ASC.

/** Overall topper list: highest CGPA across all ingested semesters. */
async function overallToppers(
  runner: Runner,
  {
    programmeCode,
    batch,
    limit = 50,
    offset = 0,
  }: { programmeCode?: string; batch?: number; limit?: number; offset?: number } = {}
) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (programmeCode && programmeCode !== 'all') {
    values.push(programmeCode);
    clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
  }
  if (batch && !isNaN(Number(batch))) {
    const rawBatch = Number(batch);
    const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
    const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
    values.push(shortBatch, fullBatch);
    clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  values.push(limit, offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const { rows } = await runner.query(
    `SELECT
       st.roll_no,
       st.name,
       st.institution_code,
       COALESCE(pr.short_name, st.programme_code) AS programme,
       CASE WHEN st.batch < 100 THEN 2000 + st.batch ELSE st.batch END AS batch_year,
       MAX(s.cgpa) AS cgpa,
       MIN(s.university_rank) AS university_rank
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     LEFT JOIN programmes pr ON pr.code = st.programme_code
     ${where}
     GROUP BY st.roll_no, st.name, st.institution_code, pr.short_name, st.programme_code, st.batch
     ORDER BY cgpa DESC, st.roll_no ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values
  );
  return rows;
}

/** Semester-wise toppers: SGPA within one semester. */
async function semesterToppers(
  runner: Runner,
  {
    semester,
    programmeCode,
    batch,
    limit = 50,
    offset = 0,
  }: { semester: number; programmeCode?: string; batch?: number; limit?: number; offset?: number }
) {
  const clauses: string[] = ['s.semester = $1'];
  const values: unknown[] = [semester];
  if (programmeCode && programmeCode !== 'all') {
    values.push(programmeCode);
    clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
  }
  if (batch && !isNaN(Number(batch))) {
    const rawBatch = Number(batch);
    const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
    const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
    values.push(shortBatch, fullBatch);
    clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
  }
  values.push(limit, offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const { rows } = await runner.query(
    `SELECT
       st.roll_no,
       st.name,
       st.institution_code,
       COALESCE(pr.short_name, st.programme_code) AS programme,
       CASE WHEN st.batch < 100 THEN 2000 + st.batch ELSE st.batch END AS batch_year,
       s.semester,
       s.sgpa,
       s.college_rank,
       s.university_rank
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     LEFT JOIN programmes pr ON pr.code = st.programme_code
     WHERE ${clauses.join(' AND ')}
     ORDER BY s.sgpa DESC, st.roll_no ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values
  );
  return rows;
}

/** College-wise topper list (best CGPA within the college). */
async function collegeToppers(
  runner: Runner,
  {
    institutionCode,
    programmeCode,
    batch,
    limit = 50,
    offset = 0,
  }: { institutionCode: string; programmeCode?: string; batch?: number; limit?: number; offset?: number }
) {
  const clauses: string[] = ['st.institution_code = $1'];
  const values: unknown[] = [institutionCode];
  if (programmeCode && programmeCode !== 'all') {
    values.push(programmeCode);
    clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
  }
  if (batch && !isNaN(Number(batch))) {
    const rawBatch = Number(batch);
    const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
    const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
    values.push(shortBatch, fullBatch);
    clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
  }
  values.push(limit, offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const { rows } = await runner.query(
    `SELECT
       st.roll_no,
       st.name,
       st.institution_code,
       COALESCE(pr.short_name, st.programme_code) AS programme,
       CASE WHEN st.batch < 100 THEN 2000 + st.batch ELSE st.batch END AS batch_year,
       MAX(s.cgpa) AS cgpa,
       MIN(s.college_rank) AS college_rank
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     LEFT JOIN programmes pr ON pr.code = st.programme_code
     WHERE ${clauses.join(' AND ')}
     GROUP BY st.roll_no, st.name, st.institution_code, pr.short_name, st.programme_code, st.batch
     ORDER BY cgpa DESC, st.roll_no ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values
  );
  return rows;
}

/** Subject-wise topper for one scheme paper (best total marks). */
async function subjectToppers(
  runner: Runner,
  {
    schemeId,
    paperId,
    programmeCode,
    batch,
    limit = 10,
  }: { schemeId?: string; paperId: string; programmeCode?: string; batch?: number; limit?: number }
) {
  const clauses: string[] = ['p.paper_id = $1', 'm.is_absent = FALSE', 'm.total IS NOT NULL'];
  const values: unknown[] = [paperId];
  if (schemeId) {
    values.push(schemeId);
    clauses.push(`p.scheme_id = $${values.length}`);
  }
  if (programmeCode && programmeCode !== 'all') {
    values.push(programmeCode);
    clauses.push(`(st.programme_code = $${values.length} OR pr.short_name ILIKE $${values.length})`);
  }
  if (batch && !isNaN(Number(batch))) {
    const rawBatch = Number(batch);
    const shortBatch = rawBatch >= 2000 ? rawBatch % 100 : rawBatch;
    const fullBatch = rawBatch >= 2000 ? rawBatch : 2000 + rawBatch;
    values.push(shortBatch, fullBatch);
    clauses.push(`(st.batch = $${values.length - 1} OR st.batch = $${values.length})`);
  }
  values.push(limit);
  const limitIdx = values.length;

  const { rows } = await runner.query(
    `SELECT roll_no, name, institution_code, programme, paper_name, total, grade, rnk FROM (
       SELECT
         st.roll_no,
         st.name,
         st.institution_code,
         COALESCE(pr.short_name, st.programme_code) AS programme,
         COALESCE(p.name, p.code, p.paper_id) AS paper_name,
         m.total,
         m.grade,
         DENSE_RANK() OVER (ORDER BY m.total DESC) AS rnk,
         ROW_NUMBER() OVER (PARTITION BY st.roll_no ORDER BY sr.id DESC) AS latest
       FROM marks m
       JOIN student_results sr ON sr.id = m.result_id
       JOIN students st ON st.roll_no = sr.roll_no
       LEFT JOIN programmes pr ON pr.code = st.programme_code
       JOIN papers p ON p.id = m.paper_pk
       WHERE ${clauses.join(' AND ')}
     ) t WHERE latest = 1 AND rnk <= $${limitIdx}
     ORDER BY rnk ASC, roll_no ASC`,
    values
  );
  return rows;
}

const toppersRepository = { overallToppers, semesterToppers, collegeToppers, subjectToppers };

export { toppersRepository };
export default toppersRepository;
