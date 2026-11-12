import type { Runner } from './catalog.repository';

/** Student lookups – one row per roll number with institution/programme context. */

async function findByRollNo(runner: Runner, rollNo: string) {
  const { rows } = await runner.query(
    `SELECT st.roll_no, st.name, st.sid, st.institution_code, st.programme_code,
            st.batch, st.scheme_id,
            i.name  AS inst_name,
            pr.name AS programme_name,
            pr.short_name AS programme_short_name
       FROM students st
       LEFT JOIN institutions i  ON i.code = st.institution_code
       LEFT JOIN programmes  pr  ON pr.code = st.programme_code
      WHERE st.roll_no = $1`,
    [rollNo]
  );
  return rows[0] ?? null;
}

const studentsRepository = { findByRollNo };

export { studentsRepository };
export default studentsRepository;
