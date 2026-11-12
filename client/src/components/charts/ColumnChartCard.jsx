/*
 * Vertical column chart – lightweight CSS bars (no external chart dependency).
 * Row shape: { label, value, color? }.
 */
const clamp = (value) => Math.max(0, Number(value) || 0);

export default function ColumnChartCard({
  title,
  rows = [],
  height = 170,
  formatValue,
  caption,
}) {
  const max = Math.max(1, ...rows.map((r) => clamp(r.value)));

  return (
    <div className="card flex flex-col p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">No data for this filter.</p>
      ) : (
        <div className="mt-6 flex flex-1 flex-col justify-end">
          <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
            {rows.map((row) => {
              const value = clamp(row.value);
              const pct = Math.max(value > 0 ? 3 : 0, (value / max) * 100);
              return (
                <div key={row.label} className="relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md transition-[height] duration-500 ease-[var(--ease-out)]"
                    style={{ height: `${pct}%`, background: row.color || 'var(--brand-light)' }}
                    title={`${row.label}: ${formatValue ? formatValue(value) : value}`}
                  />
                  <span
                    className="absolute inset-x-0 text-center text-[10px] font-semibold tabular-nums text-ink"
                    style={{ bottom: `calc(${pct}% + 4px)` }}
                  >
                    {formatValue ? formatValue(value) : value}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex-1 text-center text-[10px] leading-tight text-ink-soft sm:text-xs"
              >
                {row.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {caption ? <p className="mt-4 text-sm text-ink-soft">{caption}</p> : null}
    </div>
  );
}
