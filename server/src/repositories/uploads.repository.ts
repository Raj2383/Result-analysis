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

async function deleteUpload(runner: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number }> }, uploadId: number) {
  // 1. Find roll numbers from exams linked to this upload
  const { rows: touched } = await runner.query(
    `SELECT DISTINCT sr.roll_no
     FROM student_results sr
     JOIN exams e ON e.id = sr.exam_id
     WHERE e.upload_id = $1`,
    [uploadId]
  );
  const rollNos = touched.map((r: { roll_no: string }) => r.roll_no);

  // 2. Delete exams linked to this upload (cascades to student_results and marks)
  await runner.query('DELETE FROM exams WHERE upload_id = $1', [uploadId]);

  // 3. Delete the upload entry
  const result = await runner.query('DELETE FROM uploads WHERE id = $1', [uploadId]);

  // 4. Clean up orphaned semester summaries and students who no longer have any results
  await runner.query(
    `DELETE FROM semester_summary
     WHERE roll_no NOT IN (SELECT DISTINCT roll_no FROM student_results)`
  );
  await runner.query(
    `DELETE FROM students
     WHERE roll_no NOT IN (SELECT DISTINCT roll_no FROM student_results)`
  );

  return { deleted: ((result as any).rowCount ?? 1) > 0, touchedRolls: rollNos };
}

const uploadsRepository = { findByHash, createUpload, listUploads, deleteUpload };

export { uploadsRepository };
export default uploadsRepository;
