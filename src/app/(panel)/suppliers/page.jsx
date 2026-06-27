"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UploadCloud, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import Stars from "@/components/Stars";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ImportModal from "@/components/ImportModal";
import PricelistModal from "@/components/PricelistModal";
import { useConfirm } from "@/components/PanelShell";
import { IMPORT_CONFIGS } from "@/lib/importConfigs";

const EMPTY = { name: "", contactPerson: "", email: "", phone: "", country: "UAE", city: "", category: "", paymentTerms: "Net 30", status: "Active", rating: 3 };

export default function SuppliersPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', form}
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [pricelistFor, setPricelistFor] = useState(null);

  const load = () => fetch("/api/suppliers").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then(setCats);
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/suppliers" : `/api/suppliers/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(mode === "add" ? "Supplier added" : "Supplier updated");
      setModal(null);
      load();
    } else toast.error("Failed to save supplier");
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete "${row.name}"?`,
      message: "This supplier and all of their purchase orders and invoices will be permanently removed.",
    });
    if (!ok) return;
    const res = await fetch(`/api/suppliers/${row.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Supplier deleted"); load(); }
    else toast.error("Delete failed");
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target?.value ?? e } }));

  const columns = [
    { key: "name", label: "Supplier", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
    { key: "contactPerson", label: "Contact" },
    { key: "email", label: "Email", render: (r) => <span className="text-slate-500">{r.email}</span> },
    { key: "phone", label: "Phone" },
    { key: "country", label: "Country / City", render: (r) => `${r.country} — ${r.city}` },
    { key: "category", label: "Category" },
    {
      key: "_pricelist", label: "Pricelist", sortable: false, export: false,
      render: (r) => {
        const n = r._count?.pricelists ?? 0;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setPricelistFor(r); }}
            title="View / upload pricelists"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-pink-950/60 dark:bg-[#241019] dark:text-pink-300 dark:hover:bg-[#311521]"
          >
            <FileSpreadsheet size={13} />
            {n > 0 ? `${n} file${n === 1 ? "" : "s"}` : "Add"}
          </button>
        );
      },
    },
    { key: "rating", label: "Rating", render: (r) => <Stars value={r.rating} /> },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost !p-1.5" title="Edit" onClick={() => setModal({ mode: "edit", form: { ...r } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" title="Delete" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Suppliers"]]}
        title="Suppliers"
        subtitle={`${rows.length} suppliers — click a row to view details`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import Excel</button>
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, category: cats[0]?.name || "" } })}>
              <Plus size={16} /> Add Supplier
            </button>
          </>
        }
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No suppliers yet" description="Add your first supplier manually or import a list from Excel.">
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, category: cats[0]?.name || "" } })}><Plus size={15} /> Add Supplier</button>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import from Excel</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["name", "contactPerson", "email", "category", "country", "city"]}
        filters={[
          { key: "category", label: "Category", options: [...new Set(rows.map((r) => r.category))].sort() },
          { key: "status", label: "Status", options: ["Active", "Inactive"] },
          { key: "country", label: "Country", options: [...new Set(rows.map((r) => r.country))].sort() },
        ]}
        exportName="suppliers"
        onRowClick={(r) => router.push(`/suppliers/${r.id}`)}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        {...IMPORT_CONFIGS.suppliers}
        onDone={load}
      />

      <PricelistModal supplier={pricelistFor} onClose={() => { setPricelistFor(null); load(); }} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Supplier" : "Edit Supplier"} wide>
        {modal && (
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" required value={modal.form.name} onChange={setF("name")} />
            </div>
            <div><label className="label">Contact Person</label><input className="input" value={modal.form.contactPerson} onChange={setF("contactPerson")} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={modal.form.email} onChange={setF("email")} /></div>
            <div><label className="label">Phone</label><input className="input" value={modal.form.phone} onChange={setF("phone")} /></div>
            <div>
              <label className="label">Country</label>
              <input className="input" list="countries" value={modal.form.country} onChange={setF("country")} />
              <datalist id="countries">{["UAE", "China", "India", "Germany", "Saudi Arabia", "Turkey", "USA"].map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div><label className="label">City</label><input className="input" value={modal.form.city} onChange={setF("city")} /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={modal.form.category} onChange={setF("category")}>
                {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={modal.form.paymentTerms} onChange={setF("paymentTerms")}>
                {["Net 15", "Net 30", "Net 45", "Net 60", "LC at Sight", "T/T 30 Days", "30% Advance, 70% B/L", "Cash on Delivery"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={modal.form.status} onChange={setF("status")}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="pt-2"><Stars value={Number(modal.form.rating)} onChange={(v) => setModal((m) => ({ ...m, form: { ...m.form, rating: v } }))} /></div>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Supplier"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
