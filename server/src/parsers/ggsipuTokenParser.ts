/**
 * GGSIPU token parser – pure, deterministic token normalization for tabulation
 * sheet lines. No I/O, never throws on odd lines (returns null / defaults).
 *
 * Tokens follow the GGSIPU printed format:
 *  - Institution: `Institution Code: 142 Institution: SOME COLLEGE NAME`
 *  - Scheme:      `SchemeID: 480202021001` (+ optional `Sem./Year: 3`)
 *  - Exam:        `Batch: 2022 Examination: REGULAR December, 2024`
 *  - Student:     `00111102022PRIYAM KUMAR JHASID: 480000053814SchemeID: 480202021001`
 *  - Paper entry: `020301(4)`
 *  - Scores:      `21 63` (internal external) / `- 70` / `10 A`
 *  - Total:       `84(A+)`, `40(P)*`, `A(F)`, `A`
 */
import type { InstitutionInfo, PaperInfo, SchemeInfo } from '../types/parser.types';

export const PAPER_ENTRY_PATTERN = /^(\d+)\s*\((\d+)\)\s*$/;
export const SCORE_PATTERN = /^(-|\d+)\s+(\d+|A)\s*$/i;
export const TOTAL_PATTERN = /^(A|\d+)\s*\(\s*([^)]+?)\s*\)\s*(\*)?\s*$/i;
export const LONE_INT_PATTERN = /^(\d+)\s*$/;

export function matchInstitution(line: string): InstitutionInfo | null {
  const m = /^Institution\s*Code:\s*(\d+)\s+Institution:\s*(.+?)\s*$/.exec(line);
  if (!m) return null;
  return { code: m[1], name: m[2].trim() };
}

export function matchSchemeId(line: string): string | null {
  const m = /^SchemeID:\s*(\d+)(?:\s|$)/i.exec(line.trim());
  return m ? m[1].trim() : null;
}

/** Split institution context lines as emitted by pdfjs grouping, e.g. `Institution Code: 142` / `Institution: SOME COLLEGE`. */
export function matchInstitutionCode(line: string): string | null {
  const m = /^Institution\s+Code:\s*(\d+)\s*$/i.exec(line.trim());
  return m ? m[1].trim() : null;
}

/** Split institution context lines as emitted by pdfjs grouping, e.g. `Institution: SOME COLLEGE`. */
export function matchInstitutionName(line: string): string | null {
  const m = /^Institution:\s*(.+?)\s*$/i.exec(line.trim());
  return m ? m[1].trim() : null;
}

/** Split exam context lines as emitted by pdfjs grouping, e.g. `Batch: 2020` / `Examination: REGULAR December, 2024`. */
export function matchBatch(line: string): string | null {
  const m = /^Batch:\s*(\d{1,4})(?:\s|$)/i.exec(line.trim());
  return m ? m[1].trim() : null;
}

/** Split exam context lines as emitted by pdfjs grouping, e.g. `Examination: REGULAR December, 2024`. */
export function matchExamType(line: string): { exam_type: string; session: string } | null {
  const m = /^Examination:\s*(REGULAR|REAPPEAR)\s*(.*)$/i.exec(line.trim());
  if (!m) return null;
  return { exam_type: m[1].toUpperCase(), session: (m[2] || '').trim() };
}

export function matchSemester(line: string): number | null {
  const m = /(?:Sem\.\/Year|Semester)\s*:\s*(\d{1,2})/i.exec(line);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

export function matchExamHeader(line: string): { batch: string; exam_type: string; session: string } | null {
  const m = /Batch:\s*(\S+)\s+Examination:\s*(REGULAR|REAPPEAR)\s*(.*)/i.exec(line);
  if (!m) return null;
  return { batch: m[1].trim(), exam_type: m[2].toUpperCase(), session: (m[3] || '').trim() };
}

export function matchStudentHeader(line: string): {
  roll_no: string;
  name: string;
  sid: string;
  scheme_id: string;
} | null {
  const m = /^(\d{11})\s*(.*?)\s*SID:\s*(\S+)\s*SchemeID:\s*(\S+)\s*$/i.exec(line);
  if (!m) return null;
  const name = m[2].trim();
  if (!name) return null;
  return { roll_no: m[1], name, sid: m[3].trim(), scheme_id: m[4].trim() };
}

/**
 * Multi-student variant of matchStudentHeader – GGSIPU sometimes packs several
 * student rows onto a single text line, e.g.
 * `09391102022 USHAN SHARMA SID: 480000055830 SchemeID: 480202021001 09491102022 HARMANJOT KAUR SID: ...`
 */
export function matchStudentHeaders(line: string): Array<{ roll_no: string; name: string; sid: string; scheme_id: string }> {
  const out: Array<{ roll_no: string; name: string; sid: string; scheme_id: string }> = [];
  const re = /(\d{11})(.*?)\s*SID:\s*(\d+)\s*SchemeID:\s*(\d+)/g;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const name = (m[2] || '').trim();
    if (!name) continue;
    out.push({ roll_no: m[1], name, sid: m[3], scheme_id: m[4] });
  }
  return out;
}

export function matchPaperEntry(line: string): { paper_id: string; credits: number } | null {
  const m = PAPER_ENTRY_PATTERN.exec(line.trim());
  if (!m) return null;
  return { paper_id: m[1], credits: Number(m[2]) };
}

export interface ScoreLine {
  internal: number | null;
  external: number | null;
  externalAbsent: boolean;
}

export function matchScoreLine(line: string): ScoreLine | null {
  const m = SCORE_PATTERN.exec(line.trim());
  if (!m) return null;
  return {
    internal: m[1] === '-' ? null : Number(m[1]),
    external: /A/i.test(m[2]) ? null : Number(m[2]),
    externalAbsent: /A/i.test(m[2]),
  };
}

export interface TotalLine {
  total: number | null;
  grade: string;
  is_grace: boolean;
  totalAbsent: boolean;
}

export function matchTotalLine(line: string): TotalLine | null {
  const t = line.trim();
  if (/^A$/i.test(t)) return { total: null, grade: 'F', is_grace: false, totalAbsent: true };
  const m = TOTAL_PATTERN.exec(t);
  if (!m) return null;
  return {
    total: /A/i.test(m[1]) ? null : Number(m[1]),
    grade: m[2].trim().toUpperCase(),
    is_grace: m[3] === '*',
    totalAbsent: /A/i.test(m[1]),
  };
}

export function matchLoneInteger(line: string): number | null {
  const m = LONE_INT_PATTERN.exec(line.trim());
  return m ? Number(m[1]) : null;
}

export interface PaperRow {
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

/** Scheme paper row e.g. `01 020301 BCA301 OPERATING SYSTEM & LINUX PROGRAMMING 4 THEORY UES COMPULSORY DROPPABLE 25 75 100 40`. */
export function parsePaperRow(line: string): PaperRow | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 9) return null;
  if (!/^\d+$/.test(tokens[0]) || !/^\d+$/.test(tokens[1])) return null;
  const tail = tokens.slice(-4);
  if (!/^(\d+|--)$/.test(tail[0])) return null;
  if (!tail.slice(1).every((t) => /^\d+$/.test(t))) return null;

  const typeIdx = tokens.findIndex((t) => /^(THEORY|PRACTICAL)$/i.test(t));
  if (typeIdx < 4) return null; // need sno, paperId, code, ≥1 subject token, credit
  const creditToken = tokens[typeIdx - 1];
  if (!/^\d+$/.test(creditToken)) return null;

  const subject = tokens.slice(3, typeIdx - 1).join(' ');
  if (!subject) return null;
  const kindTokens = tokens.slice(typeIdx + 2, tokens.length - 4);

  return {
    paper_id: tokens[1],
    code: tokens[2],
    name: subject,
    credits: Number(creditToken),
    paper_type: tokens[typeIdx].toUpperCase(),
    exam_mode: tokens[typeIdx + 1] || null,
    kind: kindTokens.length ? kindTokens.join(' ') : null,
    minor_max: tail[0] === '--' ? null : Number(tail[0]),
    major_max: Number(tail[1]),
    max_marks: Number(tail[2]),
    pass_marks: Number(tail[3]),
  };
}

export default {
  matchInstitution,
  matchInstitutionCode,
  matchInstitutionName,
  matchSchemeId,
  matchSemester,
  matchExamHeader,
  matchBatch,
  matchExamType,
  matchStudentHeader,
  matchStudentHeaders,
  matchPaperEntry,
  matchScoreLine,
  matchTotalLine,
  matchLoneInteger,
  parsePaperRow,
};
