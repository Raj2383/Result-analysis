import { describe, it, expect, vi } from 'vitest';
import { createAuthService } from '../../src/services/auth.service';
import { createIngestionService } from '../../src/services/ingestion.service';
import { createResultsService } from '../../src/services/result.service';
import { createOverviewService } from '../../src/services/overview.service';
import { createToppersService } from '../../src/services/toppers.service';
import { createAnalyticsService } from '../../src/services/analytics.service';
import { createAdminService } from '../../src/services/admin.service';

describe('service DI – factories accept injected repo/parser interfaces', () => {
  it('auth service works with injected users + hasher', async () => {
    const users = { findUserByUsername: vi.fn(), findUserById: vi.fn(), createUser: vi.fn() };
    const hasher = { hashPassword: vi.fn(), comparePassword: vi.fn() };
    const svc = createAuthService({ users, hasher });
    expect(typeof svc.login).toBe('function');
    expect(typeof svc.getMe).toBe('function');
    expect(typeof svc.createFaculty).toBe('function');
  });

  it('ingestion service works with injected fakes', async () => {
    const svc = createIngestionService({
      extractor: { extractText: vi.fn() },
      parser: { parseResultText: vi.fn() },
      hasher: { sha256: vi.fn() },
      db: { query: vi.fn(), getClient: vi.fn() },
      uploads: { findByHash: vi.fn(), createUpload: vi.fn(), listUploads: vi.fn(), deleteUpload: vi.fn() },
      catalog: { upsertInstitutions: vi.fn(), upsertProgrammes: vi.fn(), getProgrammes: vi.fn(), upsertSchemes: vi.fn(), upsertPapers: vi.fn(), batchUpsert: vi.fn() },
      records: { upsertStudents: vi.fn(), upsertExams: vi.fn(), upsertStudentResults: vi.fn(), upsertMarks: vi.fn() },
      summary: { recomputeSummaries: vi.fn(), getStudentResult: vi.fn(), searchStudents: vi.fn() },
    });
    expect(typeof svc.ingestPdf).toBe('function');
  });

  it('results / overview / toppers / analytics / admin services instantiate', () => {
    expect(typeof createResultsService().recomputeSummaries).toBe('function');
    expect(typeof createOverviewService().getOverview).toBe('function');
    expect(typeof createToppersService().getToppers).toBe('function');
    expect(typeof createAnalyticsService().getAnalytics).toBe('function');
    expect(typeof createAdminService().createFaculty).toBe('function');
  });
});
