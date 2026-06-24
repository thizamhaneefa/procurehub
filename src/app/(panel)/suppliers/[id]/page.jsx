"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, Wallet, Package, ReceiptText, ShoppingCart } from "lucide-react";
import Badge from "@/components/Badge";
import Stars from "@/components/Stars";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { SkeletonKpis } from "@/components/Skeleton";
import { fmtMoney, fmtDate } from "@/lib/format";

export default function SupplierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [s, setS] = useState(null);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`).then((r) => r.json()).then(setS).catch(() => {});
  }, [id]);

  if (!s) {
    return (
      <div className="space-y-6">
        <PageHeader crumbs={[["Suppliers", "/suppliers"], ["Loading…"]]} title=" " />
        <SkeletonKpis count={4} />
      </div>
    );
  }
  if (s.error) return <div className="p-8 text-center text-slate-400">Supplier not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Suppliers", "/suppliers"], [s.name]]}
        title={s.name}
        subtitle={`${s.category} supplier — ${s.city}, ${s.country}`}
        actions={<button onClick={() => router.back()} className="btn-ghost"><ArrowLeft size={14} /> Back</button>}
      />

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge status={s.status} />
          <Stars value={s.rating} />
          <span className="text-sm text-slate-500">{s.category}</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {s.email || "—"}</p>
          <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {s.phone || "—"}</p>
          <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {s.city}, {s.country}</p>
          <p className="flex items-center gap-2"><CreditCard size={14} className="text-slate-400" /> {s.paymentTerms} — Contact: {s.contactPerson}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Total Spend" value={fmtMoney(s.totalSpend)} color="rose" />
        <KpiCard icon={ReceiptText} label="Invoices" value={s.invoices.length} color="amber" />
        <KpiCard icon={ShoppingCart} label="Purchase Orders" value={s.purchaseOrders.length} color="blue" />
        <KpiCard icon={Package} label="Products Supplied" value={s.products.length} color="green" />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Products Supplied</h2>
        <DataTable
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Product", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "category", label: "Category" },
            { key: "unit", label: "Unit" },
            { key: "lastPurchasePrice", label: "Last Price", render: (r) => fmtMoney(r.lastPurchasePrice) },
            { key: "stockQty", label: "Stock" },
          ]}
          rows={s.products}
          searchKeys={["sku", "name", "category"]}
          pageSize={5}
          exportName={`${s.name}-products`}
        />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Invoices</h2>
        <DataTable
          columns={[
            { key: "invoiceNo", label: "Invoice #", render: (r) => <span className="font-medium">{r.invoiceNo}</span> },
            { key: "po.poNumber", label: "PO", render: (r) => r.po?.poNumber || "—" },
            { key: "invoiceDate", label: "Date", render: (r) => fmtDate(r.invoiceDate), exportValue: (r) => fmtDate(r.invoiceDate) },
            { key: "dueDate", label: "Due", render: (r) => fmtDate(r.dueDate), exportValue: (r) => fmtDate(r.dueDate) },
            { key: "amount", label: "Amount", render: (r) => <span className="font-semibold">{fmtMoney(r.amount, r.currency)}</span> },
            { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
          ]}
          rows={s.invoices}
          searchKeys={["invoiceNo", "status"]}
          pageSize={5}
          exportName={`${s.name}-invoices`}
        />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Purchase Orders</h2>
        <DataTable
          columns={[
            { key: "poNumber", label: "PO #", render: (r) => <Link className="font-medium text-rose-600 hover:underline dark:text-rose-400" href={`/purchase-orders/${r.id}`}>{r.poNumber}</Link> },
            { key: "orderDate", label: "Order Date", render: (r) => fmtDate(r.orderDate), exportValue: (r) => fmtDate(r.orderDate) },
            { key: "expectedDelivery", label: "Expected", render: (r) => fmtDate(r.expectedDelivery), exportValue: (r) => fmtDate(r.expectedDelivery) },
            { key: "_total", label: "Total", sortable: false, render: (r) => fmtMoney(r.items.reduce((t, it) => t + it.qty * it.unitPrice, 0)), exportValue: (r) => r.items.reduce((t, it) => t + it.qty * it.unitPrice, 0) },
            { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
          ]}
          rows={s.purchaseOrders}
          searchKeys={["poNumber", "status"]}
          pageSize={5}
          exportName={`${s.name}-pos`}
        />
      </div>
    </div>
  );
}
