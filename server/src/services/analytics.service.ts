import { analyticsRepository } from '../repositories/analytics.repository';

export interface AnalyticsRepoDeps {
  getSummary: (filters: Record<string, unknown>) => Promise<unknown>;
  getCollegeStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getSubjectStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
}

export function createAnalyticsService(deps: { repo?: AnalyticsRepoDeps } = {}) {
  const repo = deps.repo ?? analyticsRepository;

  async function getAnalytics(filters: Record<string, unknown>) {
    const summary = (await repo.getSummary(filters)) as Record<string, unknown>;
    const collegeStats = repo.getCollegeStats ? await repo.getCollegeStats(filters) : [];
    const subjectStats = repo.getSubjectStats ? await repo.getSubjectStats(filters) : [];
    return {
      ...summary,
      college_stats: collegeStats,
      by_college: collegeStats,
      subject_stats: subjectStats,
      by_subject: subjectStats,
    };
  }

  return { getAnalytics };
}

export default createAnalyticsService();
