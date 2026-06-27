"use client";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2, ExternalLink, LayoutGrid, List, FileText, FileSpreadsheet, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import { useConfirm } from "./PanelShell";
import { fmtDate } from "@/lib/format";

function fileIcon(name = "", size = 26) {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return <FileText size={size} className="text-rose-500" />;
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv")) return <FileSpreadsheet size={size} className="text-emerald-500" />;
  return <FileQuestion size={size} className="text-slate-400" />;
}

export default function PricelistModal({ supplier, onClose }) {
  const confirm = useConfirm();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState("grid");
  const inputRef = useRef(null);
  const open = !!supplier;

  const load = () => {
    if (!supplier) return;
    setLoading(true);
    fetch(`/api/suppliers/${supplier.id}/pricelists`).then((r) => r.json()).then(setFiles).finally(() => setLoading(false));
  };
  useEffect(() => { if (supplier) { setView("grid"); load(); } /* eslint-disable-next-line */ }, [supplier?.id]);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error((await up.json().catch(() => ({}))).error || "Upload failed");
      const { url } = await up.json();
      const res = await fetch(`/api/suppliers/${supplier.id}/pricelists`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url, fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) throw new Error("Could not save file");
      toast.success("Pricelist uploaded");
      load();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(f) {
    const ok = await confirm({ title: "Delete this pricelist?", message: `"${f.fileName}" will be permanently removed.` });
    if (!ok) return;
    await fetch(`/api/suppliers/${supplier.id}/pricelists/${f.id}`, { method: "DELETE" });
    toast.success("Pricelist deleted");
    load();
  }

  const fname = (f) => decodeURIComponent(f.fileName);

  return (
    <Modal open={open} onClose={onClose} xl title={supplier ? `Pricelists — ${supplier.name}` : "Pricelists"}>
      {supplier && (
        <div className="space-y-4">
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{files.length} file{files.length === 1 ? "" : "s"} · Excel or PDF</p>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-rose-200 p-0.5 dark:border-pink-950/70">
                <button onClick={() => setView("grid")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "grid" ? "bg-pink-500 text-white" : "text-slate-500"}`}><LayoutGrid size={14} /> Grid</button>
                <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${view === "list" ? "bg-pink-500 text-white" : "text-slate-500"}`}><List size={14} /> List</button>
              </div>
              <button className="btn-primary !py-1.5" onClick={() => inputRef.current?.click()} disabled={uploading}>
                <UploadCloud size={15} /> {uploading ? "Uploading…" : "Upload Pricelist"}
              </button>
              <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={upload} />
            </div>
          </div>

          {/* body — sized to show ~10 files, scrolls beyond */}
          <div className="max-h-[60vh] min-h-[280px] overflow-y-auto rounded-xl border border-rose-100 bg-rose-50/40 p-3 dark:border-pink-950/50 dark:bg-[#1f0c16]/40">
            {loading ? (
              <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UploadCloud size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No pricelists yet</p>
                <p className="text-xs text-slate-400">Click “Upload Pricelist” to add an Excel or PDF file.</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {files.map((f) => (
                  <div key={f.id} className="group relative flex flex-col items-center rounded-xl border border-rose-100 bg-white p-3 text-center shadow-sm dark:border-pink-950/60 dark:bg-[#241019]">
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center" title="Open">
                      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg bg-rose-50 dark:bg-pink-950/40">{fileIcon(f.fileName, 28)}</div>
                      <p className="line-clamp-2 break-all text-xs font-medium text-slate-700 dark:text-slate-200">{fname(f)}</p>
                    </a>
                    <p className="mt-1 text-[10px] text-slate-400">{fmtDate(f.createdAt)}</p>
                    <div className="mt-2 flex w-full items-center justify-center gap-1 border-t border-rose-100 pt-2 dark:border-pink-950/50">
                      <a href={f.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5 text-xs" title="View"><ExternalLink size={13} /></a>
                      <button onClick={() => remove(f)} className="btn-ghost !p-1.5 !text-rose-500" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-rose-100 overflow-hidden rounded-lg border border-rose-100 bg-white dark:divide-pink-950/50 dark:border-pink-950/60 dark:bg-[#241019]">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                    {fileIcon(f.fileName, 22)}
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 hover:underline dark:text-slate-200" title={fname(f)}>{fname(f)}</a>
                    <span className="shrink-0 text-xs text-slate-400">{fmtDate(f.createdAt)}</span>
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5 text-xs" title="View"><ExternalLink size={14} /></a>
                    <button onClick={() => remove(f)} className="btn-ghost !p-1.5 !text-rose-500" title="Delete"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
