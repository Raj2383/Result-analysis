/** Domain types mirroring the PostgreSQL tables (server/db/migrations/001_init_schema.sql). */

export interface Programme {
  prog_id: number;
  prog_code: string;
  short_name: string;
  full_name: string;
  duration_semesters: number;
  ordinance_version: string;
  min_pass_pct: number;
  min_internal_pct: number | null;
  min_external_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  inst_id: number;
  inst_code: string;
  inst_name: string;
  canonical_name: string;
  short_code: string;
  shift: number;
  is_active: boolean;
  created_at: string;
}

export interface Scheme {
  scheme_id: string;
  prog_id: number;
  semester: number;
  wef_batch_year: number;
  required_credits: number;
  created_at: string;
}

export interface Paper {
  paper_id: number;
  paper_id_code: string;
  paper_code: string;
  prog_id: number;
  scheme_id: number | null;
  semester: number;
  title: string;
  credits: number;
  paper_type: string;
  exam_mode: string;
  pass_marks: number;
  max_internal: number;
  max_external: number;
  max_total: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface GradeScaleRow {
  grade: string;
  grade_point: number;
  min_marks: number | null;
  max_marks: number | null;
  description: string;
  is_passing: boolean;
}

export interface Student {
  roll_no: string;
  name: string;
  sid: string;
  scheme_code: string;
  prog_id: number;
  inst_id: number;
  class_serial_code: string;
  inst_code_from_roll: string;
  prog_code_from_roll: string;
  batch_year: number;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  upload_id: string;
  original_filename: string;
  file_sha256: string;
  file_size_bytes: number;
  uploaded_by: number | null;
  status: string;
  total_pages: number;
  scheme_pages_count: number;
  result_pages_count: number;
  students_parsed: number;
  results_upserted: number;
  marks_upserted: number;
  parse_warnings: unknown;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Exam {
  exam_id: number;
  upload_id: string;
  prog_id: number;
  semester: number;
  exam_session: string;
  exam_category: string;
  batch_year: number;
  rtsid: string | null;
  declared_date: string | null;
  created_at: string;
}

export interface StudentResult {
  result_id: number;
  student_roll_no: string;
  exam_id: number;
  upload_id: string;
  inst_id: number;
  semester: number;
  exam_category: string;
  batch_year: number;
  credits_secured: number;
  remarks_raw: string | null;
  result_status: string;
  pdf_page_number: number;
  row_serial_number: number | null;
  attempt_timestamp: string;
  is_latest_attempt: boolean;
  created_at: string;
}

export interface Mark {
  mark_id: number;
  result_id: number;
  student_roll_no: string;
  paper_id: number | null;
  paper_id_code: string;
  semester: number;
  credits: number;
  internal_raw: string;
  external_raw: string;
  total_grade_raw: string;
  internal_score: number | null;
  external_score: number | null;
  computed_sum: number | null;
  total_score: number | null;
  grade: string;
  grade_point: number;
  credit_points: number;
  is_grace: boolean;
  grace_amount: number;
  is_absent_internal: boolean;
  is_absent_external: boolean;
  is_nues_dash: boolean;
  is_passed: boolean;
  paper_status: string;
  is_effective_latest: boolean;
  created_at: string;
}

export interface SemesterSummary {
  summary_id: number;
  student_roll_no: string;
  semester: number;
  latest_result_id: number;
  inst_id: number;
  batch_year: number;
  exam_category: string;
  papers_appeared: number;
  papers_passed: number;
  backlog_count: number;
  grace_papers_count: number;
  total_grace_marks: number;
  total_marks_obt: number;
  max_total_marks: number;
  percentage: number;
  credits_registered: number;
  credits_earned: number;
  total_credit_points: number;
  sgpa: number;
  cgpa: number;
  overall_status: string;
  updated_at: string;
}

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  inst_id: number | null;
  student_roll_no: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface SafeUser {
  id: number;
  role: string;
  username: string;
  name: string | null;
  email: string | null;
}
