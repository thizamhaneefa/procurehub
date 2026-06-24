"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText, UploadCloud, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useConfirm } from "@/components/PanelShell";
import { fmtDate, toInputDate } from "@/lib/format";

const EMPTY = { name: "", email: "", phone: "", address: "", emiratesId: "", agreementUrl: null, tradeLicenseUrl: null, vatRegUrl: null, licenseExpiry: "", notes: "" };

const DOCS = [
  { key: "agreementUrl", label: "Signed Agreement" },
  { key: "tradeLicenseUrl", label: "Trade License" },
  { key: "vatRegUrl", label: "VAT Registration" },
];

function DocLink({ url, label }) {
  if (!url) return <Badge status="Missing" color="red" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
      title={`View ${label}`}
    >
      <FileText size={11} /> View
    </a>
  );
}

function FileField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) {
      const { url } = await res.json();
      onChange(url);
      toast.success(`${label} uploaded`);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Upload failed");
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <FileText size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <a href={value} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            {decodeURIComponent(value.split("/").pop().replace(/^\d+-/, ""))}
          </a>
          <a href={value} target="_blank" rel="noreferrer" className="shrink-0 text-slate-400 hover:text-rose-500" title="Open"><ExternalLink size={14} /></a>
          <button type="button" className="shrink-0 text-slate-400 hover:text-rose-500" title="Remove" onClick={() => onChange(null)}><X size={14} /></button>
        </div>
      ) : (
        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-400 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <UploadCloud size={15} />
          {busy ? "Uploading…" : "Upload PDF / image"}
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={upload} />
        </label>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const load = () => fetch("/api/customers").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/customers" : `/api/customers/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(mode === "add" ? "Customer added" : "Customer updated");
      setModal(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to save customer");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete "${row.name}"?`,
      message: "The customer record and its document links will be permanently removed.",
    });
    if (!ok) return;
    const res = await fetch(`/api/customers/${row.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Customer deleted"); load(); }
    else toast.error("Delete failed");
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e?.target ? e.target.value : e } }));
  const docsComplete = (r) => DOCS.every((d) => r[d.key]);

  const columns = [
    { key: "name", label: "Customer", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
    { key: "email", label: "Email", render: (r) => <span className="text-slate-500">{r.email || "—"}</span> },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "address", label: "Address", className: "max-w-[220px] !whitespace-normal", render: (r) => <span className="text-slate-500">{r.address || "—"}</span> },
    { key: "emiratesId", label: "Emirates ID", render: (r) => <span className="font-mono text-xs">{r.emiratesId || "—"}</span> },
    ...DOCS.map((d) => ({
      key: d.key, label: d.label, sortable: false,
      render: (r) => <DocLink url={r[d.key]} label={d.label} />,
      exportValue: (r) => (r[d.key] ? `${window.location.origin}${r[d.key]}` : "Missing"),
    })),
    {
      key: "licenseExpiry", label: "License Expiry",
      render: (r) => {
        if (!r.tradeLicenseUrl) return <span className="text-slate-300 dark:text-slate-600">—</span>;
        if (!r.licenseExpiry) return <span className="text-xs text-slate-400" title="Could not read a date from the PDF — set it manually via Edit">Not detected</span>;
        const expired = new Date(r.licenseExpiry) < new Date();
        return (
          <span className="inline-flex flex-col leading-tight">
            <span className="font-medium">{fmtDate(r.licenseExpiry)}</span>
            <span className={`text-xs font-bold ${expired ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {expired ? "Expired" : "Valid"}
            </span>
          </span>
        );
      },
      exportValue: (r) => (r.licenseExpiry ? `${fmtDate(r.licenseExpiry)} (${new Date(r.licenseExpiry) < new Date() ? "Expired" : "Valid"})` : ""),
    },
    {
      key: "_docs", label: "Docs", sortable: false, export: false,
      render: (r) => <Badge status={docsComplete(r) ? "Complete" : "Incomplete"} color={docsComplete(r) ? "green" : "amber"} />,
    },
    { key: "createdAt", label: "Added", render: (r) => fmtDate(r.createdAt), exportValue: (r) => fmtDate(r.createdAt) },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Edit" onClick={() => setModal({ mode: "edit", form: { ...r, notes: r.notes || "", licenseExpiry: toInputDate(r.licenseExpiry) } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" title="Delete" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  const missingDocs = rows.filter((r) => !docsComplete(r)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Customer Agreements"]]}
        title="Customer Agreements"
        subtitle={`${rows.length} B2B customers — ${missingDocs} with missing documents`}
        actions={
          <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY } })}>
            <Plus size={16} /> Add Customer
          </button>
        }
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No customers yet" description="Keep signed agreements, trade licenses and VAT registrations of your B2B customers in one place.">
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY } })}><Plus size={15} /> Add Customer</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["name", "email", "phone", "address", "emiratesId"]}
        exportName="customer-agreements"
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Customer" : "Edit Customer"} wide>
        {modal && (
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Customer / Company Name *</label>
              <input className="input" required value={modal.form.name} onChange={setF("name")} />
            </div>
            <div><label className="label">Email</label><input type="email" className="input" value={modal.form.email} onChange={setF("email")} /></div>
            <div><label className="label">Phone</label><input className="input" value={modal.form.phone} onChange={setF("phone")} /></div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={modal.form.address} onChange={setF("address")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Emirates ID Number</label>
              <input className="input" placeholder="784-XXXX-XXXXXXX-X" value={modal.form.emiratesId} onChange={setF("emiratesId")} />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:grid-cols-3">
              {DOCS.map((d) => (
                <FileField
                  key={d.key}
                  label={d.label}
                  value={modal.form[d.key]}
                  onChange={(url) => setModal((m) => ({ ...m, form: { ...m.form, [d.key]: url, ...(d.key === "tradeLicenseUrl" ? { licenseExpiry: "" } : {}) } }))}
                />
              ))}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Trade License Expiry</label>
              <input type="date" className="input" value={modal.form.licenseExpiry} onChange={setF("licenseExpiry")} />
              <p className="mt-1 text-xs text-slate-400">Leave empty to read it automatically from the uploaded trade license PDF. Fill it in only if the date isn't detected (e.g. scanned image licenses).</p>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={modal.form.notes} onChange={setF("notes")} />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Customer"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
