/*
 * Shared table – used by BOTH student marks table and toppers table (no duplicated markup).
 * Column shape: { key, label, numeric? } — numeric columns right-align with tabular digits
 * so values never shift while scanning (SGPA/CGPA/totals).
 */
export default function Table({ columns = [], rows = [] }) {
  if (!rows || rows.length === 0) {
    return <div className="card p-8 sm:p-10 text-center text-sm text-ink-soft">No records found.</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-surface/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`border-b border-line px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft ${
                    c.numeric ? 'text-right' : ''
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key ?? i} className="transition-colors hover:bg-surface/50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`border-b border-line/70 px-4 sm:px-6 py-3.5 sm:py-4 text-ink last:border-0 ${
                      c.numeric ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
