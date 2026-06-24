export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/overdue";

export async function GET(req) {
  await markOverdueInvoices();
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") ? new Date(sp.get("from")) : new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const to = sp.get("to") ? new Date(sp.get("to") + "T23:59:59") : new Date();

  const [invoices, receipts, poItems] = await Promise.all([
    prisma.invoice.findMany({
      where: { invoiceDate: { gte: from, lte: to } },
      include: { supplier: { select: { id: true, name: true, category: true, country: true } } },
      orderBy: { invoiceDate: "asc" },
    }),
    prisma.receipt.findMany({
      where: { date: { gte: from, lte: to }, poId: { not: null } },
      include: { po: { select: { supplierId: true, expectedDelivery: true } } },
    }),
    prisma.pOItem.findMany({
      include: { po: { select: { supplierId: true, orderDate: true } } },
    }),
  ]);

  // monthly spend
  const monthly = {};
  for (const i of invoices) {
    const d = new Date(i.invoiceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] ||= { month: key, label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), spend: 0, invoices: 0 };
    monthly[key].spend += i.amount;
    monthly[key].invoices += 1;
  }

  // supplier performance
  const perf = {};
  for (const i of invoices) {
    const s = i.supplier;
    perf[s.id] ||= { id: s.id, name: s.name, category: s.category, country: s.country, totalSpend: 0, invoiceCount: 0, onTime: 0, deliveries: 0, priceSum: 0, priceCount: 0 };
    perf[s.id].totalSpend += i.amount;
    perf[s.id].invoiceCount += 1;
  }
  for (const r of receipts) {
    const sid = r.po?.supplierId;
    if (!sid || !perf[sid]) continue;
    perf[sid].deliveries += 1;
    if (!r.po.expectedDelivery || new Date(r.date) <= new Date(r.po.expectedDelivery)) perf[sid].onTime += 1;
  }
  for (const it of poItems) {
    const sid = it.po?.supplierId;
    if (!sid || !perf[sid]) continue;
    const d = new Date(it.po.orderDate);
    if (d < from || d > to) continue;
    perf[sid].priceSum += it.unitPrice;
    perf[sid].priceCount += 1;
  }
  const performance = Object.values(perf)
    .map((p) => ({
      ...p,
      onTimePct: p.deliveries ? Math.round((p.onTime / p.deliveries) * 100) : null,
      avgPrice: p.priceCount ? p.priceSum / p.priceCount : null,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // spend by category
  const byCategory = {};
  for (const i of invoices) {
    const c = i.supplier?.category || "Other";
    byCategory[c] = (byCategory[c] || 0) + i.amount;
  }

  return Response.json({
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
    performance,
    byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) })),
    totals: {
      spend: invoices.reduce((s, i) => s + i.amount, 0),
      invoices: invoices.length,
      paid: invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0),
    },
  });
}
