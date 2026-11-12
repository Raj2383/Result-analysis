/*
 * Compact course scorecard – pass-rate bar plus the student/CGPA/backlog signals.
 * Course shape matches the analytics programme_stats rows.
 */
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export default function CourseCard({ course }) {
  const pass = clamp(course.pass_rate);
  const backlog = Number(course.backlog) || 0;
  const passColor = pass >= 95 ? 'var(--success)' : pass >= 85 ? 'var(--accent)' : 'var(--danger)';
  const pillClass =
    pass >= 95 ? 'pill pill-ok' : pass >= 85 ? 'pill bg-accent-soft text-accent-dark' : 'pill pill-bad';

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {course.code || 'Course'}
          </div>
          <h3 className="mt-1 truncate text-lg font-bold text-ink">
            {course.short_name || course.name || '—'}
          </h3>
          <p className="mt-0.5 truncate text-xs text-ink-soft">{course.name || ''}</p>
        </div>
        <span className={`${pillClass} shrink-0`}>{pass.toFixed(1)}% pass</span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>Pass rate</span>
          <span className="font-semibold text-ink">{pass.toFixed(1)}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)]"
            style={{ width: `${pass}%`, background: passColor }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface/70 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-ink-soft">Students</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-ink">
            {Number(course.students || 0).toLocaleString()}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/70 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-ink-soft">Avg CGPA</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-ink">
            {Number(course.avg_cgpa || 0).toFixed(2)}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/70 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-ink-soft">Highest CGPA</dt>
          <dd className="mt-0.5 text-base font-bold tabular-nums text-ink">
            {Number(course.max_cgpa || 0).toFixed(2)}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/70 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-ink-soft">Backlogs</dt>
          <dd className={`mt-0.5 text-base font-bold tabular-nums ${backlog > 0 ? 'text-bad' : 'text-ok'}`}>
            {backlog.toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
