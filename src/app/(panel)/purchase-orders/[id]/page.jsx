"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import { useApp } from "@/components/PanelShell";
import { fmtMoney, fmtDate } from "@/lib/format";

export default function PODetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { settings } = useApp();
  const [po, setPo] = useState(null);

  useEffect(() => {
    fetch(`/api/purchase-orders/${id}`).then((r) => r.json()).then(setPo).catch(() => {});
  }, [id]);

  if (!po) return <div className="flex h-64 items-center justify-center text-slate-400">Loading…</div>;
  if (po.error) return <div className="p-8 text-center text-slate-400">Purchase order not found.</div>;

  const received = {};
  for (const r of po.receipts || []) for (const it of r.items) received[it.productId] = (received[it.productId] || 0) + it.qty;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          crumbs={[["Purchase Orders", "/purchase-orders"], [po.poNumber]]}
          title={po.poNumber}
          subtitle={`${po.supplier.name} — ${fmtDate(po.orderDate)}`}
          actions={
            <>
              <button onClick={() => router.back()} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
              <button onClick={() => window.print()} className="btn-primary"><Printer size={15} /> Print / Save as PDF</button>
            </>
          }
        />
      </div>

      <div id="print-area" className="card mx-auto max-w-4xl p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 dark:border-slate-200">
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="logo" className="h-12 w-12 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{settings.companyName || "ProcureHub"}</h1>
              {settings.address && <p className="text-xs text-slate-500">{settings.address}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black tracking-tight text-rose-600">PURCHASE ORDER</h2>
            <p className="mt-1 font-mono text-sm font-semibold">{po.poNumber}</p>
            <div className="mt-1"><Badge status={po.status} /></div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="label">Supplier</p>
            <p className="font-bold text-slate-900 dark:text-white">{po.supplier.name}</p>
            <p className="text-slate-500">{po.supplier.contactPerson}</p>
            <p className="text-slate-500">{po.supplier.city}, {po.supplier.country}</p>
            <p className="text-slate-500">{po.supplier.email} · {po.supplier.phone}</p>
          </div>
          <div className="text-right">
            <p><span className="label inline">Order Date: </span><span className="font-medium">{fmtDate(po.orderDate)}</span></p>
            <p><span className="label inline">Expected Delivery: </span><span className="font-medium">{fmtDate(po.expectedDelivery)}</span></p>
            <p><span className="label inline">Payment Terms: </span><span className="font-medium">{po.supplier.paymentTerms}</span></p>
            <p><span className="label inline">Currency: </span><span className="font-medium">AED</span></p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left dark:border-slate-700">
              <th className="py-2 pr-2 font-semibold">#</th>
              <th className="py-2 pr-2 font-semibold">SKU</th>
              <th className="py-2 pr-2 font-semibold">Description</th>
              <th className="py-2 pr-2 text-right font-semibold">Qty</th>
              <th className="py-2 pr-2 font-semibold">Unit</th>
              <th className="py-2 pr-2 text-right font-semibold">Unit Price</th>
              <th className="py-2 pr-2 text-right font-semibold">Received</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {po.items.map((it, i) => (
              <tr key={it.id}>
                <td className="py-2.5 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-2 font-mono text-xs">{it.product.sku}</td>
                <td className="py-2.5 pr-2 font-medium">{it.product.name}</td>
                <td className="py-2.5 pr-2 text-right">{it.qty}</td>
                <td className="py-2.5 pr-2">{it.product.unit}</td>
                <td className="py-2.5 pr-2 text-right">{fmtMoney(it.unitPrice)}</td>
                <td className="py-2.5 pr-2 text-right text-slate-500">{received[it.productId] || 0}</td>
                <td className="py-2.5 text-right font-semibold">{fmtMoney(it.qty * it.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-700">
              <td colSpan={7} className="py-3 text-right text-base font-bold">Grand Total</td>
              <td className="py-3 text-right text-base font-extrabold text-rose-600">{fmtMoney(po.total)}</td>
            </tr>
          </tfoot>
        </table>

        {po.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
            <p className="label">Notes / Delivery Instructions</p>
            <p>{po.notes}</p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
          <div className="border-t border-slate-300 pt-2 text-slate-500 dark:border-slate-700">Prepared by — Procurement</div>
          <div className="border-t border-slate-300 pt-2 text-slate-500 dark:border-slate-700">Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}
