import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

export default function DataTable({ columns, data, searchKeys = [], pageSize = PAGE_SIZE }) {
  const [query, setQuery] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Filter
  const filtered = data.filter(row => {
    if (!query) return true;
    return searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(query.toLowerCase()));
  });

  // Sort
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const va = a[sortCol] ?? '';
        const vb = b[sortCol] ?? '';
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="mb-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input !pl-9 w-full max-w-xs"
            placeholder="Search…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`table-th ${col.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortCol === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-td text-center text-gray-400 py-10">
                  No records found.
                </td>
              </tr>
            ) : paginated.map((row, i) => (
              <tr key={row.id ?? i} className="table-tr">
                {columns.map(col => (
                  <td key={col.key} className="table-td">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost py-1 px-2"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <button
            className="btn-ghost py-1 px-2"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
