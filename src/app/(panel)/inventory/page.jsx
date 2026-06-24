"use client";
import { useEffect, useState } from "react";
import { Plus, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { fmtDate, toInputDate } from "@/lib/format";

export default function InventoryPage() {
  const [data, setData] = useState({ movements: [], lowStock: [] });
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/inventory").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Stock ${modal.type === "IN" ? "received" : "issued"}`);
      setModal(null);
      load();
      fetch("/api/products").then((r) => r.json()).then(setProducts);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to record movement");
    }
  }

  const columns = [
    { key: "date", label: "Date", render: (r) => fmtDate(r.date), exportValue: (r) => fmtDate(r.date) },
    { key: "product.sku", label: "SKU", render: (r) => <span className="font-mono text-xs font-semibold">{r.product?.sku}</span> },
    { key: "product.name", label: "Product", render: (r) => <span className="font-medium">{r.product?.name}</span> },
    { key: "type", label: "Type", render: (r) => <Badge status={r.type} /> },
    { key: "reference", label: "Reference" },
    {
      key: "quantity", label: "Qty",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 font-semibold ${r.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {r.type === "IN" ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
          {r.type === "IN" ? "+" : "−"}{r.quantity}
        </span>
      ),
    },
    { key: "balanceAfter", label: "Running Balance", render: (r) => <span className="font-semibold">{r.balanceAfter}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Inventory"]]}
        title="Inventory"
        subtitle="Stock movements & low stock alerts"
        actions={
          <>
            <button className="btn-ghost" onClick={() => setModal({ type: "OUT", productId: "", quantity: "", reference: "", date: toInputDate(new Date()) })}>
              <ArrowUpFromLine size={15} /> Stock Out
            </button>
            <button className="btn-primary" onClick={() => setModal({ type: "IN", productId: "", quantity: "", reference: "", date: toInputDate(new Date()) })}>
              <Plus size={16} /> Stock In
            </button>
          </>
        }
      />

      {data.lowStock.length > 0 && (
        <div className="card border-l-4 !border-l-rose-500 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle size={17} /> Low Stock Alerts ({data.lowStock.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-rose-50 px-4 py-3 dark:bg-rose-500/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{p.stockQty} left</p>
                  <p className="text-xs text-slate-400">reorder at {p.reorderLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No stock movements yet" description="Movements appear here when you receive goods (GRN), record stock in/out, or import products with opening stock.">
            <button className="btn-primary" onClick={() => setModal({ type: "IN", productId: "", quantity: "", reference: "", date: toInputDate(new Date()) })}><Plus size={15} /> Record Stock In</button>
          </EmptyState>
        }
        columns={columns}
        rows={data.movements}
        searchKeys={["product.sku", "product.name", "reference"]}
        filters={[{ key: "type", label: "Type", options: ["IN", "OUT"] }]}
        pageSize={15}
        exportName="stock-movements"
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === "IN" ? "Stock In" : "Stock Out"}>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Product *</label>
              <select className="input" required value={modal.productId} onChange={(e) => setModal((m) => ({ ...m, productId: e.target.value }))}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (stock: {p.stockQty})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Quantity *</label><input type="number" min="1" required className="input" value={modal.quantity} onChange={(e) => setModal((m) => ({ ...m, quantity: e.target.value }))} /></div>
              <div><label className="label">Date</label><input type="date" className="input" value={modal.date} onChange={(e) => setModal((m) => ({ ...m, date: e.target.value }))} /></div>
            </div>
            <div>
              <label className="label">Reference</label>
              <input className="input" placeholder={modal.type === "IN" ? "e.g. GRN-2026-105" : "e.g. ISS-1050 / Production issue"} value={modal.reference} onChange={(e) => setModal((m) => ({ ...m, reference: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : modal.type === "IN" ? "Record Stock In" : "Record Stock Out"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
