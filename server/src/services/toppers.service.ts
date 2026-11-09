import { toppersRepository } from '../repositories/toppers.repository';
import { Runner } from '../repositories/catalog.repository';
import db from '../config/db';

export interface ToppersServiceDeps {
  repo?: typeof toppersRepository;
  runner?: Runner;
}

export function createToppersService(deps: ToppersServiceDeps = {}) {
  const repo = deps.repo ?? toppersRepository;
  const runner = deps.runner ?? (db as unknown as Runner);

  async function getOverallToppers(opts: { limit?: number; offset?: number } = {}) {
    const limit = Math.min(Number(opts.limit) || 50, 500);
    const offset = Math.max(Number(opts.offset) || 0, 0);
    const rows = await repo.overallToppers(runner, { limit, offset });
    return { items: rows, count: rows.length };
  }

  async function getSemesterToppers(opts: { semester: number; limit?: number; offset?: number }) {
    const semester = Number(opts.semester);
    const limit = Math.min(Number(opts.limit) || 50, 500);
    const offset = Math.max(Number(opts.offset) || 0, 0);
    const rows = await repo.semesterToppers(runner, { semester, limit, offset });
    return { items: rows, count: rows.length, semester };
  }

  async function getCollegeToppers(opts: { institutionCode: string; limit?: number; offset?: number }) {
    const institutionCode = String(opts.institutionCode);
    const limit = Math.min(Number(opts.limit) || 50, 500);
    const offset = Math.max(Number(opts.offset) || 0, 0);
    const rows = await repo.collegeToppers(runner, { institutionCode, limit, offset });
    return { items: rows, count: rows.length, institutionCode };
  }

  async function getSubjectToppers(opts: { paperId: string; schemeId?: string; limit?: number }) {
    const paperId = String(opts.paperId);
    const limit = Math.min(Number(opts.limit) || 10, 100);
    const rows = await repo.subjectToppers(runner, { paperId, schemeId: opts.schemeId, limit });
    return { items: rows, count: rows.length, paperId };
  }

  // Generic fallback if called with raw query params
  async function getToppers(input: Record<string, unknown>) {
    if (input.semester != null) {
      return getSemesterToppers({
        semester: Number(input.semester),
        limit: Number(input.limit ?? 50),
      });
    }
    if (input.instCode) {
      return getCollegeToppers({
        institutionCode: String(input.instCode),
        limit: Number(input.limit ?? 50),
      });
    }
    if (input.paperId) {
      return getSubjectToppers({
        paperId: String(input.paperId),
        limit: Number(input.limit ?? 10),
      });
    }
    return getOverallToppers({ limit: Number(input.limit ?? 50) });
  }

  return {
    getOverallToppers,
    getSemesterToppers,
    getCollegeToppers,
    getSubjectToppers,
    getToppers,
  };
}

export default createToppersService();
