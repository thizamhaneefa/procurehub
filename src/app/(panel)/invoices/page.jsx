"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Paperclip, Clock, AlertCircle, CheckCircle2, UploadCloud, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ImportModal from "@/components/ImportModal";
import { useConfirm } from "@/components/PanelShell";
import { IMPORT_CONFIGS } from "@/lib/importConfigs";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/format";

const STATUSES = ["Pending", "Approved", "Paid", "Overdue"];
const EMPTY = { invoiceNo: "", supplierId: "", poId: "", invoiceDate: "", dueDate: "", amount: "", currency: "AED", status: "Pending", fileUrl: "" };

export default function InvoicesPage() {
  const [data, setData] = useState({ invoices: [], summary: { totalPending: 0, totalOverdue: 0, paidThisMonth: 0 } });
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const confirm = useConfirm();

  const load = () => fetch("/api/invoices").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/purchase-orders").then((r) => r.json()).then(setPos);
  }, []);

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setModal((m) => ({ ...m, form: { ...m.form, fileUrl: url } }));
      toast.success("File attached");
    } else toast.error("Upload failed");
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/invoices" : `/api/invoices/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Invoice saved"); setModal(null); load(); }
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to save invoice");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete invoice ${row.invoiceNo}?`,
      message: "The invoice record will be permanently removed.",
    });
    if (!ok) return;
    await fetch(`/api/invoices/${row.id}`, { method: "DELETE" });
    toast.success("Invoice deleted");
    load();
  }

  async function setStatus(row, status) {
    await fetch(`/api/invoices/${row.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`${row.invoiceNo} → ${status}`);
    load();
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target.value } }));

  const columns = [
    { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-semibold">{r.invoiceNo}</span> },
    { key: "supplier.name", label: "Supplier" },
    { key: "po.poNumber", label: "PO", render: (r) => r.po?.poNumber || "—" },
    { key: "invoiceDate", label: "Invoice Date", render: (r) => fmtDate(r.invoiceDate), exportValue: (r) => fmtDate(r.invoiceDate) },
    { key: "dueDate", label: "Due Date", render: (r) => fmtDate(r.dueDate), exportValue: (r) => fmtDate(r.dueDate) },
    { key: "amount", label: "Amount", render: (r) => <span className="font-semibold">{fmtMoney(r.amount, r.currency)}</span> },
    {
      key: "status", label: "Status",
      render: (r) => (
        <span className="relative inline-flex cursor-pointer items-center gap-0.5" title="Click to change status" onClick={(e) => e.stopPropagation()}>
          <Badge status={r.status} />
          <ChevronDown size={12} className="text-slate-400" />
          <select
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={r.status}
            onChange={(e) => setStatus(r, e.target.value)}
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </span>
      ),
    },
    {
      key: "fileUrl", label: "File", sortable: false, export: false,
      render: (r) => r.fileUrl ? <a href={r.fileUrl} target="_blank" className="text-rose-600 hover:underline dark:text-rose-400"><Paperclip size={14} /></a> : <span className="text-slate-300 dark:text-slate-600">—</span>,
    },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => setModal({ mode: "edit", form: { ...r, poId: r.poId || "", invoiceDate: toInputDate(r.invoiceDate), dueDate: toInputDate(r.dueDate), fileUrl: r.fileUrl || "" } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Vendor Invoices"]]}
        title="Vendor Invoices"
        subtitle={`${data.invoices.length} invoices — overdue is flagged automatically`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import Excel</button>
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, invoiceDate: toInputDate(new Date()) } })}>
              <Plus size={16} /> Add Invoice
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Clock} label="Total Pending" value={fmtMoney(data.summary.totalPending)} color="amber" />
        <KpiCard icon={AlertCircle} label="Total Overdue" value={fmtMoney(data.summary.totalOverdue)} color="red" />
        <KpiCard icon={CheckCircle2} label="Paid This Month" value={fmtMoney(data.summary.paidThisMonth)} color="green" />
      </div>

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No invoices recorded" description="Record vendor invoices manually or import them from Excel.">
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, invoiceDate: toInputDate(new Date()) } })}><Plus size={15} /> Add Invoice</button>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import from Excel</button>
          </EmptyState>
        }
        columns={columns}
        rows={data.invoices}
        searchKeys={["invoiceNo", "supplier.name", "po.poNumber"]}
        filters={[
          { key: "status", label: "Status", options: STATUSES },
          { key: "supplier.name", label: "Supplier", options: [...new Set(data.invoices.map((i) => i.supplier?.name).filter(Boolean))].sort() },
        ]}
        exportName="vendor-invoices"
        rowClass={(r) => (r.status === "Overdue" ? "bg-rose-50/60 dark:bg-rose-500/5" : "")}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        {...IMPORT_CONFIGS.invoices}
        onDone={load}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Vendor Invoice" : "Edit Invoice"} wide>
        {modal && suppliers.length === 0 && (
          <div className="space-y-4">
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              You need at least one supplier before recording an invoice — every invoice is linked to a supplier.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <Link href="/suppliers" className="btn-primary">Go to Suppliers</Link>
            </div>
          </div>
        )}
        {modal && suppliers.length > 0 && (
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Invoice No *</label><input className="input" required value={modal.form.invoiceNo} onChange={setF("invoiceNo")} placeholder="INV-2026-0021" /></div>
            <div>
              <label className="label">Supplier *</label>
              <select className="input" required value={modal.form.supplierId} onChange={setF("supplierId")}>
                <option value="">Select…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Linked PO</label>
              <select className="input" value={modal.form.poId} onChange={setF("poId")}>
                <option value="">— None —</option>
                {pos.filter((p) => !modal.form.supplierId || String(p.supplierId) === String(modal.form.supplierId)).map((p) => (
                  <option key={p.id} value={p.id}>{p.poNumber} — {fmtMoney(p.total)}</option>
                ))}
              </select>
            </div>
            <div><label className="label">Amount *</label><input type="number" step="0.01" min="0" required className="input" value={modal.form.amount} onChange={setF("amount")} /></div>
            <div><label className="label">Invoice Date *</label><input type="date" required className="input" value={modal.form.invoiceDate} onChange={setF("invoiceDate")} /></div>
            <div><label className="label">Due Date *</label><input type="date" required className="input" value={modal.form.dueDate} onChange={setF("dueDate")} /></div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={modal.form.currency} onChange={setF("currency")}>
                {["AED", "USD", "EUR", "CNY", "INR"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={modal.form.status} onChange={setF("status")}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Invoice File (PDF / image)</label>
              <div className="flex items-center gap-3">
                <input type="file" accept=".pdf,image/*" onChange={uploadFile} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-600 dark:file:bg-rose-500/15" />
                {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
                {modal.form.fileUrl && <a href={modal.form.fileUrl} target="_blank" className="text-xs text-rose-600 hover:underline">View attached</a>}
              </div>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Invoice"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
