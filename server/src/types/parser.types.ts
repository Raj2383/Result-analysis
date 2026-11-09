/** Types for the pure GGSIPU PDF parser output (server/src/parsers/*). */

export interface InstitutionInfo {
  code: string;
  name: string;
}

export interface SchemeInfo {
  scheme_id: string;
  institution_code: string | null;
  programme_code: string | null;
  semester: number | null;
}

export interface PaperInfo {
  scheme_id: string;
  paper_id: string;
  code: string;
  name: string;
  credits: number;
  paper_type: string;
  exam_mode: string | null;
  kind: string | null;
  minor_max: number | null;
  major_max: number;
  max_marks: number;
  pass_marks: number;
}

export interface ExamInfo {
  key: string;
  batch: string;
  session: string;
  exam_type: string;
  semester: number | null;
}

export interface MarkInfo {
  paper_id: string;
  credits: number;
  internal: number | null;
  external: number | null;
  total: number | null;
  grade: string;
  is_absent: boolean;
  is_grace: boolean;
}

export interface ResultInfo {
  roll_no: string;
  examKey: string;
  exam_type: string;
  credits_secured: number | null;
  marks: MarkInfo[];
}

export interface StudentInfo {
  roll_no: string;
  name: string;
  sid: string;
  institution_code: string;
  programme_code: string;
  batch: string;
  scheme_id: string;
}

export interface ParsedResultDocument {
  institutions: InstitutionInfo[];
  schemes: SchemeInfo[];
  papers: PaperInfo[];
  exams: ExamInfo[];
  students: Array<{
    roll_no: string;
    name: string;
    sid: string;
    institution_code: string;
    programme_code: string;
    batch: string;
    scheme_id: string;
  }>;
  results: Array<{
    roll_no: string;
    exam_key: string;
    exam_type: string;
    credits_secured: number | null;
    marks: MarkInfo[];
  }>;
  meta: { pages: number; warnings: string[] };
}

export interface PdfLine {
  line: string;
  page: number;
}

export interface PdfTextItem {
  str: string;
  transform: number[];
}

export interface ExtractedPages {
  pages: string[];
  numPages: number;
}
