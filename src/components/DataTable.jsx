"use client";
import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from "lucide-react";
import { SkeletonRows } from "./Skeleton";

function get(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

export default function DataTable({
  columns,
  rows = [],
  searchKeys = [],
  filters = [],
  pageSize = 10,
  rowClass,
  onRowClick,
  toolbar,
  exportName,
  emptyText = "No records found",
  empty,
  loading = false,
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [filterVals, setFilterVals] = useState({});

  const filtered = useMemo(() => {
    let r = rows;
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((row) => searchKeys.some((k) => String(get(row, k) ?? "").toLowerCase().includes(s)));
    }
    for (const f of filters) {
      const v = filterVals[f.key];
      if (v) r = r.filter((row) => String(get(row, f.key)) === v);
    }
    if (sort) {
      r = [...r].sort((a, b) => {
        const av = get(a, sort.key), bv = get(b, sort.key);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return cmp * sort.dir;
      });
    }
    return r;
  }, [rows, q, sort, filterVals, filters, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  function toggleSort(col) {
    if (col.sortable === false) return;
    const key = col.sortKey || col.key;
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  }

  function exportRows() {
    return filtered.map((row) => {
      const out = {};
      for (const c of columns) {
        if (c.export === false) continue;
        out[c.label] = c.exportValue ? c.exportValue(row) : get(row, c.key);
      }
      return out;
    });
  }

  function exportCSV() {
    const data = exportRows();
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [keys.map(esc).join(","), ...data.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function exportXLSX() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${exportName || "export"}.xlsx`);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            className="input w-auto"
            value={filterVals[f.key] || ""}
            onChange={(e) => { setFilterVals((v) => ({ ...v, [f.key]: e.target.value })); setPage(1); }}
          >
            <option value="">{f.label}: All</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {exportName && (
            <>
              <button onClick={exportCSV} className="btn-ghost !px-3 !py-1.5 text-xs" title="Export CSV">
                <FileDown size={14} /> CSV
              </button>
              <button onClick={exportXLSX} className="btn-ghost !px-3 !py-1.5 text-xs" title="Export Excel">
                <FileSpreadsheet size={14} /> Excel
              </button>
            </>
          )}
          {toolbar}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`th ${c.sortable === false ? "" : "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"}`} onClick={() => toggleSort(c)}>
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sort?.key === (c.sortKey || c.key) && (sort.dir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && <SkeletonRows cols={columns.length} rows={6} />}
            {!loading && slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="td !whitespace-normal text-center text-slate-400">
                  {rows.length === 0 && empty ? empty : <span className="block py-10">{emptyText}</span>}
                </td>
              </tr>
            )}
            {!loading && slice.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`${onRowClick ? "cursor-pointer" : ""} transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${rowClass ? rowClass(row) : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`td ${c.className || ""}`}>
                    {c.render ? c.render(row) : (get(row, c.key) ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
        <span>
          {filtered.length === 0 ? "0" : `${(cur - 1) * pageSize + 1}–${Math.min(cur * pageSize, filtered.length)}`} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-1.5" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={15} /></button>
          <span className="px-2 text-xs font-medium">Page {cur} / {pages}</span>
          <button className="btn-ghost !p-1.5" disabled={cur >= pages} onClick={() => setPage(cur + 1)}><ChevronRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}
