"use client";
import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Table2, Kanban, ChevronDown, ChevronLeft, ChevronRight,
  ImagePlus, X, CalendarClock, Clock,
} from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useConfirm } from "@/components/PanelShell";
import { fmtDate, toInputDate, timeAgo } from "@/lib/format";
import { uploadFileDirect } from "@/lib/uploadClient";

const STATUSES = ["Pending", "In Progress", "Completed"];
const STATUS_COLOR = { Pending: "amber", "In Progress": "blue", Completed: "green" };
const COLUMN_BAR = { Pending: "bg-amber-400", "In Progress": "bg-blue-500", Completed: "bg-emerald-500" };
const EMPTY = { title: "", content: "", imageUrl: null, status: "Pending", dueDate: "" };
const KANBAN_PAGE = 10;

const isOverdue = (n) => n.dueDate && n.status !== "Completed" && new Date(n.dueDate) < new Date();

export default function WorkNotesPage() {
  const [notes, setNotes] = useState([]);
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const load = () => fetch("/api/work-notes").then((r) => r.json()).then(setNotes).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);
    const namedFile = file.name ? file : new File([file], "pasted-screenshot.png", { type: file.type || "image/png" });
    try {
      const url = await uploadFileDirect(namedFile);
      setModal((m) => (m ? { ...m, form: { ...m.form, imageUrl: url } } : m));
      toast.success("Image attached");
    } catch (err) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Paste a screenshot anywhere while the dialog is open
  useEffect(() => {
    if (!modal) return;
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      uploadImage(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [modal]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/work-notes" : `/api/work-notes/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Note saved"); setModal(null); load(); }
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to save note");
    }
  }

  async function remove(note) {
    const ok = await confirm({
      title: `Delete "${note.title}"?`,
      message: "The note and its attached image reference will be permanently removed.",
    });
    if (!ok) return;
    await fetch(`/api/work-notes/${note.id}`, { method: "DELETE" });
    toast.success("Note deleted");
    load();
  }

  async function setStatus(note, status) {
    await fetch(`/api/work-notes/${note.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`"${note.title}" → ${status}`);
    load();
  }

  const openAdd = () => setModal({ mode: "add", form: { ...EMPTY } });
  const openEdit = (n) => setModal({ mode: "edit", form: { ...n, content: n.content || "", dueDate: toInputDate(n.dueDate) } });
  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target.value } }));

  // kanban pagination: 10 newest notes per page, then grouped into columns
  const pages = Math.max(1, Math.ceil(notes.length / KANBAN_PAGE));
  const cur = Math.min(page, pages);
  const pageNotes = notes.slice((cur - 1) * KANBAN_PAGE, cur * KANBAN_PAGE);

  const statusPicker = (n) => (
    <span className="relative inline-flex cursor-pointer items-center gap-0.5" title="Click to change status" onClick={(e) => e.stopPropagation()}>
      <Badge status={n.status} color={STATUS_COLOR[n.status]} />
      <ChevronDown size={12} className="text-slate-400" />
      <select className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={n.status} onChange={(e) => setStatus(n, e.target.value)}>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </span>
  );

  const listColumns = [
    { key: "title", label: "Note", className: "max-w-[260px] !whitespace-normal", render: (n) => <span className="font-medium text-slate-900 dark:text-white">{n.title}</span> },
    { key: "content", label: "Details", className: "max-w-[300px] !whitespace-normal", render: (n) => <span className="line-clamp-2 text-slate-500">{n.content || "—"}</span> },
    {
      key: "imageUrl", label: "Image", sortable: false, export: false,
      render: (n) => n.imageUrl ? (
        <a href={n.imageUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.imageUrl} alt="" className="h-10 w-14 rounded-md border border-slate-200 object-cover dark:border-slate-700" />
        </a>
      ) : <span className="text-slate-300 dark:text-slate-600">—</span>,
    },
    { key: "status", label: "Status", render: statusPicker },
    { key: "createdAt", label: "Date Added", render: (n) => fmtDate(n.createdAt), exportValue: (n) => fmtDate(n.createdAt) },
    {
      key: "dueDate", label: "Due Date",
      render: (n) => n.dueDate ? (
        <span className={isOverdue(n) ? "font-semibold text-rose-600 dark:text-rose-400" : ""}>{fmtDate(n.dueDate)}</span>
      ) : "—",
      exportValue: (n) => fmtDate(n.dueDate),
    },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (n) => (
        <span className="flex gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => openEdit(n)}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" onClick={() => remove(n)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Work Notes - Thizam"]]}
        title="Work Notes - Thizam"
        subtitle={`${notes.length} notes — ${notes.filter((n) => n.status !== "Completed").length} open, ${notes.filter(isOverdue).length} overdue`}
        actions={
          <>
            <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
              <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-rose-600 text-white" : "text-slate-500"}`}><Kanban size={14} /> Kanban</button>
              <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-rose-600 text-white" : "text-slate-500"}`}><Table2 size={14} /> List</button>
            </div>
            <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Note</button>
          </>
        }
      />

      {view === "kanban" ? (
        loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {STATUSES.map((s) => <div key={s} className="card h-48 animate-pulse" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="card">
            <EmptyState title="No work notes yet" description="Keep your important notes and reminders here — paste a screenshot straight into a note for reference.">
              <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Note</button>
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {STATUSES.map((status) => {
                const cards = pageNotes.filter((n) => n.status === status);
                return (
                  <div key={status} className="min-w-0">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_BAR[status]}`} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{status}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{cards.length}</span>
                    </div>
                    <div className="min-h-[140px] space-y-3 rounded-xl bg-slate-200/50 p-2 dark:bg-slate-900/60">
                      {cards.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No notes on this page</p>}
                      {cards.map((n) => (
                        <div key={n.id} className="card cursor-pointer p-3 transition hover:shadow-md" onClick={() => openEdit(n)}>
                          {n.imageUrl && (
                            <a href={n.imageUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={n.imageUrl} alt="" className="mb-2 h-28 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
                            </a>
                          )}
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          {n.content && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-500">{n.content}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(n.createdAt)}</span>
                            {n.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue(n) ? "font-semibold text-rose-500" : "text-amber-600 dark:text-amber-400"}`}>
                                <CalendarClock size={11} /> Due {fmtDate(n.dueDate)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                            {statusPicker(n)}
                            <span className="flex gap-0.5">
                              <button className="btn-ghost !p-1" onClick={() => openEdit(n)}><Pencil size={13} /></button>
                              <button className="btn-ghost !p-1 !text-rose-500" onClick={() => remove(n)}><Trash2 size={13} /></button>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{(cur - 1) * KANBAN_PAGE + 1}–{Math.min(cur * KANBAN_PAGE, notes.length)} of {notes.length} notes</span>
              <div className="flex items-center gap-1">
                <button className="btn-ghost !p-1.5" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={15} /></button>
                <span className="px-2 text-xs font-medium">Page {cur} / {pages}</span>
                <button className="btn-ghost !p-1.5" disabled={cur >= pages} onClick={() => setPage(cur + 1)}><ChevronRight size={15} /></button>
              </div>
            </div>
          </>
        )
      ) : (
        <DataTable
          loading={loading}
          empty={
            <EmptyState title="No work notes yet" description="Keep your important notes and reminders here — paste a screenshot straight into a note for reference.">
              <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Note</button>
            </EmptyState>
          }
          columns={listColumns}
          rows={notes}
          searchKeys={["title", "content", "status"]}
          filters={[{ key: "status", label: "Status", options: STATUSES }]}
          pageSize={20}
          exportName="work-notes"
        />
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Work Note" : "Edit Work Note"} wide>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" required autoFocus value={modal.form.title} onChange={setF("title")} placeholder="e.g. Follow up LC documents with bank" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={4} value={modal.form.content} onChange={setF("content")} placeholder="Details, reminders, links…" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Status</label>
                <select className="input" value={modal.form.status} onChange={setF("status")}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date (optional)</label>
                <input type="date" className="input" value={modal.form.dueDate} onChange={setF("dueDate")} />
              </div>
            </div>
            <div>
              <label className="label">Reference Image / Screenshot</label>
              {modal.form.imageUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={modal.form.imageUrl} alt="attached" className="max-h-56 rounded-xl border border-slate-200 dark:border-slate-700" />
                  <button
                    type="button"
                    onClick={() => setModal((m) => ({ ...m, form: { ...m.form, imageUrl: null } }))}
                    className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white shadow hover:bg-rose-600"
                    title="Remove image"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 py-6 text-slate-400 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  <ImagePlus size={22} />
                  <span className="text-sm font-medium">{uploading ? "Uploading…" : "Click to upload — or just press Ctrl+V to paste a screenshot"}</span>
                  <span className="text-xs">PNG, JPG, or any image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving || uploading}>{saving ? "Saving…" : "Save Note"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
