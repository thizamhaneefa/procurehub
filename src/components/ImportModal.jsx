"use client";
import { useRef, useState } from "react";
import { FileSpreadsheet, Download, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Generic Excel/CSV import.
 * columns: [{ key, label, required?, hint? }]  — template headers use `label`
 * endpoint: POST { rows } -> { created, errors: [{ row, message }] }
 */
export default function ImportModal({ open, onClose, title, columns, sample, endpoint, onDone }) {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  function reset() {
    setRows(null); setFileName(""); setResult(null); setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([sample], { header: columns.map((c) => c.label) });
    ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.label.length + 4, 16) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, "-")}-template.xlsx`);
  }

  async function parseFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!raw.length) { toast.error("No data rows found in the file"); return; }
      // map incoming headers (by label or key, ignoring case/spacing) to our keys
      const headerMap = {};
      for (const h of Object.keys(raw[0])) {
        const col = columns.find((c) => norm(c.label) === norm(h) || norm(c.key) === norm(h));
        if (col) headerMap[h] = col.key;
      }
      const mapped = raw.map((r) => {
        const out = {};
        for (const [h, key] of Object.entries(headerMap)) {
          let v = r[h];
          if (v instanceof Date) v = v.toISOString().slice(0, 10);
          out[key] = typeof v === "string" ? v.trim() : v;
        }
        return out;
      }).filter((r) => Object.values(r).some((v) => v !== "" && v != null));
      const missing = columns.filter((c) => c.required && !Object.values(headerMap).includes(c.key));
      if (missing.length) {
        toast.error(`Missing required column(s): ${missing.map((c) => c.label).join(", ")}`);
        return;
      }
      setRows(mapped);
    } catch {
      toast.error("Could not read the file — use .xlsx, .xls or .csv");
    }
  }

  async function doImport() {
    setBusy(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Import failed");
      return;
    }
    const r = await res.json();
    setResult(r);
    if (r.created > 0) {
      toast.success(`Imported ${r.created} record${r.created === 1 ? "" : "s"}`);
      onDone?.();
    } else {
      toast.error("No records were imported — check the errors below");
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={title} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-emerald-500" />
            <div className="text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200">Step 1 — Get the template</p>
              <p className="text-xs text-slate-500">Fill it in Excel, then upload it below.</p>
            </div>
          </div>
          <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={downloadTemplate}>
            <Download size={13} /> Download Template
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Step 2 — Upload your file (.xlsx / .csv)</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-slate-400 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-700">
            <UploadCloud size={26} />
            <span className="text-sm">{fileName || "Click to choose a file"}</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={parseFile} />
          </label>
        </div>

        {rows && !result && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              Step 3 — Preview <span className="text-slate-400">({rows.length} row{rows.length === 1 ? "" : "s"} found)</span>
            </p>
            <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                  <tr>{columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-500">{c.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.slice(0, 8).map((r, i) => (
                    <tr key={i}>{columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-1.5">{String(r[c.key] ?? "")}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 8 && <p className="mt-1 text-xs text-slate-400">…and {rows.length - 8} more rows</p>}
          </div>
        )}

        {result && (
          <div className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} /> {result.created} imported
            </p>
            {result.errors?.length > 0 && (
              <div>
                <p className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={15} /> {result.errors.length} skipped
                </p>
                <ul className="mt-1 max-h-32 list-inside list-disc overflow-auto text-xs text-slate-500">
                  {result.errors.slice(0, 20).map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" className="btn-ghost" onClick={() => { reset(); onClose(); }}>{result ? "Close" : "Cancel"}</button>
          {!result && (
            <button type="button" className="btn-primary" disabled={!rows || busy} onClick={doImport}>
              {busy ? "Importing…" : `Import ${rows?.length || 0} Rows`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
