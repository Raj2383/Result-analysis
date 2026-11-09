import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import TabBar from '../components/ui/TabBar.jsx';
import Table from '../components/ui/Table.jsx';
import Podium from '../features/toppers/components/Podium.jsx';
import { getToppersOverallApi, getToppersSemesterApi, getToppersCollegeApi, getToppersSubjectApi } from '../features/toppers/api/toppersApi.js';
import { getOverviewApi } from '../features/overview/api/overviewApi.js';

const TABS = [
  { id: 'overall', label: 'Overall (University)' },
  { id: 'semester', label: 'Semester-wise' },
  { id: 'college', label: 'College-wise' },
  { id: 'subject', label: 'Subject-wise' },
];

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
  const subjects = overview?.subject_stats || overview?.by_subject || [];

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
      <div className="mb-7 sm:mb-8">
        <TabBar tabs={TABS} value={tab} onChange={setTab} label="Topper list" />
      </div>

      <div className="card p-6 sm:p-8">
        {tab === 'semester' && (
          <div className="mb-7 sm:mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-5">
            <h2 className="h2">Semester-wise topper</h2>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink">
              Semester
              <select className="input !w-auto min-w-[100px]" value={semester} onChange={(e) => setSemester(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {tab === 'college' && (
          <div className="mb-7 sm:mb-8 border-b border-line/60 pb-5">
            <h2 className="h2">College-wise topper</h2>
            <div className="mt-4 flex max-w-lg items-center gap-3">
              <label htmlFor="college" className="shrink-0 text-sm font-semibold text-ink">
                College
              </label>
              <select id="college" className="input" value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)}>
                <option value="">Select college…</option>
                {institutions.map((i) => {
                  const code = i.code || i.inst_code;
                  const name = i.name || i.inst_name;
                  return (
                    <option key={code} value={code}>
                      {code} · {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
        {tab === 'subject' && (
          <div className="mb-7 sm:mb-8 border-b border-line/60 pb-5">
            <h2 className="h2">Subject-wise topper</h2>
            <div className="mt-4 flex max-w-lg items-center gap-3">
              <label htmlFor="paper" className="shrink-0 text-sm font-semibold text-ink">
                Subject
              </label>
              <select id="paper" className="input" value={paperId} onChange={(e) => setPaperId(e.target.value)}>
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.paper_code} value={s.paper_code}>
                    {s.paper_code} · {s.paper_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tab === 'overall' && overallQuery.isLoading && <p className="py-6 text-sm text-ink-soft">Loading toppers…</p>}
        {tab === 'overall' && overallQuery.isError && <p role="alert" className="py-6 text-sm text-bad">Could not load topper list.</p>}
        {tab === 'semester' && semesterQuery.isLoading && <p className="py-6 text-sm text-ink-soft">Loading semester toppers…</p>}
        {tab === 'semester' && semesterQuery.isError && <p role="alert" className="py-6 text-sm text-bad">Could not load semester toppers.</p>}
        {tab === 'college' && collegeQuery.isLoading && <p className="py-6 text-sm text-ink-soft">Loading college toppers…</p>}
        {tab === 'college' && collegeQuery.isError && <p role="alert" className="py-6 text-sm text-bad">Could not load college toppers.</p>}
        {tab === 'subject' && subjectQuery.isLoading && <p className="py-6 text-sm text-ink-soft">Loading subject toppers…</p>}
        {tab === 'subject' && subjectQuery.isError && <p role="alert" className="py-6 text-sm text-bad">Could not load subject toppers.</p>}

        {tab === 'college' && !collegeCode && <p className="py-6 text-sm text-ink-soft">Select a college above to view its toppers.</p>}
        {tab === 'subject' && !paperId && <p className="py-6 text-sm text-ink-soft">Select a subject above to view its top scorers.</p>}

        {tab === 'semester' && !semesterQuery.isLoading && semesterItems.length === 0 && (
          <p className="py-6 text-sm text-ink-soft">No results found for Semester {semester}. (Currently Semester 5 data is ingested).</p>
        )}
        {tab === 'college' && collegeCode && !collegeQuery.isLoading && collegeItems.length === 0 && (
          <p className="py-6 text-sm text-ink-soft">No results found for College {collegeCode}.</p>
        )}
        {tab === 'subject' && paperId && !subjectQuery.isLoading && subjectItems.length === 0 && (
          <p className="py-6 text-sm text-ink-soft">No results found for Subject {paperId}.</p>
        )}

        {activeItems.length > 0 && (
          <>
            <Podium items={activeItems} scoreKey={scoreKey} />
            {tab === 'overall' && (
              <Table
                columns={[
                  { key: 'rank', label: '#', numeric: true },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'cgpa', label: 'CGPA', numeric: true },
                ]}
                rows={overallItems.map((t, i) => ({ rank: i + 1, name: t.name, institution_code: t.institution_code, cgpa: t.cgpa }))}
              />
            )}
            {tab === 'semester' && (
              <Table
                columns={[
                  { key: 'rank', label: '#', numeric: true },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'university_rank', label: 'Univ. Rank', numeric: true },
                  { key: 'sgpa', label: 'SGPA', numeric: true },
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
                  { key: 'rank', label: '#', numeric: true },
                  { key: 'name', label: 'Name' },
                  { key: 'roll_no', label: 'Enrollment', numeric: true },
                  { key: 'cgpa', label: 'CGPA', numeric: true },
                ]}
                rows={collegeItems.map((t, i) => ({ rank: i + 1, name: t.name, roll_no: t.roll_no, cgpa: t.cgpa }))}
              />
            )}
            {tab === 'subject' && paperId && (
              <Table
                columns={[
                  { key: 'rank', label: '#', numeric: true },
                  { key: 'name', label: 'Name' },
                  { key: 'institution_code', label: 'College' },
                  { key: 'total', label: 'Total', numeric: true },
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
