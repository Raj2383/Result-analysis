import { describe, it, expect, vi } from 'vitest';
import { createIngestionService } from '../src/services/ingestion.service';
import { batchUpsert } from '../src/repositories/catalog.repository';

const PARSED = {
  institutions: [{ code: '142', name: 'TEST COLLEGE' }],
  schemes: [{ scheme_id: 'S1', institution_code: '142', programme_code: null, semester: 3 }],
  papers: [
    {
      scheme_id: 'S1', paper_id: '020301', code: 'BCA301', name: 'OS',
      credits: 4, paper_type: 'THEORY', exam_mode: 'UES', kind: 'COMPULSORY',
      minor_max: 25, major_max: 75, max_marks: 100, pass_marks: 40,
    },
  ],
  exams: [{ key: 'K1', batch: '2022', session: 'December, 2024', exam_type: 'REGULAR', semester: 3 }],
  students: [
    {
      roll_no: '00111102022', name: 'TEST STUDENT', sid: 'SID1',
      institution_code: '142', programme_code: '020', batch: '22', scheme_id: 'S1',
    },
  ],
  results: [
    {
      roll_no: '00111102022', exam_key: 'K1', exam_type: 'REGULAR', credits_secured: 4,
      marks: [
        {
          paper_id: '020301', credits: 4, internal: 21, external: 63,
          total: 84, grade: 'A+', is_absent: false, is_grace: false,
        },
      ],
    },
  ],
  meta: { pages: 2, warnings: [] },
};

function makeFakes() {
  const queries = [];
  const client = {
    query: vi.fn(async (text) => {
      queries.push(text);
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  const calls = {};
  const recorder = (name) => {
    calls[name] = [];
    return async (...args) => {
      calls[name].push(args);
      return [];
    };
  };
  const fakes = {
    queries,
    calls,
    client,
    db: {
      query: vi.fn(async () => ({ rows: [] })),
      getClient: vi.fn(async () => client),
    },
    extractor: { extractText: vi.fn(async () => ({ pages: ['t'], numPages: 1 })) },
    parser: { parseResultText: vi.fn(() => structuredClone(PARSED)) },
    hasher: { sha256: () => 'abc123' },
    catalog: {
      upsertInstitutions: recorder('upsertInstitutions'),
      upsertProgrammes: recorder('upsertProgrammes'),
      upsertSchemes: recorder('upsertSchemes'),
      upsertPapers: async (runner, papers) =>
        papers.map((p, i) => ({ id: 100 + i, scheme_id: p.scheme_id, paper_id: p.paper_id })),
    },
    records: {
      upsertStudents: recorder('upsertStudents'),
      upsertExams: async () => [
        { id: 11, batch: '2022', session: 'December, 2024', exam_type: 'REGULAR', semester: 3 },
      ],
      upsertStudentResults: async () => [{ id: 21, exam_id: 11, roll_no: '00111102022' }],
      upsertMarks: recorder('upsertMarks'),
    },
    uploads: {
      findByHash: vi.fn(async () => null),
      createUpload: async () => ({ id: 7, filename: 'r.pdf' }),
      listUploads: vi.fn(async () => ({ items: [], total: 0 })),
    },
    summary: {
      recomputeSummaries: vi.fn(async () => ({ students: 1, semesters: 1 })),
    },
  };
  return fakes;
}

describe('ingestPdf', () => {
  it('rejects re-upload of the same file hash without touching the DB transaction', async () => {
    const f = makeFakes();
    f.uploads.findByHash.mockResolvedValue({ id: 7 });
    const svc = createIngestionService(f);

    await expect(svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 }))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(f.extractor.extractText).not.toHaveBeenCalled();
    expect(f.db.getClient).not.toHaveBeenCalled();
  });

  it('ingests inside a single transaction and returns stats', async () => {
    const f = makeFakes();
    const svc = createIngestionService(f);

    const out = await svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 });

    expect(f.queries[0]).toBe('BEGIN');
    expect(f.queries[f.queries.length - 1]).toBe('COMMIT');
    expect(f.client.release).toHaveBeenCalled();
    expect(out.upload).toEqual({ id: 7, filename: 'r.pdf' });
    expect(out.stats).toMatchObject({ students: 1, exams: 1, results: 1, marks: 1, papers: 1 });
    expect(out.warnings).toEqual([]);
  });

  it('recomputes SGPA/CGPA for touched rolls inside the same transaction', async () => {
    const f = makeFakes();
    const svc = createIngestionService(f);

    const out = await svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 });

    expect(f.summary.recomputeSummaries).toHaveBeenCalledWith(f.client, ['00111102022']);
    expect(out.summary).toEqual({ students: 1, semesters: 1 });
  });

  it('rolls back and releases on failure', async () => {
    const f = makeFakes();
    f.records.upsertMarks = vi.fn(async () => { throw new Error('boom'); });
    const svc = createIngestionService(f);

    await expect(svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 }))
      .rejects.toThrow('boom');
    expect(f.queries).toContain('ROLLBACK');
    expect(f.queries).not.toContain('COMMIT');
    expect(f.client.release).toHaveBeenCalled();
  });

  it('400s when the PDF has no student records (no transaction opened)', async () => {
    const f = makeFakes();
    f.parser.parseResultText.mockReturnValue({ ...structuredClone(PARSED), students: [], results: [] });
    const svc = createIngestionService(f);

    await expect(svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(f.db.getClient).not.toHaveBeenCalled();
  });

  it('flags UNLISTED stub papers for result-only paper ids', async () => {
    const f = makeFakes();
    const parsed = structuredClone(PARSED);
    parsed.results[0].marks.push({
      paper_id: '029999', credits: 3, internal: 20, external: 60,
      total: 80, grade: 'A+', is_absent: false, is_grace: false,
    });
    f.parser.parseResultText.mockReturnValue(parsed);
    const seen = [];
    f.catalog.upsertPapers = async (runner, papers) => {
      seen.push(...papers);
      return papers.map((p, i) => ({ id: 100 + i, scheme_id: p.scheme_id, paper_id: p.paper_id }));
    };
    const svc = createIngestionService(f);

    const out = await svc.ingestPdf({ buffer: Buffer.from('pdf'), filename: 'r.pdf', uploadedBy: 1 });

    expect(seen.some((p) => p.paper_id === '029999' && p.name === 'UNLISTED 029999')).toBe(true);
    expect(out.warnings.some((w) => w.includes('UNLISTED'))).toBe(true);
  });
});

describe('batchUpsert SQL shape', () => {
  it('builds parameterized multi-row upserts with RETURNING', async () => {
    const seen = [];
    const runner = { query: async (text, params) => { seen.push({ text, params }); return { rows: [] }; } };

    await batchUpsert(runner, {
      table: 'papers',
      columns: ['scheme_id', 'paper_id'],
      rows: [['S1', '020301'], ['S1', '020303']],
      conflict: '(scheme_id, paper_id)',
      update: 'code = EXCLUDED.code',
      returning: 'id, scheme_id, paper_id',
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].text).toContain('VALUES ($1,$2),($3,$4)');
    expect(seen[0].text).toContain('ON CONFLICT (scheme_id, paper_id)');
    expect(seen[0].text).toContain('RETURNING id, scheme_id, paper_id');
    expect(seen[0].params).toEqual(['S1', '020301', 'S1', '020303']);
  });
});
