import { Pool } from 'pg';
import env from './env';

const pool = new Pool(
  env.databaseUrl
    ? { connectionString: env.databaseUrl }
    : {
        host: env.pg.host,
        port: env.pg.port,
        user: env.pg.user,
        password: env.pg.password,
        database: env.pg.database,
      }
);

async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

export { pool, query, getClient };
export default { pool, query, getClient };
