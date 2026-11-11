import { config } from 'dotenv';
import { pool } from '../src/config/db';
import { hashPassword } from '../src/utils/hash';

config();

const GRADE_SCALE = [
  { grade: 'O', min_marks: 90, max_marks: 100, grade_point: 10, description: 'Outstanding', is_passing: true },
  { grade: 'A+', min_marks: 75, max_marks: 89, grade_point: 9, description: 'Excellent', is_passing: true },
  { grade: 'A', min_marks: 65, max_marks: 74, grade_point: 8, description: 'Very Good', is_passing: true },
  { grade: 'B+', min_marks: 55, max_marks: 64, grade_point: 7, description: 'Good', is_passing: true },
  { grade: 'B', min_marks: 50, max_marks: 54, grade_point: 6, description: 'Above Average', is_passing: true },
  { grade: 'C', min_marks: 45, max_marks: 49, grade_point: 5, description: 'Average', is_passing: true },
  { grade: 'P', min_marks: 40, max_marks: 44, grade_point: 4, description: 'Pass', is_passing: true },
  { grade: 'F', min_marks: 0, max_marks: 39, grade_point: 0, description: 'Fail', is_passing: false },
  { grade: 'AB', min_marks: null, max_marks: null, grade_point: 0, description: 'Absent', is_passing: false },
  { grade: 'RL', min_marks: null, max_marks: null, grade_point: 0, description: 'Result Later', is_passing: false },
  { grade: 'D', min_marks: null, max_marks: null, grade_point: 0, description: 'Detained', is_passing: false },
  { grade: 'CAN', min_marks: null, max_marks: null, grade_point: 0, description: 'Cancelled', is_passing: false },
];

const INSTITUTIONS = [
  { code: '142', name: 'JAGANNATH INTERNATIONAL MANAGEMENT SCHOOL, VASANT KUNJ (SHIFT I)' },
  { code: '214', name: 'JAGANNATH INTERNATIONAL MANAGEMENT SCHOOL, VASANT KUNJ (SHIFT II)' },
  { code: '149', name: 'MAHARAJA SURAJMAL INSTITUTE (SHIFT I)' },
  { code: '212', name: 'MAHARAJA SURAJMAL INSTITUTE (SHIFT II)' },
  { code: '177', name: 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES (SHIFT I)' },
  { code: '298', name: 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES (SHIFT II)' },
  { code: '137', name: 'INSTITUTE OF INFORMATION TECHNOLOGY & MANAGEMENT (SHIFT I)' },
  { code: '211', name: 'INSTITUTE OF INFORMATION TECHNOLOGY & MANAGEMENT (SHIFT II)' },
  { code: '140', name: 'JAGAN INSTITUTE OF MANAGEMENT STUDIES, ROHINI (SHIFT I)' },
  { code: '207', name: 'JAGAN INSTITUTE OF MANAGEMENT STUDIES, ROHINI (SHIFT II)' },
  { code: '151', name: 'TRINITY INSTITUTE OF PROFESSIONAL STUDIES (SHIFT I)' },
  { code: '240', name: 'TRINITY INSTITUTE OF PROFESSIONAL STUDIES (SHIFT II)' },
];

export async function seed(): Promise<void> {
  for (const inst of INSTITUTIONS) {
    await pool.query(
      `INSERT INTO institutions (code, name)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
      [inst.code, inst.name]
    );
  }

  for (const g of GRADE_SCALE) {
    await pool.query(
      `INSERT INTO grade_scale (grade, min_marks, max_marks, grade_point, description, is_passing)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (grade) DO UPDATE SET min_marks=EXCLUDED.min_marks, max_marks=EXCLUDED.max_marks, grade_point=EXCLUDED.grade_point, description=EXCLUDED.description, is_passing=EXCLUDED.is_passing`,
      [g.grade, g.min_marks, g.max_marks, g.grade_point, g.description, g.is_passing]
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
      `INSERT INTO users (role, username, password_hash, name, full_name, email)
       VALUES ($1,$2,$3,$4,$4,$5)
       ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, name=EXCLUDED.name, full_name=EXCLUDED.full_name`,
      [role, username, hash, name, `${username}@resultlens.local`]
    );
  }
  console.log('Seed complete: institutions + grade_scale + admin + faculty.');
  await pool.end();
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
