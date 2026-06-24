"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ImportModal from "@/components/ImportModal";
import { useConfirm } from "@/components/PanelShell";
import { IMPORT_CONFIGS } from "@/lib/importConfigs";
import { fmtMoney } from "@/lib/format";

const EMPTY = { sku: "", name: "", category: "", unit: "Pcs", supplierId: "", unitCost: "", lastPurchasePrice: "", stockQty: 0, reorderLevel: 10, status: "Active" };

export default function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const confirm = useConfirm();

  const load = () => fetch("/api/products").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then(setCats);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, []);

  const low = rows.filter((r) => r.stockQty <= r.reorderLevel);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/products" : `/api/products/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Product saved"); setModal(null); load(); }
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to save product");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete "${row.name}"?`,
      message: "The product and its full stock movement history will be permanently removed.",
    });
    if (!ok) return;
    await fetch(`/api/products/${row.id}`, { method: "DELETE" });
    toast.success("Product deleted");
    load();
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target.value } }));

  const columns = [
    { key: "sku", label: "SKU", render: (r) => <span className="font-mono text-xs font-semibold">{r.sku}</span> },
    { key: "name", label: "Product", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
    { key: "category", label: "Category" },
    { key: "unit", label: "Unit" },
    { key: "supplier.name", label: "Supplier", render: (r) => r.supplier?.name || "—" },
    { key: "unitCost", label: "Unit Cost", render: (r) => fmtMoney(r.unitCost) },
    { key: "lastPurchasePrice", label: "Last Price", render: (r) => fmtMoney(r.lastPurchasePrice) },
    {
      key: "stockQty", label: "Stock",
      render: (r) => (
        <span className={`inline-flex items-center gap-1.5 font-semibold ${r.stockQty <= r.reorderLevel ? "text-rose-600 dark:text-rose-400" : ""}`}>
          {r.stockQty <= r.reorderLevel && <AlertTriangle size={13} />}
          {r.stockQty}
        </span>
      ),
    },
    { key: "reorderLevel", label: "Reorder At" },
    { key: "status", label: "Status", render: (r) => <Badge status={r.stockQty <= r.reorderLevel ? "Low Stock" : r.status} /> },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => setModal({ mode: "edit", form: { ...r, supplierId: r.supplierId || "" } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Products Sourced"]]}
        title="Products Sourced"
        subtitle={`${rows.length} products — ${low.length} at or below reorder level`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import Excel</button>
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, category: cats[0]?.name || "" } })}>
              <Plus size={16} /> Add Product
            </button>
          </>
        }
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No products yet" description="Add products manually or import your product list from Excel — opening stock is created automatically.">
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY, category: cats[0]?.name || "" } })}><Plus size={15} /> Add Product</button>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import from Excel</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["sku", "name", "category", "supplier.name"]}
        filters={[
          { key: "category", label: "Category", options: [...new Set(rows.map((r) => r.category))].sort() },
          { key: "status", label: "Status", options: ["Active", "Inactive"] },
        ]}
        exportName="products"
        rowClass={(r) => (r.stockQty <= r.reorderLevel ? "bg-rose-50/80 dark:bg-rose-500/10" : "")}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        {...IMPORT_CONFIGS.products}
        onDone={load}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Product" : "Edit Product"} wide>
        {modal && (
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">SKU *</label><input className="input" required value={modal.form.sku} onChange={setF("sku")} placeholder="ELC-009" /></div>
            <div><label className="label">Product Name *</label><input className="input" required value={modal.form.name} onChange={setF("name")} /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={modal.form.category} onChange={setF("category")}>
                {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={modal.form.unit} onChange={setF("unit")}>
                {["Pcs", "Roll", "Box", "Pack", "Bag", "Drum", "Carton", "Sheet", "Length", "Set", "Pair", "Kit", "Bundle", "Kg", "Litre"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Supplier</label>
              <select className="input" value={modal.form.supplierId} onChange={setF("supplierId")}>
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Unit Cost (AED)</label><input type="number" step="0.01" className="input" value={modal.form.unitCost} onChange={setF("unitCost")} /></div>
            <div><label className="label">Last Purchase Price (AED)</label><input type="number" step="0.01" className="input" value={modal.form.lastPurchasePrice} onChange={setF("lastPurchasePrice")} /></div>
            {modal.mode === "add" && (
              <div><label className="label">Opening Stock</label><input type="number" className="input" value={modal.form.stockQty} onChange={setF("stockQty")} /></div>
            )}
            <div><label className="label">Reorder Level</label><input type="number" className="input" value={modal.form.reorderLevel} onChange={setF("reorderLevel")} /></div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={modal.form.status} onChange={setF("status")}><option>Active</option><option>Inactive</option></select>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Product"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
