import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { pool } from '../src/config/db';

config();

async function migrate(): Promise<void> {
  const dir = path.join(process.cwd(), 'db', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`Applying migration ${f}...`);
    await pool.query(sql);
  }
  console.log('Migrations complete.');
  await pool.end();
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  migrate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { migrate };
