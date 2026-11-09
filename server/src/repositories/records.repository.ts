import type { Runner } from './catalog.repository';
import { batchUpsert } from './catalog.repository';

// Academic-record repositories: students, exams, student_results, marks.

async function upsertStudents(runner: Runner, students: Array<Record<string, unknown>>) {
  if (!students || !students.length) return [];
  return batchUpsert(runner, {
    table: 'students',
    columns: ['roll_no', 'name', 'sid', 'institution_code', 'programme_code', 'batch', 'scheme_id'],
    rows: students.map((s) => [
      s.roll_no, s.name, s.sid || null, s.institution_code || null,
      s.programme_code || null, s.batch || null, s.scheme_id || null,
    ]),
    conflict: '(roll_no)',
    update: [
      'name = EXCLUDED.name', 'sid = EXCLUDED.sid', 'institution_code = EXCLUDED.institution_code',
      'programme_code = EXCLUDED.programme_code', 'batch = EXCLUDED.batch', 'scheme_id = EXCLUDED.scheme_id',
    ].join(', '),
  });
}

async function upsertExams(runner: Runner, exams: Array<Record<string, unknown>>) {
  if (!exams || !exams.length) return [];
  return batchUpsert(runner, {
    table: 'exams',
    columns: ['batch', 'session', 'exam_type', 'semester', 'upload_id'],
    rows: exams.map((e) => [e.batch, e.session || '', e.exam_type, e.semester, e.upload_id]),
    conflict: '(batch, session, exam_type, semester)',
    update: 'upload_id = EXCLUDED.upload_id',
    returning: 'id, batch, session, exam_type, semester',
  });
}

async function upsertStudentResults(runner: Runner, results: Array<Record<string, unknown>>) {
  if (!results || !results.length) return [];
  return batchUpsert(runner, {
    table: 'student_results',
    columns: ['exam_id', 'roll_no', 'exam_type', 'credits_secured'],
    rows: results.map((r) => [r.exam_id, r.roll_no, r.exam_type, r.credits_secured ?? 0]),
    conflict: '(exam_id, roll_no)',
    update: 'exam_type = EXCLUDED.exam_type, credits_secured = EXCLUDED.credits_secured',
    returning: 'id, exam_id, roll_no',
  });
}

async function upsertMarks(runner: Runner, marks: Array<Record<string, unknown>>) {
  if (!marks || !marks.length) return [];
  return batchUpsert(runner, {
    table: 'marks',
    columns: ['result_id', 'paper_pk', 'internal', 'external', 'total', 'grade', 'is_absent', 'is_grace'],
    rows: marks.map((x) => [
      x.result_id, x.paper_pk, x.internal ?? null, x.external ?? null,
      x.total ?? null, x.grade || null, Boolean(x.is_absent), Boolean(x.is_grace),
    ]),
    conflict: '(result_id, paper_pk)',
    update: [
      'internal = EXCLUDED.internal', 'external = EXCLUDED.external', 'total = EXCLUDED.total',
      'grade = EXCLUDED.grade', 'is_absent = EXCLUDED.is_absent', 'is_grace = EXCLUDED.is_grace',
    ].join(', '),
  });
}

const recordsRepository = { upsertStudents, upsertExams, upsertStudentResults, upsertMarks };

export { recordsRepository };
export default recordsRepository;
