/*
 * Pill-style tab bar (tablist) used for leaderboard switcher etc.
 * Sits on top of .btn for the shared transition + press feedback.
 */
export default function TabBar({ tabs = [], value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`btn rounded-full border px-4.5 py-2 sm:px-5 sm:py-2.5 text-sm ${
            value === t.id
              ? 'border-brand bg-brand text-white shadow-sm'
              : 'border-line bg-card text-ink hover:bg-surface'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
