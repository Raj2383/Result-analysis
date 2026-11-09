/*
 * Podium – top-three ranking visual for the toppers feature.
 * Renders pillars in 2-1-3 order with a medal palette (gold/silver/bronze).
 * Scores use tabular digits so values never shift layout.
 */
export default function Podium({ items, scoreKey }) {
  if (!items || items.length < 1) return null;
  const [a, b, c] = items;
  const slots = [
    { item: b, h: 76, bg: 'bg-[#8b93b4] text-white', n: 2 },
    { item: a, h: 108, bg: 'bg-accent text-ink', n: 1 },
    { item: c, h: 58, bg: 'bg-[#bc8055] text-white', n: 3 },
  ].filter((s) => s.item);
  return (
    <div className="mb-9 sm:mb-10 flex items-end justify-center gap-5 sm:gap-8">
      {slots.map((s) => (
        <div key={s.n} className="w-[110px] text-center sm:w-[130px]">
          <small className="mb-2 block truncate text-[13px] font-medium text-ink-soft" title={s.item.name}>
            {s.item.name || s.item.roll_no || '—'}
          </small>
          <div
            className={`flex items-start justify-center rounded-t-xl pt-2.5 text-2xl font-extrabold shadow-sm ${s.bg}`}
            style={{ height: s.h }}
          >
            {s.n}
          </div>
          <div className="mt-2 text-sm font-bold tabular-nums text-ink">{s.item[scoreKey] ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}
