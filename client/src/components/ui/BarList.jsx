/*
 * Shared labeled-bar breakdown card – reusable across dashboard surfaces.
 * Row shape: { label, value }; bar widths are clamped to 0–100% of `max`.
 * Optional `colorFor(row)` styles each bar (e.g. colour-code pass rates).
 */
const clampPct = (value, max) => Math.max(0, Math.min(100, (Number(value) / (max || 1)) * 100));

export default function BarList({
  title,
  subtitle,
  rows,
  max,
  suffix = '',
  colorFor,
  columns = 1,
}) {
  const columnClass =
    columns >= 3
      ? 'sm:columns-2 lg:columns-3 [column-gap:2rem]'
      : columns === 2
        ? 'sm:columns-2 [column-gap:2rem]'
        : '';
  return (
    <div className="card p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      <div className={`mt-6 ${columnClass}`}>
        {!rows || rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No breakdown data available yet.</p>
        ) : (
          rows.map((r, i) => {
            const color = colorFor ? colorFor(r) : null;
            return (
              <div key={`${r.label}-${i}`} className="mb-4 break-inside-avoid sm:mb-5 last:mb-0">
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
                  <i
                    className="transition-[width] duration-500 ease-[var(--ease-out)]"
                    style={{ width: `${clampPct(r.value, max)}%`, ...(color ? { background: color } : {}) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
