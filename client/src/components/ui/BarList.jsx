/*
 * Shared labeled-bar breakdown card – reusable across dashboard surfaces.
 * Row shape: { label, value }; bar widths are clamped to 0–100% of `max`.
 */
const clampPct = (value, max) => Math.max(0, Math.min(100, (Number(value) / (max || 1)) * 100));

export default function BarList({ title, rows, max, suffix = '' }) {
  return (
    <div className="card p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      <div className="mt-6">
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No breakdown data available yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="mb-4 sm:mb-5 last:mb-0">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-ink font-medium" title={r.label}>
                  {r.label}
                </span>
                <b className="shrink-0 font-bold tabular-nums text-ink">
                  {r.value}
                  {suffix}
                </b>
              </div>
              <div className="bar mt-2">
                <i className="transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${clampPct(r.value, max)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
