import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import env from '../config/env';

/** SHA-256 hex digest of the uploaded PDF buffer (dedupe via uploads.file_sha256). */
export function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.bcryptRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export default { sha256, hashPassword, comparePassword };
