/**
 * Scheme page parser – pure GGSIPU scheme-catalog logic.
 * Handles scheme pages: institution headers, SchemeID + semester, paper rows.
 * The result page state machine delegates scheme-catalog mutations here.
 */
import { matchInstitution, parsePaperRow } from './ggsipuTokenParser';
import type { InstitutionInfo, PaperInfo, SchemeInfo } from '../types/parser.types';
import type { ResultContext, ResultMachineState } from './resultPageStateMachine';

export interface SchemePageResult {
  schemes: SchemeInfo[];
  papers: PaperInfo[];
  ctx: ResultContext;
}

/** Register / update an institution in the machine state. */
export function registerInstitution(state: ResultMachineState, ctx: ResultContext, inst: InstitutionInfo): void {
  state.institutions.set(inst.code, inst);
  ctx.institution = inst;
  if (ctx.schemeId && state.schemes.has(ctx.schemeId) && !state.schemes.get(ctx.schemeId)!.institution_code) {
    state.schemes.get(ctx.schemeId)!.institution_code = inst.code;
  }
}

/** Register / update a scheme (SchemeID → semester). */
export function registerScheme(
  state: ResultMachineState,
  ctx: ResultContext,
  schemeId: string | null,
  semester: number | null
): void {
  if (!schemeId) return;
  if (!state.schemes.has(schemeId)) {
    state.schemes.set(schemeId, {
      scheme_id: schemeId,
      institution_code: ctx.institution ? ctx.institution.code : null,
      programme_code: null,
      semester,
    });
  } else {
    const s = state.schemes.get(schemeId)!;
    if (semester != null) s.semester = semester;
    if (!s.institution_code && ctx.institution) s.institution_code = ctx.institution.code;
  }
  ctx.schemeId = schemeId;
}

/** Register / update a scheme paper row (keyed by scheme_id + paper_id). */
export function registerPaper(state: ResultMachineState, ctx: ResultContext, paperRow: { paper_id: string; code: string; name: string; credits: number; paper_type: string; exam_mode: string | null; kind: string | null; minor_max: number | null; major_max: number; max_marks: number; pass_marks: number }): void {
  if (!ctx.schemeId) return;
  state.papers.set(`${ctx.schemeId}||${paperRow.paper_id}`, { scheme_id: ctx.schemeId, ...paperRow });
}

export default { registerInstitution, registerScheme, registerPaper };
