/*
 * Visual leaderboard – replaces a plain table for ranked "top N" views.
 * Row shape: { rank, name, meta, value, scorePct? }.
 */
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

export default function LeaderboardCard({ title, rows = [], valueLabel = 'CGPA', caption }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));

  return (
    <div className="card p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft">No records found.</p>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {rows.map((row) => {
            const pct = ((Number(row.value) || 0) / max) * 100;
            const rankClass =
              row.rank === 1
                ? 'bg-accent text-ink'
                : row.rank <= 3
                  ? 'bg-brand text-white'
                  : 'bg-surface text-ink-soft';
            return (
              <li
                key={row.rank}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface/60"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${rankClass}`}
                >
                  {row.rank}
                </span>
                <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand sm:flex">
                  {initials(row.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{row.name}</div>
                  <div className="truncate text-xs text-ink-soft">{row.meta}</div>
                </div>
                <div className="hidden w-24 sm:block">
                  <div className="bar">
                    <i style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold tabular-nums text-ink">{row.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-soft">
                    {valueLabel}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {caption ? <p className="mt-4 text-sm text-ink-soft">{caption}</p> : null}
    </div>
  );
}
