"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useConfirm } from "@/components/PanelShell";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/format";

const STATUSES = ["Draft", "Sent", "Partially Received", "Received", "Closed"];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const load = () => fetch("/api/purchase-orders").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const supplierProducts = useMemo(() => {
    if (!modal?.supplierId) return products;
    const own = products.filter((p) => String(p.supplierId) === String(modal.supplierId));
    return own.length ? own : products;
  }, [modal?.supplierId, products]);

  function openCreate() {
    setModal({
      supplierId: "",
      orderDate: toInputDate(new Date()),
      expectedDelivery: "",
      notes: "",
      items: [{ productId: "", qty: 1, unitPrice: "" }],
    });
  }

  function setItem(i, patch) {
    setModal((m) => {
      const items = m.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      return { ...m, items };
    });
  }

  function onPickProduct(i, productId) {
    const p = products.find((x) => String(x.id) === String(productId));
    setItem(i, { productId, unitPrice: p ? p.lastPurchasePrice : "" });
  }

  const total = modal ? modal.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0) : 0;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal),
    });
    setSaving(false);
    if (res.ok) {
      const po = await res.json();
      toast.success(`${po.poNumber} created`);
      setModal(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to create PO");
    }
  }

  async function setStatus(po, status) {
    await fetch(`/api/purchase-orders/${po.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`${po.poNumber} → ${status}`);
    load();
  }

  async function remove(po) {
    const ok = await confirm({
      title: `Delete ${po.poNumber}?`,
      message: "The purchase order and its line items will be permanently removed.",
    });
    if (!ok) return;
    await fetch(`/api/purchase-orders/${po.id}`, { method: "DELETE" });
    toast.success("PO deleted");
    load();
  }

  const columns = [
    { key: "poNumber", label: "PO #", render: (r) => <span className="font-semibold text-rose-600 dark:text-rose-400">{r.poNumber}</span> },
    { key: "supplier.name", label: "Supplier" },
    { key: "orderDate", label: "Order Date", render: (r) => fmtDate(r.orderDate), exportValue: (r) => fmtDate(r.orderDate) },
    { key: "expectedDelivery", label: "Expected Delivery", render: (r) => fmtDate(r.expectedDelivery), exportValue: (r) => fmtDate(r.expectedDelivery) },
    { key: "_items", label: "Items", sortable: false, render: (r) => r.items.length, exportValue: (r) => r.items.length },
    { key: "total", label: "Total", render: (r) => <span className="font-semibold">{fmtMoney(r.total)}</span> },
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
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost !p-1.5" title="View / Print" onClick={() => router.push(`/purchase-orders/${r.id}`)}><Eye size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" title="Delete" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Purchase Orders"]]}
        title="Purchase Orders"
        subtitle={`${rows.length} purchase orders — click a row for the printable view`}
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> New Purchase Order</button>}
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No purchase orders yet" description="Create your first PO — add suppliers and products first so you can pick them as line items.">
            <button className="btn-primary" onClick={openCreate}><Plus size={15} /> New Purchase Order</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["poNumber", "supplier.name", "status"]}
        filters={[{ key: "status", label: "Status", options: STATUSES }]}
        exportName="purchase-orders"
        onRowClick={(r) => router.push(`/purchase-orders/${r.id}`)}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title="New Purchase Order" wide>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Supplier *</label>
                <select className="input" required value={modal.supplierId} onChange={(e) => setModal((m) => ({ ...m, supplierId: e.target.value }))}>
                  <option value="">Select…</option>
                  {suppliers.filter((s) => s.status === "Active").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Order Date</label><input type="date" className="input" value={modal.orderDate} onChange={(e) => setModal((m) => ({ ...m, orderDate: e.target.value }))} /></div>
              <div><label className="label">Expected Delivery</label><input type="date" className="input" value={modal.expectedDelivery} onChange={(e) => setModal((m) => ({ ...m, expectedDelivery: e.target.value }))} /></div>
            </div>

            <div>
              <label className="label">Line Items</label>
              <div className="space-y-2">
                {modal.items.map((it, i) => {
                  const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <select className="input min-w-[220px] flex-1" required value={it.productId} onChange={(e) => onPickProduct(i, e.target.value)}>
                        <option value="">Select product…</option>
                        {supplierProducts.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                      </select>
                      <input type="number" min="1" required className="input w-20" placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
                      <input type="number" step="0.01" min="0" required className="input w-28" placeholder="Unit price" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} />
                      <span className="w-28 text-right text-sm font-semibold">{fmtMoney(lineTotal)}</span>
                      <button type="button" className="btn-ghost !p-1.5 !text-rose-500" disabled={modal.items.length === 1} onClick={() => setModal((m) => ({ ...m, items: m.items.filter((_, idx) => idx !== i) }))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="btn-ghost mt-2 !px-3 !py-1.5 text-xs" onClick={() => setModal((m) => ({ ...m, items: [...m.items, { productId: "", qty: 1, unitPrice: "" }] }))}>
                <Plus size={13} /> Add line
              </button>
            </div>

            <div><label className="label">Notes</label><textarea className="input" rows={2} value={modal.notes} onChange={(e) => setModal((m) => ({ ...m, notes: e.target.value }))} /></div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Total: {fmtMoney(total)}</p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-primary" disabled={saving}>{saving ? "Creating…" : "Create PO (Draft)"}</button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
