import { config } from 'dotenv';
import { pool } from '../src/config/db';
import { hashPassword } from '../src/utils/hash';

config();

const GRADE_SCALE = [
  { grade: 'O', min_marks: 90, max_marks: 100, grade_point: 10 },
  { grade: 'A+', min_marks: 75, max_marks: 89, grade_point: 9 },
  { grade: 'A', min_marks: 65, max_marks: 74, grade_point: 8 },
  { grade: 'B+', min_marks: 55, max_marks: 64, grade_point: 7 },
  { grade: 'B', min_marks: 50, max_marks: 54, grade_point: 6 },
  { grade: 'C', min_marks: 45, max_marks: 49, grade_point: 5 },
  { grade: 'P', min_marks: 40, max_marks: 44, grade_point: 4 },
  { grade: 'F', min_marks: 0, max_marks: 39, grade_point: 0 },
];

export async function seed(): Promise<void> {
  for (const g of GRADE_SCALE) {
    await pool.query(
      `INSERT INTO grade_scale (grade, min_marks, max_marks, grade_point)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (grade) DO UPDATE SET min_marks=EXCLUDED.min_marks, max_marks=EXCLUDED.max_marks, grade_point=EXCLUDED.grade_point`,
      [g.grade, g.min_marks, g.max_marks, g.grade_point]
    );
  }
  const adminU = process.env.ADMIN_USERNAME || 'admin';
  const adminP = process.env.ADMIN_PASSWORD || 'Admin@123';
  const facU = process.env.FACULTY_USERNAME || 'faculty';
  const facP = process.env.FACULTY_PASSWORD || 'Faculty@123';

  for (const [username, password, role, name] of [
    [adminU, adminP, 'admin', 'Administrator'],
    [facU, facP, 'faculty', 'Seed Faculty'],
  ]) {
    const hash = await hashPassword(password);
    await pool.query(
      `INSERT INTO users (role, username, password_hash, name)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
      [role, username, hash, name]
    );
  }
  console.log('Seed complete: grade_scale + admin + faculty.');
  await pool.end();
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
