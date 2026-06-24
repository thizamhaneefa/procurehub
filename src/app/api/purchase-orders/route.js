export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { orderDate: "desc" },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
      receipts: { include: { items: true } },
    },
  });
  const withTotals = pos.map((po) => ({
    ...po,
    total: po.items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
  }));
  return Response.json(withTotals);
}

export async function POST(req) {
  const d = await req.json();
  const items = (d.items || []).filter((it) => it.productId && Number(it.qty) > 0);
  if (!d.supplierId || items.length === 0) {
    return Response.json({ error: "Supplier and at least one line item are required" }, { status: 400 });
  }
  const count = await prisma.purchaseOrder.count();
  const year = new Date().getFullYear();
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: d.poNumber || `PO-${year}-${String(count + 101)}`,
      supplierId: Number(d.supplierId),
      orderDate: d.orderDate ? new Date(d.orderDate) : new Date(),
      expectedDelivery: d.expectedDelivery ? new Date(d.expectedDelivery) : null,
      status: d.status || "Draft",
      notes: d.notes || null,
      items: {
        create: items.map((it) => ({
          productId: Number(it.productId),
          qty: Number(it.qty),
          unitPrice: Number(it.unitPrice) || 0,
        })),
      },
    },
    include: { supplier: true },
  });
  await prisma.activity.create({ data: { type: "po", message: `Purchase order ${po.poNumber} created — ${po.supplier.name}` } });
  return Response.json(po);
}
