/*
 * Donut chart with legend – used for part-to-whole splits (pass vs backlog).
 * Segments are drawn with stroke-dasharray against a normalised pathLength.
 */
const clamp = (value) => Math.max(0, Number(value) || 0);

export default function DonutCard({
  title,
  segments = [],
  centerLabel = 'students',
  caption,
  size = 168,
  stroke = 22,
}) {
  const total = segments.reduce((sum, s) => sum + clamp(s.value), 0);
  const radius = (size - stroke) / 2;
  let offset = 0;

  return (
    <div className="card flex flex-col p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4 sm:flex-row sm:gap-7">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
            role="img"
            aria-label={segments.map((s) => `${s.label}: ${clamp(s.value)}`).join(', ')}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--card-border)"
              strokeWidth={stroke}
            />
            {segments.map((segment) => {
              const pct = total ? (clamp(segment.value) / total) * 100 : 0;
              const circle = (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-offset}
                  pathLength={100}
                />
              );
              offset += pct;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tabular-nums text-ink">
              {total.toLocaleString()}
            </span>
            <span className="text-xs text-ink-soft">{centerLabel}</span>
          </div>
        </div>
        <ul className="w-full space-y-2.5 sm:max-w-[190px]">
          {segments.map((segment) => {
            const pct = total ? (clamp(segment.value) / total) * 100 : 0;
            return (
              <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-ink-soft">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: segment.color }}
                  />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">
                  {clamp(segment.value).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-ink-soft">({pct.toFixed(0)}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {caption ? <p className="text-center text-sm text-ink-soft">{caption}</p> : null}
    </div>
  );
}
