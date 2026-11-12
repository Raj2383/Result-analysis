import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Table from '../components/ui/Table.jsx';
import BarList from '../components/ui/BarList.jsx';
import Button from '../components/ui/Button.jsx';
import CourseFilterBar from '../components/ui/CourseFilterBar.jsx';
import GaugeCard from '../components/charts/GaugeCard.jsx';
import DonutCard from '../components/charts/DonutCard.jsx';
import ColumnChartCard from '../components/charts/ColumnChartCard.jsx';
import ScatterChartCard from '../components/charts/ScatterChartCard.jsx';
import LeaderboardCard from '../components/charts/LeaderboardCard.jsx';
import CourseCard from '../components/charts/CourseCard.jsx';
import InsightsCard from '../components/charts/InsightsCard.jsx';
import { getAnalyticsApi } from '../features/analytics/api/analyticsApi.js';
import { getToppersOverallApi } from '../features/toppers/api/toppersApi.js';
import { getOverviewApi } from '../features/overview/api/overviewApi.js';

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const fmtInt = (value) => (value == null ? '—' : num(value).toLocaleString());
const fmt2 = (value) => (value == null ? '—' : num(value).toFixed(2));
const fmtPct = (value) => (value == null ? '—' : `${num(value).toFixed(1)}%`);
const fmtCompact = (value) =>
  num(value) >= 1000 ? `${(num(value) / 1000).toFixed(1)}k` : num(value).toLocaleString();

function pickBreakdown(source, candidates) {
  if (!source) return [];
  for (const key of candidates) {
    const arr = source[key];
    if (Array.isArray(arr) && arr.length) return arr;
  }
  return [];
}

const rateColor = (value) =>
  value >= 98 ? 'var(--success)' : value >= 96 ? 'var(--accent)' : 'var(--danger)';

const CGPA_BUCKETS = ['<5', '5-6', '6-7', '7-8', '8-9', '9-10'];
const CGPA_COLORS = [
  'var(--danger)',
  'var(--danger)',
  'var(--accent)',
  'var(--accent)',
  'var(--brand-light)',
  'var(--success)',
];

const GRADE_ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];
const GRADE_COLORS = {
  O: 'var(--success)',
  'A+': 'var(--success)',
  A: 'var(--brand-light)',
  'B+': 'var(--brand)',
  B: 'var(--brand)',
  C: 'var(--accent)',
  P: 'var(--accent)',
  F: 'var(--danger)',
};

const COLLEGE_COLUMNS = [
  { key: 'college', label: 'College' },
  { key: 'code', label: 'Code' },
  { key: 'students', label: 'Students', numeric: true },
  { key: 'avgCgpa', label: 'Avg CGPA', numeric: true },
  { key: 'passRate', label: 'Pass %', numeric: true },
];

const SUBJECT_COLUMNS = [
  { key: 'subject', label: 'Subject' },
  { key: 'code', label: 'Code' },
  { key: 'appeared', label: 'Appeared', numeric: true },
  { key: 'passed', label: 'Passed', numeric: true },
  { key: 'passRate', label: 'Pass %', numeric: true },
  { key: 'avgTotal', label: 'Avg total', numeric: true },
];

export default function AnalyticsPage() {
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const filterParams = {
    programmeCode: course || undefined,
    batch: batch ? Number(batch) : undefined,
    semester: semester ? Number(semester) : undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', filterParams],
    queryFn: () => getAnalyticsApi(filterParams),
  });
  const { data: overview } = useQuery({
    queryKey: ['overview', filterParams],
    queryFn: () => getOverviewApi(filterParams),
  });
  const top10Query = useQuery({
    queryKey: ['toppers', 'overall', 10, filterParams],
    queryFn: () => getToppersOverallApi(10, filterParams),
  });

  const summary = data || {};
  const toppers = top10Query.data?.items ?? [];
  const breakdownSource = data || overview;

  const collegeRaw = pickBreakdown(breakdownSource, [
    'college_stats',
    'colleges',
    'by_college',
    'institution_stats',
  ]);
  const subjectRaw = pickBreakdown(breakdownSource, [
    'subject_stats',
    'subjects',
    'by_subject',
    'paper_stats',
  ]);
  const programmeRaw = pickBreakdown(breakdownSource, [
    'programme_stats',
    'by_programme',
    'course_stats',
  ]);

  const evaluated = num(summary.evaluated ?? summary.students);
  const passed = num(summary.passed);
  const failed = num(summary.failed ?? summary.backlog_total);
  const passRateRaw = summary.pass_rate ?? summary.pass_percentage;
  const passRateValue =
    passRateRaw != null
      ? num(passRateRaw)
      : evaluated > 0
        ? (passed / evaluated) * 100
        : 0;
  const passRate = passRateRaw != null ? fmtPct(passRateRaw) : fmtPct(passRateValue);
  const highest = summary.max_cgpa ?? toppers[0]?.cgpa;

  // Chart: ignore very small colleges so a single student cannot top the ranking.
  const meaningfulColleges = collegeRaw.filter((r) => num(r.students) >= 10);
  const topCollege = meaningfulColleges[0];

  // Weakest subjects first – the most actionable view for a pass-rate panel.
  const subjectRate = (r) => {
    const raw = r.pass_rate ?? r.pass_percentage ?? r.value;
    return raw == null ? Number.POSITIVE_INFINITY : num(raw);
  };
  const subjectSorted = [...subjectRaw].sort((a, b) => subjectRate(a) - subjectRate(b));

  const subjectBars = subjectSorted.map((r) => ({
    label: r.paper_name || r.subject_name || r.paper_code || r.name || r.label || 'Subject',
    value: num(r.pass_rate ?? r.pass_percentage ?? r.value).toFixed(1),
  }));

  const collegePoints = meaningfulColleges.map((r) => {
    const pass = num(r.pass_rate);
    return {
      x: num(r.students),
      y: num(r.avg_cgpa),
      passRate: pass,
      label: r.inst_name || r.institution_name || `College ${r.institution_code || ''}`,
      color: rateColor(pass),
    };
  });

  const cgpaDistribution = Array.isArray(data?.cgpa_distribution) ? data.cgpa_distribution : [];
  const cgpaMap = new Map(cgpaDistribution.map((r) => [r.bucket, num(r.students)]));
  const cgpaBars = CGPA_BUCKETS.map((label, i) => ({
    label,
    value: cgpaMap.get(label) ?? 0,
    color: CGPA_COLORS[i],
  }));

  const gradeDistribution = Array.isArray(data?.grade_distribution) ? data.grade_distribution : [];
  const gradeMap = new Map(gradeDistribution.map((r) => [r.grade, num(r.count)]));
  const extraGrades = [...gradeMap.keys()].filter((g) => !GRADE_ORDER.includes(g));
  const gradeBars = [
    ...GRADE_ORDER.map((grade) => ({
      label: grade,
      value: gradeMap.get(grade) ?? 0,
      color: GRADE_COLORS[grade],
    })),
    ...extraGrades.map((grade) => ({
      label: grade,
      value: gradeMap.get(grade) ?? 0,
      color: 'var(--danger)',
    })),
  ];

  const statCards = [
    { v: fmtInt(evaluated), l: 'Students evaluated' },
    { v: passRate, l: 'Overall pass rate', accent: true },
    { v: fmt2(summary.avg_cgpa), l: 'Average CGPA' },
    { v: highest != null ? fmt2(highest) : '—', l: 'Highest CGPA' },
    {
      v: fmtInt(summary.backlog_total),
      l: 'Students with backlog',
      danger: num(summary.backlog_total) > 0,
    },
  ];

  const leaderboardRows = toppers.map((t, i) => ({
    rank: i + 1,
    name: t.name || t.roll_no || '—',
    meta: [t.roll_no, t.programme, t.institution_code ? `College ${t.institution_code}` : null]
      .filter(Boolean)
      .join(' · '),
    value: t.cgpa == null ? '—' : num(t.cgpa).toFixed(2),
  }));

  const insights = [];
  if (topCollege) {
    insights.push({
      tone: 'ok',
      label: 'Top college by avg CGPA',
      value: topCollege.inst_name || `College ${topCollege.institution_code || ''}`,
      detail: `${fmt2(topCollege.avg_cgpa)} avg CGPA · ${fmtInt(topCollege.students)} students`,
    });
  }
  if (subjectSorted[0]) {
    const weakest = subjectSorted[0];
    insights.push({
      tone: 'bad',
      label: 'Lowest pass % subject',
      value: weakest.paper_name || weakest.paper_code,
      detail: `${fmtPct(weakest.pass_rate)} pass · ${fmtInt(weakest.appeared)} appeared`,
    });
  }
  const bestCourse = [...programmeRaw].sort((a, b) => num(b.pass_rate) - num(a.pass_rate))[0];
  if (bestCourse) {
    insights.push({
      tone: 'ok',
      label: 'Best course pass rate',
      value: bestCourse.short_name || bestCourse.name || bestCourse.code,
      detail: `${fmtPct(bestCourse.pass_rate)} pass · ${fmtInt(bestCourse.students)} students`,
    });
  }
  const backlogCourse = [...programmeRaw].sort((a, b) => num(b.backlog) - num(a.backlog))[0];
  if (backlogCourse && num(backlogCourse.backlog) > 0) {
    insights.push({
      tone: 'warn',
      label: 'Most backlogs',
      value: backlogCourse.short_name || backlogCourse.name || backlogCourse.code,
      detail: `${fmtInt(backlogCourse.backlog)} of ${fmtInt(summary.backlog_total)} backlogs`,
    });
  }
  const topBand = [...cgpaBars].sort((a, b) => b.value - a.value)[0];
  if (topBand && topBand.value > 0 && evaluated > 0) {
    insights.push({
      tone: 'ok',
      label: 'Most common CGPA band',
      value: `${topBand.label} CGPA`,
      detail: `${fmtInt(topBand.value)} students (${((topBand.value / evaluated) * 100).toFixed(1)}%)`,
    });
  }

  const collegeRows = collegeRaw.map((r, i) => ({
    key: `${r.institution_code ?? r.inst_code ?? 'college'}-${i}`,
    college: r.inst_name || r.institution_name || '—',
    code: r.institution_code ?? r.inst_code ?? '—',
    students: fmtInt(r.students),
    avgCgpa: r.avg_cgpa == null ? '—' : fmt2(r.avg_cgpa),
    passRate: r.pass_rate == null ? '—' : fmtPct(r.pass_rate),
  }));

  const subjectRows = subjectSorted.map((r, i) => ({
    key: `${r.paper_code ?? ''}-${r.paper_name ?? r.subject_name ?? ''}-${i}`,
    subject: r.paper_name || r.subject_name || '—',
    code: r.paper_code || r.code || '—',
    appeared: fmtInt(r.appeared),
    passed: fmtInt(r.passed),
    passRate: r.pass_rate == null ? '—' : fmtPct(r.pass_rate),
    avgTotal: r.avg_total == null ? '—' : num(r.avg_total).toFixed(1),
  }));

  return (
    <Shell title="Analytics" subtitle="Performance across courses, batches, colleges and subjects.">
      <CourseFilterBar
        courses={overview?.programmes || []}
        batches={overview?.batches || []}
        selectedCourse={course}
        onCourseChange={setCourse}
        selectedBatch={batch}
        onBatchChange={setBatch}
        selectedSemester={semester}
        onSemesterChange={setSemester}
        showSemester={true}
      />
      {isLoading && <p className="py-4 text-sm text-ink-soft">Loading analytics…</p>}
      {isError && (
        <p role="alert" className="py-4 text-sm text-bad">
          {error?.response?.data?.message || 'Could not load analytics.'}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
            {statCards.map((c) => (
              <div key={c.l} className="card p-5 sm:p-6">
                <div
                  className={`stat text-[26px] sm:text-[30px] ${
                    c.accent ? 'text-ok' : c.danger ? 'text-bad' : ''
                  }`}
                >
                  {c.v}
                </div>
                <div className="lbl mt-1.5">{c.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <GaugeCard
              title="Overall pass rate"
              value={passRateValue}
              label="students passed"
              caption={`${fmtInt(passed)} of ${fmtInt(evaluated)} evaluated`}
            />
            <DonutCard
              title="Pass vs backlog"
              segments={[
                { label: 'Passed', value: passed, color: 'var(--success)' },
                { label: 'With backlog', value: failed, color: 'var(--danger)' },
              ]}
              centerLabel="students"
            />
            <ColumnChartCard
              title="CGPA distribution"
              rows={cgpaBars}
              caption="Students grouped by CGPA band"
              formatValue={fmtCompact}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ScatterChartCard
                title="College performance"
                points={collegePoints}
                xLabel="Students"
                yLabel="Avg CGPA"
                caption="Each bubble is a college; colour shows its pass rate."
              />
            </div>
            <ColumnChartCard
              title="Grade distribution"
              rows={gradeBars}
              caption="All marks by awarded grade"
              formatValue={fmtCompact}
            />
          </div>

          <div className="mt-8">
            <BarList
              title={`Pass % by subject (${subjectBars.length})`}
              subtitle="Lowest pass rate first — easiest place to focus."
              rows={subjectBars}
              max={100}
              suffix="%"
              colorFor={(row) => rateColor(Number(row.value))}
              columns={3}
            />
          </div>

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h2 className="h2">Course performance</h2>
              <span className="text-xs text-ink-soft">Pass rate · CGPA · backlogs</span>
            </div>
            {programmeRaw.length === 0 ? (
              <div className="card p-8 text-center text-sm text-ink-soft">
                No course data for this filter.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {programmeRaw.map((programme, i) => (
                  <CourseCard key={programme.code ?? i} course={programme} />
                ))}
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {top10Query.isLoading ? (
                <div className="card p-6 py-20 text-center text-sm text-ink-soft sm:p-7">
                  Loading top 10…
                </div>
              ) : top10Query.isError ? (
                <div className="card p-6 py-20 text-center text-sm text-bad sm:p-7">
                  Could not load toppers.
                </div>
              ) : (
                <LeaderboardCard
                  title="Top 10 by CGPA"
                  rows={leaderboardRows}
                  valueLabel="CGPA"
                />
              )}
            </div>
            <InsightsCard insights={insights} />
          </div>

          <section className="mt-10 sm:mt-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="h2">Detailed tables</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Exact numbers behind the charts, if you need to drill in.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? 'Hide tables' : 'Show tables'}
              </Button>
            </div>
            {showDetails && (
              <div className="mt-6 space-y-10">
                <div>
                  <h2 className="h2 mb-4">
                    College performance — ranked by average CGPA ({collegeRows.length})
                  </h2>
                  <Table columns={COLLEGE_COLUMNS} rows={collegeRows} />
                </div>
                <div>
                  <h2 className="h2 mb-4">
                    Subject performance — lowest pass % first ({subjectRows.length})
                  </h2>
                  <Table columns={SUBJECT_COLUMNS} rows={subjectRows} />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
