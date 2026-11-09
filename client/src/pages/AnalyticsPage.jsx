import { useQuery } from '@tanstack/react-query';
import Shell from './_Shell.jsx';
import Table from '../components/ui/Table.jsx';
import { getAnalyticsApi } from '../features/analytics/api/analyticsApi.js';
import { getToppersOverallApi } from '../features/toppers/api/toppersApi.js';
import { getOverviewApi } from '../features/overview/api/overviewApi.js';

function BarList({ title, rows, max, suffix = '' }) {
  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4">
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No breakdown data available yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="truncate text-ink" title={r.label}>
                  {r.label}
                </span>
                <b className="shrink-0 text-ink">
                  {r.value}
                  {suffix}
                </b>
              </div>
              <div className="bar mt-1">
                <i style={{ width: `${Math.max(0, Math.min(100, (Number(r.value) / (max || 1)) * 100))}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function pickBreakdown(source, candidates) {
  if (!source) return [];
  for (const key of candidates) {
    const arr = source[key];
    if (Array.isArray(arr) && arr.length) return arr;
  }
  return [];
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['analytics'], queryFn: getAnalyticsApi });
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: getOverviewApi });
  const top10Query = useQuery({ queryKey: ['toppers', 'overall', 10], queryFn: () => getToppersOverallApi(10) });

  const summary = data || {};
  const toppers = top10Query.data?.items ?? [];
  const highest = toppers[0]?.cgpa;

  const evaluated = Number(summary.students ?? 0);
  const passRateRaw = summary.pass_rate ?? summary.pass_percentage;
  const passRate =
    passRateRaw != null
      ? `${Number(passRateRaw).toFixed(1)}%`
      : evaluated > 0 && summary.passed != null
        ? `${((Number(summary.passed) / evaluated) * 100).toFixed(1)}%`
        : '—';

  const collegeRaw = pickBreakdown(overview || summary, ['college_stats', 'colleges', 'by_college', 'institution_stats']);
  const subjectRaw = pickBreakdown(overview || summary, ['subject_stats', 'subjects', 'by_subject', 'paper_stats']);
  const collegeBars = collegeRaw.slice(0, 6).map((r) => ({
    label: r.inst_name || r.institution_name || r.inst_code || r.name || r.label || 'College',
    value: Number(r.avg_cgpa ?? r.avg_sgpa ?? r.average ?? r.value ?? 0).toFixed(2),
  }));
  const subjectBars = subjectRaw.slice(0, 6).map((r) => ({
    label: r.paper_name || r.subject_name || r.paper_code || r.name || r.label || 'Subject',
    value: Number(r.pass_rate ?? r.pass_percentage ?? r.value ?? 0).toFixed(1),
  }));

  const statCards = [
    { v: passRate, l: 'Overall pass rate', accent: true },
    { v: Number(summary.avg_cgpa ?? 0).toFixed(2), l: 'Average CGPA' },
    { v: highest != null ? Number(highest).toFixed(2) : '—', l: 'Highest CGPA' },
    { v: String(summary.backlog_total ?? 0), l: 'Students with backlog', danger: Number(summary.backlog_total ?? 0) > 0 },
  ];

  return (
    <Shell title="Analytics" subtitle="Pass rate and average performance across colleges and subjects.">
      {isLoading && <p className="text-sm text-ink-soft">Loading analytics…</p>}
      {isError && (
        <p role="alert" className="text-sm text-bad">
          {error?.response?.data?.message || 'Could not load analytics.'}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarList title="Average CGPA by college" rows={collegeBars} max={10} />
            <BarList title="Pass % by subject" rows={subjectBars} max={100} suffix="%" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((c) => (
              <div key={c.l} className="card p-5">
                <div className={`stat ${c.accent ? 'text-ok' : c.danger ? 'text-bad' : ''}`}>{c.v}</div>
                <div className="lbl mt-0.5">{c.l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold text-ink">Top 10 by CGPA</h2>
        {top10Query.isLoading && <p className="text-sm text-ink-soft">Loading top 10…</p>}
        {top10Query.isError && <p role="alert" className="text-sm text-bad">Could not load toppers.</p>}
        {toppers.length > 0 && (
          <Table
            columns={[
              { key: 'rank', label: '#' },
              { key: 'name', label: 'Name' },
              { key: 'roll_no', label: 'Enrollment' },
              { key: 'institution_code', label: 'College' },
              { key: 'cgpa', label: 'CGPA' },
            ]}
            rows={toppers.map((t, i) => ({
              rank: i + 1,
              name: t.name,
              roll_no: t.roll_no,
              institution_code: t.institution_code,
              cgpa: t.cgpa,
            }))}
          />
        )}
      </section>
    </Shell>
  );
}
