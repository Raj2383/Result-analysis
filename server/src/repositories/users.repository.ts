import { query } from '../config/db';

// ALL SQL lives here – one file per domain. Parameterized queries only.

async function findUserByUsername(username: string) {
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] ?? null;
}

async function findUserById(id: number) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

async function createUser(input: { role: string; username: string; password_hash: string; name?: string | null; email?: string | null }) {
  const { rows } = await query(
    `INSERT INTO users (role, username, password_hash, name, email)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.role, input.username, input.password_hash, input.name || null, input.email || null]
  );
  return rows[0];
}

const usersRepository = { findUserByUsername, findUserById, createUser };

export { usersRepository };
export default usersRepository;
