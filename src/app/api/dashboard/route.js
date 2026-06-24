export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/overdue";

export async function GET() {
  await markOverdueInvoices();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [invoices, suppliers, newSuppliersThisMonth, products, pos, poThisMonth, poLastMonth, activity] = await Promise.all([
    prisma.invoice.findMany({ include: { supplier: { select: { name: true, category: true } } } }),
    prisma.supplier.count({ where: { status: "Active" } }),
    prisma.supplier.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.product.findMany({ select: { stockQty: true, reorderLevel: true } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["Draft", "Sent", "Partially Received"] } } }),
    prisma.purchaseOrder.count({ where: { orderDate: { gte: monthStart } } }),
    prisma.purchaseOrder.count({ where: { orderDate: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const spendThisMonth = invoices
    .filter((i) => new Date(i.invoiceDate) >= monthStart)
    .reduce((s, i) => s + i.amount, 0);
  const spendLastMonth = invoices
    .filter((i) => { const d = new Date(i.invoiceDate); return d >= lastMonthStart && d < monthStart; })
    .reduce((s, i) => s + i.amount, 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue");
  const lowStockCount = products.filter((p) => p.stockQty <= p.reorderLevel).length;
  const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

  // monthly spend, last 12 months
  const months = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), spend: 0 });
  }
  const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));
  for (const i of invoices) {
    const d = new Date(i.invoiceDate);
    if (d < yearAgo) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthMap[key]) monthMap[key].spend += i.amount;
  }

  // spend by category & top suppliers
  const byCategory = {};
  const bySupplier = {};
  for (const i of invoices) {
    const cat = i.supplier?.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + i.amount;
    const sup = i.supplier?.name || "Unknown";
    bySupplier[sup] = (bySupplier[sup] || 0) + i.amount;
  }
  const topSuppliers = Object.entries(bySupplier)
    .map(([name, spend]) => ({ name, spend: Math.round(spend) }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return Response.json({
    kpis: {
      spendThisMonth,
      spendTrend: pct(spendThisMonth, spendLastMonth),
      activeSuppliers: suppliers,
      newSuppliersThisMonth,
      pendingInvoices: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((s, i) => s + i.amount, 0),
      lowStock: lowStockCount,
      openPOs: pos,
      poTrend: pct(poThisMonth, poLastMonth),
    },
    monthlySpend: months.map((m) => ({ month: m.label, spend: Math.round(m.spend) })),
    byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) })),
    topSuppliers,
    activity,
  });
}
