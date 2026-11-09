import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { pool } from '../config/db';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       p.code,
       COALESCE(p.short_name, p.code) AS short_name,
       COALESCE(p.name, p.code) AS name,
       p.degree_level,
       COUNT(DISTINCT st.roll_no)::int AS student_count,
       ARRAY_AGG(DISTINCT (CASE WHEN st.batch < 100 THEN 2000 + st.batch ELSE st.batch END))
         FILTER (WHERE st.batch IS NOT NULL) AS batches,
       ARRAY_AGG(DISTINCT ss.semester ORDER BY ss.semester ASC)
         FILTER (WHERE ss.semester IS NOT NULL) AS semesters
     FROM programmes p
     LEFT JOIN students st ON st.programme_code = p.code
     LEFT JOIN semester_summary ss ON ss.roll_no = st.roll_no
     GROUP BY p.code, p.short_name, p.name, p.degree_level
     HAVING COUNT(DISTINCT st.roll_no) > 0
     ORDER BY student_count DESC, p.code ASC`
  );
  return apiResponse(res, { data: rows, message: 'OK' });
}));

export default router;
