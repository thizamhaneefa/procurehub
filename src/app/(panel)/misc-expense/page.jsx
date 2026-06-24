"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Paperclip, UploadCloud, X, ExternalLink, Wallet, CalendarDays, Receipt } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useConfirm } from "@/components/PanelShell";
import { fmtMoney, fmtMoneyShort, fmtDate, toInputDate } from "@/lib/format";

const CATEGORIES = ["Office Supplies", "Printing & Stationery", "Cleaning & Hygiene", "Pantry", "Maintenance", "Other"];
const CAT_COLOR = { "Office Supplies": "blue", "Printing & Stationery": "violet", "Cleaning & Hygiene": "cyan", Pantry: "amber", Maintenance: "gray", Other: "gray" };
const EMPTY = { description: "", category: "Office Supplies", vendor: "", amount: "", purchaseDate: toInputDate(new Date()), billUrl: null, notes: "" };

function BillField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) { const { url } = await res.json(); onChange(url); toast.success("Bill attached"); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Upload failed"); }
  }
  return value ? (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <Paperclip size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      <a href={value} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        {decodeURIComponent(value.split("/").pop().replace(/^\d+-/, ""))}
      </a>
      <a href={value} target="_blank" rel="noreferrer" className="shrink-0 text-slate-400 hover:text-rose-500" title="Open"><ExternalLink size={14} /></a>
      <button type="button" className="shrink-0 text-slate-400 hover:text-rose-500" title="Remove" onClick={() => onChange(null)}><X size={14} /></button>
    </div>
  ) : (
    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-200 px-3 py-2.5 text-sm text-slate-400 transition hover:border-pink-400 hover:text-pink-500 dark:border-pink-950/70 ${busy ? "pointer-events-none opacity-60" : ""}`}>
      <UploadCloud size={15} /> {busy ? "Uploading…" : "Upload bill (PDF / image)"}
      <input type="file" accept=".pdf,image/*" className="hidden" onChange={upload} />
    </label>
  );
}

export default function MiscExpensePage() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const load = () => fetch("/api/misc-expenses").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yStart = new Date(now.getFullYear(), 0, 1);
    let month = 0, year = 0, all = 0;
    for (const r of rows) {
      all += r.amount;
      const d = new Date(r.purchaseDate);
      if (d >= yStart) year += r.amount;
      if (d >= mStart) month += r.amount;
    }
    return { month, year, all, count: rows.length };
  }, [rows]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/misc-expenses" : `/api/misc-expenses/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success(mode === "add" ? "Expense added" : "Expense updated"); setModal(null); load(); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Failed to save expense"); }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete "${row.description}"?`,
      message: "This expense entry and its attached bill link will be permanently removed.",
    });
    if (!ok) return;
    await fetch(`/api/misc-expenses/${row.id}`, { method: "DELETE" });
    toast.success("Expense deleted");
    load();
  }

  const openAdd = () => setModal({ mode: "add", form: { ...EMPTY } });
  const openEdit = (r) => setModal({ mode: "edit", form: { ...r, vendor: r.vendor || "", notes: r.notes || "", purchaseDate: toInputDate(r.purchaseDate) } });
  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target.value } }));

  const columns = [
    { key: "purchaseDate", label: "Purchase Date", render: (r) => fmtDate(r.purchaseDate), exportValue: (r) => fmtDate(r.purchaseDate) },
    { key: "description", label: "Description", className: "max-w-[280px] !whitespace-normal", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.description}</span> },
    { key: "category", label: "Category", render: (r) => <Badge status={r.category} color={CAT_COLOR[r.category]} /> },
    { key: "vendor", label: "Vendor / Shop", render: (r) => r.vendor || "—" },
    { key: "amount", label: "Amount", render: (r) => <span className="font-semibold">{fmtMoney(r.amount)}</span> },
    {
      key: "billUrl", label: "Bill", sortable: false, export: false,
      render: (r) => r.billUrl
        ? <a href={r.billUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"><Paperclip size={11} /> View</a>
        : <Badge status="No bill" color="amber" />,
      exportValue: (r) => (r.billUrl ? `${window.location.origin}${r.billUrl}` : "No bill"),
    },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Edit" onClick={() => openEdit(r)}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" title="Delete" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  const missingBills = rows.filter((r) => !r.billUrl).length;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Misc Expense"]]}
        title="Misc Expense"
        subtitle={`Office supplies, cleaning & pantry purchases — ${rows.length} entries${missingBills ? `, ${missingBills} without a bill` : ""}`}
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Expense</button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Spent This Month" value={fmtMoneyShort(totals.month)} color="indigo" />
        <KpiCard icon={CalendarDays} label="Spent This Year" value={fmtMoneyShort(totals.year)} color="blue" />
        <KpiCard icon={Receipt} label="Total Recorded" value={fmtMoneyShort(totals.all)} color="green" />
        <KpiCard icon={Paperclip} label="Entries" value={totals.count} sub={missingBills ? `${missingBills} missing a bill` : "all have bills"} color={missingBills ? "amber" : "green"} />
      </div>

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No expenses recorded yet" description="Log office-supply purchases here — papers, hand wash, tissues, cleaning cloths — with the bill, amount and purchase date.">
            <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Expense</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["description", "category", "vendor"]}
        filters={[{ key: "category", label: "Category", options: CATEGORIES }]}
        pageSize={15}
        exportName="misc-expenses"
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Misc Expense" : "Edit Expense"} wide>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Description *</label>
              <input className="input" required autoFocus value={modal.form.description} onChange={setF("description")} placeholder="e.g. A4 paper (5 reams), hand wash x2, tissue boxes" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={modal.form.category} onChange={setF("category")}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount (AED)</label>
                <input type="number" step="0.01" min="0" className="input" value={modal.form.amount} onChange={setF("amount")} />
              </div>
              <div>
                <label className="label">Purchase Date *</label>
                <input type="date" required className="input" value={modal.form.purchaseDate} onChange={setF("purchaseDate")} />
              </div>
            </div>
            <div>
              <label className="label">Vendor / Shop (optional)</label>
              <input className="input" value={modal.form.vendor} onChange={setF("vendor")} placeholder="e.g. Carrefour, Office World" />
            </div>
            <div>
              <label className="label">Bill / Receipt</label>
              <BillField value={modal.form.billUrl} onChange={(url) => setModal((m) => ({ ...m, form: { ...m.form, billUrl: url } }))} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input" rows={2} value={modal.form.notes} onChange={setF("notes")} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Expense"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
