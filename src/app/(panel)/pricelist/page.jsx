"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import BrandPricelistModal from "@/components/BrandPricelistModal";
import { useConfirm } from "@/components/PanelShell";
import { fmtDate } from "@/lib/format";

export default function PricelistPage() {
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', form}
  const [saving, setSaving] = useState(false);
  const [pricelistFor, setPricelistFor] = useState(null);

  const load = () => fetch("/api/brands").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/brands" : `/api/brands/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(mode === "add" ? "Brand added" : "Brand updated");
      setModal(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to save brand");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete "${row.name}"?`,
      message: "This brand and all of its uploaded pricelists will be permanently removed.",
    });
    if (!ok) return;
    const res = await fetch(`/api/brands/${row.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Brand deleted"); load(); }
    else toast.error("Delete failed");
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target?.value ?? e } }));

  const columns = [
    { key: "name", label: "Brand", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
    { key: "createdAt", label: "Added", render: (r) => fmtDate(r.createdAt) },
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
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost !p-1.5" title="Rename" onClick={() => setModal({ mode: "edit", form: { ...r } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" title="Delete" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Pricelist"]]}
        title="Pricelist"
        subtitle={`${rows.length} brand${rows.length === 1 ? "" : "s"} — upload and manage Excel pricelists per brand`}
        actions={
          <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { name: "" } })}>
            <Plus size={16} /> Add Brand
          </button>
        }
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No brands yet" description="Add a brand, then upload its Excel pricelist.">
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { name: "" } })}><Plus size={15} /> Add Brand</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["name"]}
        exportName="brands"
        onRowClick={(r) => setPricelistFor(r)}
      />

      <BrandPricelistModal brand={pricelistFor} onClose={() => { setPricelistFor(null); load(); }} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Brand" : "Rename Brand"}>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Brand Name *</label>
              <input className="input" required autoFocus value={modal.form.name} onChange={setF("name")} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Brand"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
