import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Table from '../components/ui/Table.jsx';
import { getToppersOverallApi, getToppersSemesterApi, getToppersCollegeApi, getToppersSubjectApi } from '../features/toppers/api/toppersApi.js';
import { getOverviewApi } from '../features/overview/api/overviewApi.js';

const TABS = [
  { id: 'overall', label: 'Overall (University)' },
  { id: 'semester', label: 'Semester-wise' },
  { id: 'college', label: 'College-wise' },
  { id: 'subject', label: 'Subject-wise' },
];

function Podium({ items, scoreKey }) {
  if (!items || items.length < 1) return null;
  const [a, b, c] = items;
  const slots = [
    { item: b, h: 70, bg: 'bg-[#9aa3c0]', n: 2 },
    { item: a, h: 100, bg: 'bg-accent text-[#141a33]', n: 1 },
    { item: c, h: 52, bg: 'bg-[#b87a4b]', n: 3 },
  ].filter((s) => s.item);
  return (
    <div className="mb-5 flex items-end justify-center gap-3">
      {slots.map((s) => (
        <div key={s.n} className="w-[120px] text-center">
          <small className="block truncate text-[13px] text-ink-soft" title={s.item.name}>
            {s.item.name || s.item.roll_no || '—'}
          </small>
          <div
            className={`flex items-start justify-center rounded-t-[10px] pt-2 text-[22px] font-extrabold text-white ${s.bg}`}
            style={{ height: s.h }}
          >
            {s.n}
          </div>
          <div className="mt-1 text-xs font-bold text-ink">{s.item[scoreKey] ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

export default function ToppersPage() {
  const [tab, setTab] = useState('overall');
  const [semester, setSemester] = useState('5');
  const [collegeCode, setCollegeCode] = useState('');
  const [paperId, setPaperId] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverviewApi,
  });
  const institutions = overview?.institutions || [];

  const overallQuery = useQuery({ queryKey: ['toppers', 'overall', 50], queryFn: () => getToppersOverallApi(50) });
  const semesterQuery = useQuery({
    queryKey: ['toppers', 'semester', semester],
    queryFn: () => getToppersSemesterApi(Number(semester), 50),
    enabled: tab === 'semester',
  });
  const collegeQuery = useQuery({
    queryKey: ['toppers', 'college', collegeCode],
    queryFn: () => getToppersCollegeApi(collegeCode, 50),
    enabled: tab === 'college' && !!collegeCode,
  });
  const subjectQuery = useQuery({
    queryKey: ['toppers', 'subject', paperId],
    queryFn: () => getToppersSubjectApi(paperId, 10),
    enabled: tab === 'subject' && !!paperId,
  });

  const overallItems = overallQuery.data?.items ?? [];
  const semesterItems = semesterQuery.data?.items ?? [];
  const collegeItems = collegeQuery.data?.items ?? [];
  const subjectItems = subjectQuery.data?.items ?? [];

  const activeItems = { overall: overallItems, semester: semesterItems, college: collegeItems, subject: subjectItems }[tab];
  const scoreKey = tab === 'semester' ? 'sgpa' : tab === 'subject' ? 'total' : 'cgpa';

  return (
    <Shell title="Toppers" subtitle="Leaderboards by subject, college, semester and university.">
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Topper list">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-[14px] py-[7px] text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'border-brand bg-brand text-white' : 'border-line bg-card text-ink hover:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {tab === 'semester' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Semester-wise topper</h2>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              Semester
              <select className="input !w-auto min-w-[90px]" value={semester} onChange={(e) => setSemester(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {tab === 'college' && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-ink">College-wise topper</h2>
            <div className="mt-2 flex max-w-lg items-center gap-2">
              <label htmlFor="college" className="text-sm font-semibold text-ink">
                College
              </label>
              <select id="college" className="input" value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)}>
                <option value="">Select college…</option>
                {institutions.map((i) => (
                  <option key={i.inst_code} value={i.inst_code}>
                    {i.inst_code} · {i.inst_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {tab === 'subject' && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-ink">Subject-wise topper</h2>
            <div className="mt-2 flex max-w-md items-center gap-2">
              <label htmlFor="paper" className="text-sm font-semibold text-ink">
                Paper ID
              </label>
              <input id="paper" className="input" placeholder="e.g. 020301" value={paperId} onChange={(e) => setPaperId(e.target.value)} />
            </div>
          </div>
        )}

        {tab === 'overall' && overallQuery.isLoading && <p className="text-sm text-ink-soft">Loading toppers…</p>}
        {tab === 'overall' && overallQuery.isError && <p role="alert" className="text-sm text-bad">Could not load topper list.</p>}
        {tab === 'semester' && semesterQuery.isLoading && <p className="text-sm text-ink-soft">Loading semester topper…</p>}
        {tab === 'semester' && semesterQuery.isError && <p role="alert" className="text-sm text-bad">Could not load semester topper.</p>}
        {tab === 'college' && collegeQuery.isLoading && <p className="text-sm text-ink-soft">Loading college topper…</p>}
        {tab === 'college' && collegeQuery.isError && <p role="alert" className="text-sm text-bad">Could not load college topper.</p>}
        {tab === 'subject' && subjectQuery.isLoading && <p className="text-sm text-ink-soft">Loading subject topper…</p>}
        {tab === 'subject' && subjectQuery.isError && <p role="alert" className="text-sm text-bad">Could not load subject topper.</p>}

        {tab === 'college' && !collegeCode && <p className="text-sm text-ink-soft">Select a college to view its toppers.</p>}
        {tab === 'subject' && !paperId && <p className="text-sm text-ink-soft">Enter a paper ID to load the subject topper.</p>}

        {activeItems.length > 0 && (
          <>
            <Podium items={activeItems} scoreKey={scoreKey} />
            {tab === 'overall' && (
              <Table
                columns={[
                  { key: 'rank', label: '#' },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'cgpa', label: 'CGPA' },
                ]}
                rows={overallItems.map((t, i) => ({ rank: i + 1, name: t.name, institution_code: t.institution_code, cgpa: t.cgpa }))}
              />
            )}
            {tab === 'semester' && (
              <Table
                columns={[
                  { key: 'rank', label: '#' },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'university_rank', label: 'Univ. Rank' },
                  { key: 'sgpa', label: 'SGPA' },
                ]}
                rows={semesterItems.map((t, i) => ({
                  rank: t.college_rank ?? i + 1,
                  name: t.name,
                  institution_code: t.institution_code,
                  university_rank: t.university_rank ?? '—',
                  sgpa: t.sgpa,
                }))}
              />
            )}
            {tab === 'college' && collegeCode && (
              <Table
                columns={[
                  { key: 'rank', label: '#' },
                  { key: 'name', label: 'Name' },
                  { key: 'roll_no', label: 'Enrollment' },
                  { key: 'cgpa', label: 'CGPA' },
                ]}
                rows={collegeItems.map((t, i) => ({ rank: i + 1, name: t.name, roll_no: t.roll_no, cgpa: t.cgpa }))}
              />
            )}
            {tab === 'subject' && paperId && (
              <Table
                columns={[
                  { key: 'rank', label: '#' },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'total', label: 'Total' },
                  { key: 'grade', label: 'Grade' },
                ]}
                rows={subjectItems.map((t, i) => ({
                  rank: t.rnk ?? i + 1,
                  name: t.name,
                  institution_code: t.institution_code,
                  total: t.total,
                  grade: t.grade,
                }))}
              />
            )}
          </>
        )}

        {overviewLoading && tab === 'college' ? <p className="mt-2 text-sm text-ink-soft">Loading colleges…</p> : null}
      </div>
    </Shell>
  );
}
