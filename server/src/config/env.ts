import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing env var: ${name}`);
  return v;
}

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'resultlens',
    password: process.env.PGPASSWORD || 'resultlens',
    database: process.env.PGDATABASE || 'resultlens',
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-only-change-me-min-32-chars-xxxxxx'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    cookieName: process.env.JWT_COOKIE_NAME || 'access_token',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  maxPdfMb: Number(process.env.MAX_PDF_MB || 10),
};

export default env;
export { env };
