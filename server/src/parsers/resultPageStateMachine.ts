/**
 * Result page state machine – pure GGSIPU result-tabulation parsing.
 * Page-by-page with carried context { institution, scheme, semester, exam }.
 * Never throws on odd lines – skips with a warning instead.
 *
 * Output shape: { institutions, schemes, papers, exams, students, results, meta }
 */
import {
  matchBatch,
  matchExamHeader,
  matchExamType,
  matchInstitution,
  matchInstitutionCode,
  matchInstitutionName,
  matchPaperEntry,
  matchScoreLine,
  matchSchemeId,
  matchSemester,
  matchStudentHeader,
  matchStudentHeaders,
  matchTotalLine,
  matchLoneInteger,
  parsePaperRow,
} from './ggsipuTokenParser';
import { isValidRollNumber, parseRollNumber } from '../utils/rollNumber';
import { registerInstitution, registerPaper, registerScheme } from './schemePageParser';
import type { ExamInfo, InstitutionInfo, MarkInfo, PaperInfo, ParsedResultDocument, ResultInfo, SchemeInfo, StudentInfo } from '../types/parser.types';

export interface ResultMachineState {
  institutions: Map<string, InstitutionInfo>;
  schemes: Map<string, SchemeInfo>;
  papers: Map<string, PaperInfo>;
  exams: ExamInfo[];
  examIndex: Map<string, number>;
  students: Map<string, StudentInfo>;
  results: ResultInfo[];
  resultIndex: Map<string, number>;
  warnings: string[];
  markBuffer: string[];
}

export interface ResultContext {
  institution: InstitutionInfo | null;
  schemeId: string | null;
  semester: number | null;
  examKey: string | null;
}

export interface PendingPaper {
  paper_id: string;
  credits: number;
  internal?: number | null;
  external?: number | null;
  externalAbsent?: boolean;
}

export interface FeedLine {
  line: string;
  page: number;
}

export interface ResultMachine {
  state: ResultMachineState;
  ctx: ResultContext;
  current: ResultInfo | null;
  pendingPaper: PendingPaper | null;
  lines: FeedLine[];
  cursor: number;
  markBuffer: string[];
  feedLine(line: string, page: number): void;
  run(): ResultMachineState;
  getState(): ResultMachineState;
}

function createState(): ResultMachineState {
  return {
    institutions: new Map(),
    schemes: new Map(),
    papers: new Map(),
    exams: [],
    examIndex: new Map(),
    students: new Map(),
    results: [],
    resultIndex: new Map(),
    warnings: [],
    markBuffer: [],
  };
}

function createContext(): ResultContext {
  return { institution: null, schemeId: null, semester: null, examKey: null };
}

function createMachine(): ResultMachine {
  const state = createState();
  const ctx = createContext();
  const warnings: string[] = state.warnings;
  const warn = (page: number, msg: string) => {
    if (warnings.length < 50) warnings.push(`p${page}: ${msg}`);
  };

  // Split-context pendings (pdfjs may emit e.g. `Examination: ...` and `Batch: ...` on separate lines).
  let pendingBatch: string | null = null;
  let pendingExam: { exam_type: string; session: string } | null = null;
  let pendingInstCode: string | null = null;
  let pendingInstName: string | null = null;

  function ensureScheme(schemeId: string, page: number): void {
    if (!schemeId) return;
    if (!state.schemes.has(schemeId)) {
      state.schemes.set(schemeId, {
        scheme_id: schemeId,
        institution_code: ctx.institution ? ctx.institution.code : null,
        programme_code: null,
        semester: ctx.semester,
      });
    } else {
      const s = state.schemes.get(schemeId)!;
      if (s.semester == null && ctx.semester != null) s.semester = ctx.semester;
      if (!s.institution_code && ctx.institution) s.institution_code = ctx.institution.code;
    }
    ctx.schemeId = schemeId;
  }

  function getExam(batch: string, session: string, exam_type: string): ExamInfo {
    const semester = ctx.semester;
    const key = `${batch}||${session}||${exam_type}||${semester == null ? '' : semester}`;
    if (!state.examIndex.has(key)) {
      const exam: ExamInfo = { key, batch, session, exam_type, semester };
      state.examIndex.set(key, state.exams.length);
      state.exams.push(exam);
    }
    ctx.examKey = key;
    return state.exams[state.examIndex.get(key)!];
  }

  function getResult(rollNo: string, exam: ExamInfo): ResultInfo {
    const key = `${exam.key}||${rollNo}`;
    if (!state.resultIndex.has(key)) {
      const result: ResultInfo = { roll_no: rollNo, examKey: exam.key, exam_type: exam.exam_type, credits_secured: null, marks: [] };
      state.resultIndex.set(key, state.results.length);
      state.results.push(result);
    }
    return state.results[state.resultIndex.get(key)!];
  }

  const feedMarkLine = (line: string, page: number): void => {
    const entry = matchPaperEntry(line);
    if (entry) {
      if (machine.pendingPaper) warn(page, `incomplete entry ${machine.pendingPaper.paper_id} discarded (no total line)`);
      machine.pendingPaper = { paper_id: entry.paper_id, credits: entry.credits };
      return;
    }

    const score = matchScoreLine(line);
    if (score && machine.pendingPaper && machine.pendingPaper.internal === undefined) {
      machine.pendingPaper.internal = score.internal;
      machine.pendingPaper.external = score.external;
      machine.pendingPaper.externalAbsent = score.externalAbsent;
      return;
    }

    const total = matchTotalLine(line);
    if (total && machine.pendingPaper) {
      const isAbsent = Boolean(machine.pendingPaper.externalAbsent) || total.totalAbsent;
      const cur = machine.current;
      if (!cur) {
        warn(page, `total line for ${machine.pendingPaper.paper_id} ignored (no current student context)`);
        machine.pendingPaper = null;
        return;
      }
      cur.marks.push({
        paper_id: machine.pendingPaper.paper_id,
        credits: machine.pendingPaper.credits,
        internal: machine.pendingPaper.internal ?? null,
        external: machine.pendingPaper.external ?? null,
        total: total.total,
        grade: total.grade,
        is_absent: isAbsent,
        is_grace: total.is_grace,
      });
      machine.pendingPaper = null;
      return;
    }

    const loneInt = matchLoneInteger(line);
    if (loneInt != null && machine.pendingPaper) {
      // Real GGSIPU tabulation PDFs emit internal + external marks as consecutive lone integers
      // after the paper entry (e.g. `020301(4)` / `10` / `32` / `42(P)`).
      if (machine.pendingPaper.internal === undefined && machine.pendingPaper.external === undefined) {
        machine.pendingPaper.internal = loneInt;
      } else if (machine.pendingPaper.internal != null && machine.pendingPaper.external === undefined) {
        machine.pendingPaper.external = loneInt;
      }
      return;
    }

    const lone = matchLoneInteger(line);
    if (lone != null && !machine.pendingPaper && machine.current && machine.current.marks.length > 0 && machine.current.credits_secured == null) {
      let decision: 'mark' | 'header' | 'eof' | null = null;
      for (let j = machine.cursor + 1; j <= machine.cursor + 3 && j < machine.lines.length; j++) {
        const l2 = machine.lines[j].line;
        if (matchPaperEntry(l2) || matchScoreLine(l2) || matchTotalLine(l2)) {
          decision = 'mark';
          break;
        }
        if (matchStudentHeaders(l2).length > 0 || matchExamHeader(l2) || matchInstitution(l2) || matchSchemeId(l2) || matchSemester(l2)) {
          decision = 'header';
          break;
        }
      }
      if (decision == null && machine.cursor === machine.lines.length - 1) decision = 'eof';
      const creditSum = machine.current.marks.reduce((s, x) => s + (x.credits || 0), 0);
      if ((decision === 'header' || decision === 'eof') && lone <= creditSum) {
        machine.current.credits_secured = lone;
      }
    }
  };

  const machine: ResultMachine = {
    state,
    ctx,
    current: null,
    pendingPaper: null,
    lines: [],
    cursor: 0,
    markBuffer: [],
    feedLine(line: string, page: number): void {
      const l = line.trim();
      const i = machine.cursor;

      const inst = matchInstitution(l);
      if (inst) {
        registerInstitution(state, ctx, inst);
        machine.cursor = i + 1;
        return;
      }

      const instCode = matchInstitutionCode(l);
      if (instCode) {
        pendingInstCode = instCode;
        if (pendingInstName) {
          registerInstitution(state, ctx, { code: pendingInstCode, name: pendingInstName });
          pendingInstCode = null;
          pendingInstName = null;
        }
        machine.cursor = i + 1;
        return;
      }

      const instName = matchInstitutionName(l);
      if (instName) {
        pendingInstName = instName;
        if (pendingInstCode) {
          registerInstitution(state, ctx, { code: pendingInstCode, name: pendingInstName });
          pendingInstCode = null;
          pendingInstName = null;
        }
        machine.cursor = i + 1;
        return;
      }

      const studs = matchStudentHeaders(l);
      if (studs.length > 0) {
        for (const stu of studs) {
          if (machine.markBuffer.length) {
            for (const bl of machine.markBuffer) feedMarkLine(bl, page);
            machine.markBuffer = [];
          }
          if (!isValidRollNumber(stu.roll_no)) {
            warn(page, `invalid roll number, block skipped: ${l.slice(0, 40)}`);
            machine.current = null;
            continue;
          }
          if (ctx.examKey == null) {
            warn(page, `student ${stu.roll_no} outside any exam context, skipped`);
            machine.current = null;
            continue;
          }
          ensureScheme(stu.scheme_id, page);
          const parts = parseRollNumber(stu.roll_no);
          const institutionCode = ctx.institution ? ctx.institution.code : parts.institutionCode;
          if (!state.students.has(stu.roll_no)) {
            state.students.set(stu.roll_no, {
              roll_no: stu.roll_no,
              name: stu.name,
              sid: stu.sid,
              institution_code: institutionCode,
              programme_code: parts.programmeCode,
              batch: parts.batch,
              scheme_id: stu.scheme_id,
            });
          }
          const exam = state.exams[state.examIndex.get(ctx.examKey)!];
          machine.current = getResult(stu.roll_no, exam);
        }
        machine.cursor = i + 1;
        return;
      }

      const sid = matchSchemeId(l);
      if (sid) {
        const semOnSameLine = matchSemester(l);
        registerScheme(state, ctx, sid, semOnSameLine ?? ctx.semester);
        if (semOnSameLine != null) ctx.semester = semOnSameLine;
        machine.cursor = i + 1;
        return;
      }

      const sem = matchSemester(l);
      if (sem != null) {
        ctx.semester = sem;
        if (ctx.schemeId && state.schemes.has(ctx.schemeId)) state.schemes.get(ctx.schemeId)!.semester = sem;
        machine.cursor = i + 1;
        return;
      }

      const ex = matchExamHeader(l);
      if (ex) {
        getExam(ex.batch, ex.session, ex.exam_type);
        pendingBatch = null;
        pendingExam = null;
        machine.current = null;
        machine.cursor = i + 1;
        return;
      }

      const exSplit = matchExamType(l);
      if (exSplit) {
        pendingExam = exSplit;
        if (pendingBatch) {
          getExam(pendingBatch, pendingExam.session, pendingExam.exam_type);
          pendingBatch = null;
          pendingExam = null;
        }
        machine.cursor = i + 1;
        return;
      }

      const batch = matchBatch(l);
      if (batch) {
        pendingBatch = batch;
        if (pendingExam) {
          getExam(pendingBatch, pendingExam.session, pendingExam.exam_type);
          pendingBatch = null;
          pendingExam = null;
        }
        machine.cursor = i + 1;
        return;
      }

      const paperRow = parsePaperRow(l);
      if (paperRow) {
        if (!ctx.schemeId) {
          warn(page, `paper row outside any scheme, skipped: ${paperRow.paper_id}`);
          machine.cursor = i + 1;
          return;
        }
        registerPaper(state, ctx, paperRow);
        machine.cursor = i + 1;
        return;
      }

      if (!machine.current) {
        const markish = matchPaperEntry(l) != null || matchScoreLine(l) != null || matchTotalLine(l) != null || matchLoneInteger(l) != null;
        if (markish && ctx.examKey) {
          // Marks may precede their student row in real tabulation PDFs – buffer them until the student shows up.
          machine.markBuffer.push(l);
        }
        machine.cursor = i + 1;
        return;
      }

      for (const bl of machine.markBuffer) feedMarkLine(bl, page);
      machine.markBuffer = [];

      feedMarkLine(l, page);
      machine.cursor = i + 1;
    },
    run(): ResultMachineState {
      for (const { line, page } of machine.lines) {
        machine.feedLine(line, page);
      }
      return machine.state;
    },
    getState: () => state,
  };

  return machine;
}

export function createResultStateMachine(lines: FeedLine[] = []): ResultMachine {
  const m = createMachine();
  m.lines = lines;
  m.cursor = 0;
  return m;
}

/** Convenience: run the state machine over all page texts (in order) and return the parsed document. */
export function parseResultText(pages: string[] | null | undefined): ParsedResultDocument {
  const lines: FeedLine[] = [];
  (pages || []).forEach((text, pi) => {
    String(text || '')
      .split(/\r?\n/)
      .forEach((raw) => {
        const line = raw.trim();
        if (line) lines.push({ line, page: pi + 1 });
      });
  });
  const machine = createResultStateMachine(lines);
  const state = machine.run();
  const results = state.results.map((r) => ({
    roll_no: r.roll_no,
    exam_key: r.examKey,
    exam_type: r.exam_type,
    credits_secured: r.credits_secured,
    marks: r.marks,
  }));
  return {
    institutions: [...state.institutions.values()],
    schemes: [...state.schemes.values()],
    papers: [...state.papers.values()],
    exams: state.exams,
    students: [...state.students.values()],
    results,
    meta: { pages: (pages || []).length, warnings: state.warnings },
  };
}

export default { createResultStateMachine, parseResultText };
