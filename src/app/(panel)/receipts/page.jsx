"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useConfirm } from "@/components/PanelShell";
import { fmtDate, toInputDate } from "@/lib/format";

export default function ReceiptsPage() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const load = () => fetch("/api/receipts").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/purchase-orders").then((r) => r.json()).then(setPos);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const openPOs = useMemo(
    () => pos.filter((p) => ["Sent", "Partially Received", "Draft"].includes(p.status)),
    [pos]
  );

  function openCreate() {
    setModal({
      date: toInputDate(new Date()),
      supplierId: "", poId: "", receivedBy: "", fileUrl: "",
      items: [{ productId: "", qty: "" }],
    });
  }

  // selecting a PO pre-fills supplier + remaining quantities
  function onPickPO(poId) {
    if (!poId) { setModal((m) => ({ ...m, poId: "", items: [{ productId: "", qty: "" }] })); return; }
    const po = pos.find((p) => String(p.id) === String(poId));
    const received = {};
    for (const r of po.receipts || []) for (const it of r.items) received[it.productId] = (received[it.productId] || 0) + it.qty;
    const items = po.items
      .map((it) => ({ productId: it.productId, qty: Math.max(it.qty - (received[it.productId] || 0), 0) }))
      .filter((it) => it.qty > 0);
    setModal((m) => ({
      ...m, poId, supplierId: String(po.supplierId),
      items: items.length ? items : [{ productId: "", qty: "" }],
    }));
  }

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
      setModal((m) => ({ ...m, fileUrl: url }));
      toast.success("File attached");
    } else toast.error("Upload failed");
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/receipts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modal),
    });
    setSaving(false);
    if (res.ok) {
      const rec = await res.json();
      toast.success(`${rec.receiptNo} posted — stock updated`);
      setModal(null);
      load();
      fetch("/api/purchase-orders").then((r) => r.json()).then(setPos);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to post receipt");
    }
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete ${row.receiptNo}?`,
      message: "The goods receipt will be removed and the stock it added will be reversed out of inventory.",
    });
    if (!ok) return;
    await fetch(`/api/receipts/${row.id}`, { method: "DELETE" });
    toast.success("Receipt deleted and stock reversed");
    load();
  }

  const columns = [
    {
      key: "_exp", label: "", sortable: false, export: false,
      render: (r) => (
        <button className="btn-ghost !p-1" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
          {expanded === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      ),
    },
    { key: "receiptNo", label: "Receipt #", render: (r) => <span className="font-semibold">{r.receiptNo}</span> },
    { key: "date", label: "Date", render: (r) => fmtDate(r.date), exportValue: (r) => fmtDate(r.date) },
    { key: "supplier.name", label: "Supplier" },
    { key: "po.poNumber", label: "PO", render: (r) => r.po?.poNumber || "—" },
    { key: "invoice.invoiceNo", label: "Invoice", render: (r) => r.invoice?.invoiceNo || "—" },
    { key: "_items", label: "Items", sortable: false, render: (r) => `${r.items.length} lines / ${r.items.reduce((s, it) => s + it.qty, 0)} units`, exportValue: (r) => r.items.reduce((s, it) => s + it.qty, 0) },
    { key: "receivedBy", label: "Received By" },
    {
      key: "fileUrl", label: "File", sortable: false, export: false,
      render: (r) => r.fileUrl ? <a href={r.fileUrl} target="_blank" className="text-rose-600 dark:text-rose-400"><Paperclip size={14} /></a> : <span className="text-slate-300 dark:text-slate-600">—</span>,
    },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => <button className="btn-ghost !p-1.5 !text-rose-500" onClick={() => remove(r)}><Trash2 size={14} /></button>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Receipts (GRN)"]]}
        title="Goods Receipts (GRN)"
        subtitle="Receiving stock automatically increases inventory"
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> New Receipt</button>}
      />

      <DataTable
        loading={loading}
        empty={
          <EmptyState title="No goods receipts yet" description="Post a GRN when a delivery arrives — stock levels and the linked PO update automatically.">
            <button className="btn-primary" onClick={openCreate}><Plus size={15} /> New Receipt</button>
          </EmptyState>
        }
        columns={columns}
        rows={rows}
        searchKeys={["receiptNo", "supplier.name", "po.poNumber", "receivedBy"]}
        exportName="goods-receipts"
      />

      {expanded && (() => {
        const r = rows.find((x) => x.id === expanded);
        if (!r) return null;
        return (
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">{r.receiptNo} — items received</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="pb-2">SKU</th><th className="pb-2">Product</th><th className="pb-2 text-right">Qty Received</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {r.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 font-mono text-xs">{it.product?.sku}</td>
                    <td className="py-2">{it.product?.name}</td>
                    <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">+{it.qty} {it.product?.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      <Modal open={!!modal} onClose={() => setModal(null)} title="New Goods Receipt" wide>
        {modal && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Linked PO (optional)</label>
                <select className="input" value={modal.poId} onChange={(e) => onPickPO(e.target.value)}>
                  <option value="">— No PO —</option>
                  {openPOs.map((p) => <option key={p.id} value={p.id}>{p.poNumber} — {p.supplier?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Supplier *</label>
                <select className="input" required value={modal.supplierId} onChange={(e) => setModal((m) => ({ ...m, supplierId: e.target.value }))} disabled={!!modal.poId}>
                  <option value="">Select…</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Date</label><input type="date" className="input" value={modal.date} onChange={(e) => setModal((m) => ({ ...m, date: e.target.value }))} /></div>
            </div>

            <div>
              <label className="label">Items Received</label>
              <div className="space-y-2">
                {modal.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select className="input flex-1" required value={it.productId} onChange={(e) => setModal((m) => ({ ...m, items: m.items.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x) }))}>
                      <option value="">Select product…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                    <input type="number" min="1" required className="input w-24" placeholder="Qty" value={it.qty} onChange={(e) => setModal((m) => ({ ...m, items: m.items.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x) }))} />
                    <button type="button" className="btn-ghost !p-1.5 !text-rose-500" disabled={modal.items.length === 1} onClick={() => setModal((m) => ({ ...m, items: m.items.filter((_, idx) => idx !== i) }))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-ghost mt-2 !px-3 !py-1.5 text-xs" onClick={() => setModal((m) => ({ ...m, items: [...m.items, { productId: "", qty: "" }] }))}>
                <Plus size={13} /> Add line
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="label">Received By *</label><input className="input" required value={modal.receivedBy} onChange={(e) => setModal((m) => ({ ...m, receivedBy: e.target.value }))} placeholder="e.g. Ahmed Hassan" /></div>
              <div>
                <label className="label">Delivery Note / Scan</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept=".pdf,image/*" onChange={uploadFile} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-600 dark:file:bg-rose-500/15" />
                  {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
                  {modal.fileUrl && <a href={modal.fileUrl} target="_blank" className="text-xs text-rose-600 hover:underline">View</a>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Posting…" : "Post Receipt & Update Stock"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
