import { analyticsRepository } from '../repositories/analytics.repository';

export interface AnalyticsRepoDeps {
  getSummary: (filters: Record<string, unknown>) => Promise<unknown>;
  getCollegeStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getSubjectStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getProgrammeStats?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getCgpaDistribution?: (filters: Record<string, unknown>) => Promise<unknown[]>;
  getGradeDistribution?: (filters: Record<string, unknown>) => Promise<unknown[]>;
}

export function createAnalyticsService(deps: { repo?: AnalyticsRepoDeps } = {}) {
  const repo = deps.repo ?? analyticsRepository;

  async function getAnalytics(filters: Record<string, unknown>) {
    const summary = (await repo.getSummary(filters)) as Record<string, unknown>;
    const collegeStats = repo.getCollegeStats ? await repo.getCollegeStats(filters) : [];
    const subjectStats = repo.getSubjectStats ? await repo.getSubjectStats(filters) : [];
    const programmeStats = repo.getProgrammeStats ? await repo.getProgrammeStats(filters) : [];
    const cgpaDistribution = repo.getCgpaDistribution ? await repo.getCgpaDistribution(filters) : [];
    const gradeDistribution = repo.getGradeDistribution ? await repo.getGradeDistribution(filters) : [];
    return {
      ...summary,
      college_stats: collegeStats,
      by_college: collegeStats,
      subject_stats: subjectStats,
      by_subject: subjectStats,
      programme_stats: programmeStats,
      by_programme: programmeStats,
      cgpa_distribution: cgpaDistribution,
      grade_distribution: gradeDistribution,
    };
  }

  return { getAnalytics };
}

export default createAnalyticsService();
