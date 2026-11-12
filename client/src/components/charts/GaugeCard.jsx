/*
 * Radial gauge – single 0–100 metric rendered as a ring.
 * Uses the app's CSS variables so it follows light/dark themes automatically.
 */
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export default function GaugeCard({
  title,
  value = 0,
  label = 'Pass rate',
  caption,
  color = 'var(--success)',
  size = 168,
  stroke = 14,
}) {
  const pct = clamp(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="card flex flex-col p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
            role="img"
            aria-label={`${label}: ${pct.toFixed(1)}%`}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--card-border)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="stat text-[30px] sm:text-[34px]">{pct.toFixed(1)}%</span>
            <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {label}
            </span>
          </div>
        </div>
        {caption ? <p className="mt-4 text-center text-sm text-ink-soft">{caption}</p> : null}
      </div>
    </div>
  );
}
