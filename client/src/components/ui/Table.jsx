// Shared table – used by BOTH student marks table and toppers table (no duplicated markup).
export default function Table({ columns = [], rows = [] }) {
  if (!rows || rows.length === 0) {
    return <div className="card p-6 text-center text-sm text-ink-soft">No records found.</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {columns.map((c) => (
                <th key={c.key} className="border-b border-line px-2 py-2 font-semibold text-ink-soft">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className="border-b border-line px-2 py-[9px] text-ink last:border-0">
                    {r[c.key]}
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
