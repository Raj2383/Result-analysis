import { Runner } from './catalog.repository';

// Ranking queries for topper views (consumed by toppers.service in Phase 6).
// Ties: subject toppers return ALL tied students (RANK() <= limit); CGPA/SGPA
// toppers break ties deterministically by roll_no so pages are stable.
// Latest attempt per paper = greatest student_results.id.

/** Overall topper list: highest CGPA across all ingested semesters. */
async function overallToppers(
  runner: Runner,
  { limit = 10, offset = 0 }: { limit?: number; offset?: number } = {}
) {
  const { rows } = await runner.query(
    `SELECT st.roll_no, st.name, st.institution_code, MAX(s.cgpa) AS cgpa
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     GROUP BY st.roll_no, st.name, st.institution_code
     ORDER BY cgpa DESC, st.roll_no ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

/** Semester-wise toppers: SGPA within one semester (ranks precomputed in Phase 4 refresh). */
async function semesterToppers(
  runner: Runner,
  { semester, limit = 10, offset = 0 }: { semester: number; limit?: number; offset?: number }
) {
  const { rows } = await runner.query(
    `SELECT st.roll_no, st.name, st.institution_code, s.sgpa, s.college_rank, s.university_rank
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     WHERE s.semester = $1
     ORDER BY s.sgpa DESC, st.roll_no ASC
     LIMIT $2 OFFSET $3`,
    [semester, limit, offset]
  );
  return rows;
}

/** College-wise topper list (best CGPA within the college). */
async function collegeToppers(
  runner: Runner,
  { institutionCode, limit = 10, offset = 0 }: { institutionCode: string; limit?: number; offset?: number }
) {
  const { rows } = await runner.query(
    `SELECT st.roll_no, st.name, MAX(s.cgpa) AS cgpa
     FROM semester_summary s
     JOIN students st ON st.roll_no = s.roll_no
     WHERE st.institution_code = $1
     GROUP BY st.roll_no, st.name
     ORDER BY cgpa DESC, st.roll_no ASC
     LIMIT $2 OFFSET $3`,
    [institutionCode, limit, offset]
  );
  return rows;
}

/** Subject-wise topper for one scheme paper (best total marks). */
async function subjectToppers(
  runner: Runner,
  { schemeId, paperId, limit = 3 }: { schemeId: string; paperId: string; limit?: number }
) {
  const { rows } = await runner.query(
    `SELECT roll_no, name, institution_code, paper_name, total, grade, rnk FROM (
       SELECT st.roll_no, st.name, st.institution_code, p.name AS paper_name,
              m.total, m.grade,
              RANK() OVER (ORDER BY m.total DESC) AS rnk,
              ROW_NUMBER() OVER (PARTITION BY st.roll_no ORDER BY sr.id DESC) AS latest
       FROM marks m
       JOIN student_results sr ON sr.id = m.result_id
       JOIN students st ON st.roll_no = sr.roll_no
       JOIN papers p ON p.id = m.paper_pk
       WHERE p.scheme_id = $1 AND p.paper_id = $2 AND m.is_absent = FALSE
     ) t WHERE latest = 1 AND rnk <= $3
     ORDER BY rnk ASC, roll_no ASC`,
    [schemeId, paperId, limit]
  );
  return rows;
}

const toppersRepository = { overallToppers, semesterToppers, collegeToppers, subjectToppers };

export { toppersRepository };
export default toppersRepository;
