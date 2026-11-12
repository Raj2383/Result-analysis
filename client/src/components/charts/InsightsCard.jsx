/*
 * Auto-generated key insights – short, scannable findings from the same aggregates.
 * Insight shape: { tone: 'ok' | 'warn' | 'bad', label, value, detail }.
 */
const TONE_CLASS = {
  ok: 'bg-ok',
  warn: 'bg-accent',
  bad: 'bg-bad',
};

export default function InsightsCard({ title = 'Key insights', insights = [] }) {
  return (
    <div className="card flex flex-col p-6 sm:p-7">
      <h2 className="h2">{title}</h2>
      {insights.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft">No insights for this filter.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {insights.map((insight) => (
            <li key={insight.label} className="flex gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  TONE_CLASS[insight.tone] || 'bg-ok'
                }`}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  {insight.label}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-ink break-words">
                  {insight.value}
                </div>
                {insight.detail ? (
                  <div className="mt-0.5 text-xs text-ink-soft">{insight.detail}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
