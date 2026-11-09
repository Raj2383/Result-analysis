// Upload tracking: SHA-256 dedupe makes re-uploads reject cleanly (409).

async function findByHash(runner: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> }, fileHash: string) {
  const { rows } = await runner.query('SELECT id, filename, created_at FROM uploads WHERE file_hash = $1', [fileHash]);
  return rows[0] ?? null;
}

async function createUpload(runner: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> }, input: { file_hash: string; filename: string; uploaded_by: number | null }) {
  const { rows } = await runner.query(
    `INSERT INTO uploads (file_hash, filename, uploaded_by) VALUES ($1, $2, $3)
     RETURNING id, file_hash, filename, created_at`,
    [input.file_hash, input.filename, input.uploaded_by || null]
  );
  return rows[0];
}

async function listUploads(runner: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rows1?: any[] }> }, { limit, offset }: { limit?: number; offset?: number }) {
  const [{ rows: items }, { rows: [{ count }] }] = await Promise.all([
    runner.query(
      `SELECT u.id, u.filename, u.created_at, us.username AS uploaded_by
       FROM uploads u LEFT JOIN users us ON us.id = u.uploaded_by
       ORDER BY u.id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    runner.query('SELECT COUNT(*)::int AS count FROM uploads'),
  ]);
  return { items, total: count };
}

const uploadsRepository = { findByHash, createUpload, listUploads };

export { uploadsRepository };
export default uploadsRepository;
