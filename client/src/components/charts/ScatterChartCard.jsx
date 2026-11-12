/*
 * Bubble/scatter chart – plots one dot per college (students vs average CGPA).
 * Bubble size and colour encode the pass rate, so outliers stand out instantly.
 */
const FALLBACK = 'var(--brand-light)';

export default function ScatterChartCard({
  title,
  points = [],
  xLabel = 'Students',
  yLabel = 'Avg CGPA',
  caption,
}) {
  const W = 460;
  const H = 280;
  const margin = { top: 18, right: 16, bottom: 42, left: 48 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const xs = points.length ? points.map((p) => Number(p.x) || 0) : [0];
  const ys = points.length ? points.map((p) => Number(p.y) || 0) : [0];
  const xMax = Math.max(10, Math.ceil(Math.max(...xs) / 50) * 50);
  const yMin = Math.max(0, Math.floor((Math.min(...ys) - 0.3) * 10) / 10);
  const yMax = Math.min(10, Math.ceil((Math.max(...ys) + 0.3) * 10) / 10);
  const ySpan = Math.max(0.1, yMax - yMin);

  const xTicks = Array.from({ length: 5 }, (_, i) => (xMax / 4) * i);
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (ySpan / 4) * i);

  const px = (x) => margin.left + ((Number(x) || 0) / xMax) * plotW;
  const py = (y) => margin.top + (1 - ((Number(y) || 0) - yMin) / ySpan) * plotH;
  const bubbleR = (passRate) => 4.5 + (Math.max(0, Math.min(100, Number(passRate) || 0)) / 100) * 6;

  return (
    <div className="card flex flex-col p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      {points.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">No data for this filter.</p>
      ) : (
        <div className="mt-5">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="w-full">
            {yTicks.map((tick) => {
              const y = py(tick);
              return (
                <g key={`y-${tick}`}>
                  <line
                    x1={margin.left}
                    x2={W - margin.right}
                    y1={y}
                    y2={y}
                    stroke="var(--card-border)"
                    strokeDasharray="3 4"
                  />
                  <text
                    x={margin.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--muted)"
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {xTicks.map((tick) => {
              const x = px(tick);
              return (
                <g key={`x-${tick}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={margin.top}
                    y2={H - margin.bottom}
                    stroke="var(--card-border)"
                    strokeDasharray="3 4"
                    opacity="0.5"
                  />
                  <text
                    x={x}
                    y={H - margin.bottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--muted)"
                  >
                    {Math.round(tick)}
                  </text>
                </g>
              );
            })}
            <line
              x1={margin.left}
              x2={W - margin.right}
              y1={H - margin.bottom}
              y2={H - margin.bottom}
              stroke="var(--card-border)"
            />
            <line
              x1={margin.left}
              x2={margin.left}
              y1={margin.top}
              y2={H - margin.bottom}
              stroke="var(--card-border)"
            />
            {points.map((point, i) => (
              <circle
                key={`${point.label}-${i}`}
                cx={px(point.x)}
                cy={py(point.y)}
                r={bubbleR(point.passRate)}
                fill={point.color || FALLBACK}
                fillOpacity="0.72"
                stroke={point.color || FALLBACK}
                strokeWidth="1.5"
              >
                <title>
                  {`${point.label}\n${xLabel}: ${Number(point.x).toLocaleString()}\n${yLabel}: ${Number(
                    point.y
                  ).toFixed(2)}${
                    point.passRate != null ? `\nPass: ${Number(point.passRate).toFixed(1)}%` : ''
                  }`}
                </title>
              </circle>
            ))}
            <text
              x={margin.left + plotW / 2}
              y={H - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--muted)"
            >
              {xLabel}
            </text>
            <text
              x={14}
              y={margin.top + plotH / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--muted)"
              transform={`rotate(-90 14 ${margin.top + plotH / 2})`}
            >
              {yLabel}
            </text>
          </svg>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--success)' }}
              />
              High pass rate
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
              Mid
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: 'var(--danger)' }}
              />
              Needs attention
            </span>
          </div>
        </div>
      )}
      {caption ? <p className="mt-3 text-sm text-ink-soft">{caption}</p> : null}
    </div>
  );
}
