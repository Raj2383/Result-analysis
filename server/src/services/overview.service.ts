import { overviewRepository } from '../repositories/overview.repository';

export interface OverviewRepoDeps {
  getKpis: (filters: Record<string, unknown>) => Promise<unknown>;
  getBatches: (filters?: Record<string, unknown>) => Promise<unknown[]>;
  getExamYears?: () => Promise<unknown[]>;
  getProgrammes?: () => Promise<unknown[]>;
  getInstitutions: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getRecentUploads: () => Promise<unknown[]>;
  getCollegeStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getSubjectStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
}

export function createOverviewService(deps: { repo?: OverviewRepoDeps } = {}) {
  const repo = deps.repo ?? overviewRepository;

  async function getOverview(filters: Record<string, unknown> = {}) {
    const kpis = await repo.getKpis(filters);
    const batches = await repo.getBatches(filters);
    const examYears = repo.getExamYears ? await repo.getExamYears() : [];
    const programmes = repo.getProgrammes ? await repo.getProgrammes() : [];
    const institutions = await repo.getInstitutions(filters);
    const recentUploads = await repo.getRecentUploads();
    const collegeStats = repo.getCollegeStats ? await repo.getCollegeStats(filters) : [];
    const subjectStats = repo.getSubjectStats ? await repo.getSubjectStats(filters) : [];
    return {
      kpis,
      batches,
      exam_years: examYears,
      programmes,
      institutions,
      recentUploads,
      college_stats: collegeStats,
      by_college: collegeStats,
      subject_stats: subjectStats,
      by_subject: subjectStats,
    };
  }

  return { getOverview };
}

export default createOverviewService();
