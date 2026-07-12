// src/components/DataTable.jsx
//
// One table component reused for customers / pools / ipsups / hbs. Takes
// a column list + raw data and handles: global search, a per-column
// filter row, a page-size selector (20/50/100), pagination controls, and
// Edit/Delete action buttons per row.
//
// Style: inspired by phpMyAdmin's Browse view — dense, light, blue-accented
// grid with the Modifier/Supprimer action links leading each row (not
// trailing), so the record identity columns are the first thing scanned
// after the actions. Calibri, sized for comfortable reading.

import { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export default function DataTable({ columns, data, onEdit, onDelete, emptyLabel = 'No records', exportFileName = 'export' }) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  // Sort state: null = no sort (original order). 'asc' -> 'desc' -> null
  // on repeated clicks of the same header.
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null

  // Reset back to page 1 whenever the active filters/search/data set
  // change size, otherwise you can get stranded on an empty page.
  useEffect(() => {
    setPage(1);
  }, [globalSearch, columnFilters, data, pageSize]);

  // Switching tabs swaps `columns` entirely — drop any sort that no
  // longer refers to a real column of the new table.
  useEffect(() => {
    if (sortKey && !columns.some((c) => c.key === sortKey)) {
      setSortKey(null);
      setSortDir(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const handleHeaderClick = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const search = globalSearch.trim().toLowerCase();
    const activeColumnFilters = Object.entries(columnFilters).filter(([, v]) => v && v.trim());

    return data.filter((row) => {
      if (search) {
        const matchesAny = columns.some((col) => {
          const cellValue = row[col.key];
          return cellValue != null && String(cellValue).toLowerCase().includes(search);
        });
        if (!matchesAny) return false;
      }

      for (const [key, filterValue] of activeColumnFilters) {
        const cellValue = row[key];
        const haystack = cellValue != null ? String(cellValue).toLowerCase() : '';
        if (!haystack.includes(filterValue.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [data, columns, globalSearch, columnFilters]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      // Nulls/empties always sink to the bottom regardless of direction.
      const aEmpty = av == null || av === '';
      const bEmpty = bv == null || bv === '';
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      // Numeric-aware compare (handles plain numbers and numeric-looking
      // strings like IPs/masks reasonably well via the collator's
      // `numeric` option), falling back to locale string compare.
      const result = collator.compare(String(av), String(bv));
      return sortDir === 'asc' ? result : -result;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleColumnFilterChange = (key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setGlobalSearch('');
    setColumnFilters({});
  };

  const hasActiveFilters = globalSearch || Object.values(columnFilters).some((v) => v && v.trim());

  // Exports EXACTLY what's on screen right now: the current page's rows
  // (pageRows), which already reflect the active search, the active
  // per-column filters, the active sort, AND the current page size —
  // nothing more, nothing less. Switching to "50 lines" or narrowing a
  // filter before exporting changes what comes out, by design.
  const handleExport = () => {
    if (pageRows.length === 0) return;

    const rows = pageRows.map((row) => {
      const record = {};
      columns.forEach((col) => {
        record[col.label] = row[col.key] ?? '';
      });
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // Reasonable default column widths so the sheet isn't unreadably
    // cramped on open — based on the longer of the header or its values.
    worksheet['!cols'] = columns.map((col) => {
      const longest = rows.reduce((max, r) => Math.max(max, String(r[col.label] ?? '').length), col.label.length);
      return { wch: Math.min(Math.max(longest + 2, 10), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${exportFileName}_page${safePage}_${stamp}.xlsx`);
  };

  return (
    // h-full + flex-col: fills exactly whatever height App.jsx's
    // `flex-1 min-h-0` wrapper gives it — no more, no less. Toolbar and
    // pagination are shrink-0 (fixed size, always visible); only the
    // middle table box is flex-1 min-h-0, so IT is what absorbs any
    // extra/short space and scrolls internally. Pagination can no
    // longer be pushed below the bottom of the screen.
    <div className="h-full flex flex-col gap-3" style={{ fontFamily: FONT_STACK }}>
      {/* Global search + page size + result count */}
      <div className="shrink-0 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <span>Nombre de lignes</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-blue-300 rounded px-2.5 py-1.5 text-sm text-blue-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Rechercher dans cette table..."
          className="flex-1 min-w-[220px] bg-white border border-blue-300 rounded px-3 py-1.5 text-sm text-blue-950 placeholder:text-blue-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold uppercase tracking-wide text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            Effacer les filtres
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={pageRows.length === 0}
          title="Exporte exactement les lignes actuellement affichées (page + filtres en cours)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wide shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          ⬇ Exporter .xlsx
        </button>

        <span className="text-xs font-medium text-blue-700/80 ml-auto">
          {pageRows.length} affiché{pageRows.length !== 1 ? 's' : ''} / {filtered.length} filtré{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 min-h-0 border border-blue-300 rounded-md bg-white overflow-hidden shadow-sm flex flex-col">
        {/* flex-1 min-h-0 here too: this box takes exactly the space
            left between the toolbar above and the pagination below, and
            THAT'S what scrolls — not the page, not a hardcoded vh. */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left border-collapse text-sm">
            {/* Sticky on the whole <thead> (not each <tr> separately) so
                both header rows travel together as one block, pinned to
                the top of the scroll box above — no pixel-offset math
                needed between the two rows. */}
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-blue-100 text-blue-900 border-b border-blue-300 font-semibold">
                <th className="p-2.5 whitespace-nowrap border-r border-blue-200 text-sm">Actions</th>
                {columns.map((col) => {
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleHeaderClick(col.key)}
                      title="Cliquer pour trier"
                      className={`p-2.5 whitespace-nowrap border-r border-blue-200 last:border-r-0 text-sm select-none cursor-pointer transition ${
                        isActive ? 'bg-blue-200/70' : 'hover:bg-blue-200/40'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <span className={`text-[10px] ${isActive ? 'text-blue-900' : 'text-blue-400'}`}>
                          {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-blue-50 border-b border-blue-200">
                <th className="p-1.5 border-r border-blue-200" />
                {columns.map((col) => (
                  <th key={col.key} className="p-1.5 border-r border-blue-200 last:border-r-0">
                    <input
                      type="text"
                      value={columnFilters[col.key] || ''}
                      onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                      placeholder="Filtrer..."
                      className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-xs text-blue-900 placeholder:text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-blue-400 text-sm">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, idx) => {
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50';
                  return (
                    <tr key={row.id ?? idx} className={`${rowBg} hover:bg-blue-100/60 border-b border-blue-100 transition`}>
                      <td className="p-2 whitespace-nowrap border-r border-blue-100">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onEdit(row)}
                            className="text-blue-700 hover:text-blue-900 hover:underline text-sm font-medium cursor-pointer flex items-center gap-1"
                          >
                            ✎ Modifier
                          </button>
                          <button
                            onClick={() => onDelete(row)}
                            className="text-rose-600 hover:text-rose-800 hover:underline text-sm font-medium cursor-pointer flex items-center gap-1"
                          >
                            ✕ Supprimer
                          </button>
                        </div>
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="p-2 max-w-[240px] truncate border-r border-blue-100 last:border-r-0 text-blue-950 text-sm"
                          title={String(row[col.key] ?? '')}
                        >
                          {String(row[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — shrink-0, always visible, never pushed off-screen. */}
      <div className="shrink-0 flex items-center justify-between text-sm font-medium text-blue-800">
        <span>
          Page {safePage} sur {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-3 py-1.5 rounded border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-medium text-xs uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-3 py-1.5 rounded border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-medium text-xs uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
