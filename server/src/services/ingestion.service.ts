import { ApiError } from '../utils/ApiError';
import { sha256 } from '../utils/hash';
import { extractText } from '../parsers/pdfCoordinateReader';
import { parseResultText } from '../parsers/resultPageStateMachine';
import uploadsRepo from '../repositories/uploads.repository';
import catalogRepo from '../repositories/catalog.repository';
import recordsRepo from '../repositories/records.repository';
import resultsService from './result.service';
import { Runner } from '../repositories/catalog.repository';

export interface IngestionServiceDeps {
  extractor?: { extractText: (buf: Buffer) => Promise<{ pages: string[]; numPages: number }> };
  parser?: { parseResultText: (pages: string[]) => ReturnType<typeof parseResultText> };
  hasher?: { sha256: (buf: Buffer) => string };
  db?: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>; getClient: () => Promise<Runner> };
  uploads?: typeof uploadsRepo;
  catalog?: typeof catalogRepo;
  records?: typeof recordsRepo;
  summary?: typeof resultsService;
}

export function createIngestionService(deps: IngestionServiceDeps = {}) {
  const extractor = deps.extractor ?? { extractText };
  const parser = deps.parser ?? { parseResultText };
  const hasher = deps.hasher ?? { sha256 };
  const database = deps.db ?? { query: async () => ({ rows: [] }), getClient: async () => ({ query: async () => ({ rows: [] }), release: () => {} }) };
  const uploads = deps.uploads ?? uploadsRepo;
  const catalog = deps.catalog ?? catalogRepo;
  const records = deps.records ?? recordsRepo;
  const summary = deps.summary ?? resultsService;

  async function ingestPdf(input: { buffer: Buffer; filename: string; uploadedBy: number | null }) {
    const { buffer, filename, uploadedBy } = input;
    if (!buffer || buffer.length === 0) throw ApiError.badRequest('Empty PDF file');
    const file_hash = hasher.sha256(buffer);
    const existing = await uploads.findByHash(database, file_hash);
    if (existing) throw ApiError.conflict(`This PDF was already uploaded (upload #${existing.id})`);

    const { pages } = await extractor.extractText(buffer);
    const parsed = parser.parseResultText(pages);
    if (!parsed.students.length) throw ApiError.badRequest('No student records found in this PDF', parsed.meta?.warnings);

    const warnings: string[] = [...(parsed.meta?.warnings || [])];
    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      const upload = await uploads.createUpload(client, { file_hash, filename: filename || 'result.pdf', uploaded_by: uploadedBy });
      const institutions = new Map(parsed.institutions.map((x) => [x.code, x]));
      for (const s of parsed.students) {
        if (s.institution_code && !institutions.has(s.institution_code)) institutions.set(s.institution_code, { code: s.institution_code, name: s.institution_code });
      }
      await catalog.upsertInstitutions(client, [...institutions.values()]);
      await catalog.upsertProgrammes(client, parsed.students.map((s) => s.programme_code));
      const knownSchemes = new Set(parsed.schemes.filter((s) => s.semester != null).map((s) => s.scheme_id));
      await catalog.upsertSchemes(client, parsed.schemes);
      const students2 = parsed.students.map((s) => {
        if (s.scheme_id && !knownSchemes.has(s.scheme_id)) {
          warnings.push(`scheme ${s.scheme_id} has no semester – student ${s.roll_no} linked without scheme`);
          return { ...s, scheme_id: null };
        }
        return s;
      });
      await records.upsertStudents(client, students2);
      const schemeSemester = new Map(parsed.schemes.filter((s) => s.semester != null).map((s) => [s.scheme_id, s.semester]));
      const studentScheme = new Map(parsed.students.map((s) => [s.roll_no, s.scheme_id]));
      const exams = parsed.exams.map((e) => ({ ...e, upload_id: upload.id }));
      const examRows = await records.upsertExams(client, exams);
      const examIdByKey = new Map(examRows.map((row) => [`${row.batch}||${row.session}||${row.exam_type}||${row.semester}`, row.id]));
      const examKeyToId = new Map(parsed.exams.map((e) => [e.key, examIdByKey.get(`${e.batch}||${e.session || ''}||${e.exam_type}||${e.semester}`)]));
      const paperPool: Array<{ scheme_id: string; paper_id: string; code?: string | null; name?: string; credits?: number; paper_type?: string | null; exam_mode?: string | null; kind?: string | null; minor_max?: number | null; major_max?: number | null; max_marks?: number | null; pass_marks?: number | null }> = [...parsed.papers];
      const knownPapers = new Set(parsed.papers.map((p) => `${p.scheme_id}||${p.paper_id}`));
      for (const r of parsed.results) {
        const schemeId = studentScheme.get(r.roll_no);
        if (!schemeId || !knownSchemes.has(schemeId)) {
          if (r.marks.length) warnings.push(`result for ${r.roll_no} has no usable scheme – ${r.marks.length} mark(s) skipped`);
          continue;
        }
        for (const mark of r.marks) {
          const key = `${schemeId}||${mark.paper_id}`;
          if (!knownPapers.has(key)) {
            knownPapers.add(key);
            paperPool.push({ scheme_id: schemeId, paper_id: mark.paper_id, code: mark.paper_id, name: `UNLISTED ${mark.paper_id}`, credits: mark.credits || 0, paper_type: null, exam_mode: null, kind: null, minor_max: null, major_max: null, max_marks: null, pass_marks: null });
            warnings.push(`paper ${mark.paper_id} not on scheme ${schemeId} – stored as UNLISTED`);
          }
        }
      }
      const paperRows = await catalog.upsertPapers(client, paperPool);
      const paperPkByKey = new Map(paperRows.map((p) => [`${p.scheme_id}||${p.paper_id}`, p.id]));
      const resultRows = await records.upsertStudentResults(client, parsed.results.map((r) => ({ exam_id: examKeyToId.get(r.exam_key), roll_no: r.roll_no, exam_type: r.exam_type, credits_secured: r.credits_secured ?? 0 })));
      const resultIdByKey = new Map(resultRows.map((x) => [`${x.exam_id}||${x.roll_no}`, x.id]));
      const markRows: Array<Record<string, unknown>> = [];
      for (const r of parsed.results) {
        const examId = examKeyToId.get(r.exam_key);
        const resultId = resultIdByKey.get(`${examId}||${r.roll_no}`);
        const schemeId = studentScheme.get(r.roll_no);
        if (!resultId || !schemeId) continue;
        for (const mark of r.marks) {
          const paperPk = paperPkByKey.get(`${schemeId}||${mark.paper_id}`);
          if (paperPk) markRows.push({ ...(mark as unknown as Record<string, unknown>), result_id: resultId, paper_pk: paperPk });
        }
      }
      await records.upsertMarks(client, markRows);
      const touchedRolls = parsed.results.map((r) => r.roll_no);
      const summaryResult = await summary.recomputeSummaries(client, touchedRolls);
      await client.query('COMMIT');
      return {
        upload: { id: upload.id, filename: upload.filename },
        stats: {
          institutions: institutions.size,
          schemes: knownSchemes.size,
          papers: paperRows.length,
          students: parsed.students.length,
          exams: examRows.length,
          results: resultRows.length,
          marks: markRows.length,
        },
        summary: summaryResult,
        warnings,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release?.();
    }
  }

  async function listUploads({ limit, offset }: { limit?: number; offset?: number }) {
    const { items, total } = await uploads.listUploads(database, { limit: limit ?? 20, offset: offset ?? 0 });
    return { items, total };
  }

  async function deleteUpload(uploadId: number) {
    const client = await database.getClient();
    try {
      await client.query('BEGIN');
      const { deleted, touchedRolls } = await uploads.deleteUpload(client, uploadId);
      if (!deleted) {
        throw ApiError.notFound(`Upload #${uploadId} not found`);
      }
      if (touchedRolls.length) {
        await summary.recomputeSummaries(client, touchedRolls);
      }
      await client.query('COMMIT');
      return { success: true, message: `Upload #${uploadId} deleted successfully` };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release?.();
    }
  }

  return { ingestPdf, listUploads, deleteUpload };
}

import db from '../config/db';
export default createIngestionService({ db });
export { parseResultText };
