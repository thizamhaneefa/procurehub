export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: Number(params.id) },
    include: {
      supplier: true,
      items: { include: { product: true } },
      receipts: { include: { items: true } },
      invoices: true,
    },
  });
  if (!po) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ...po, total: po.items.reduce((s, it) => s + it.qty * it.unitPrice, 0) });
}

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const d = await req.json();
  const data = {};
  if (d.status) data.status = d.status;
  if ("notes" in d) data.notes = d.notes;
  if ("expectedDelivery" in d) data.expectedDelivery = d.expectedDelivery ? new Date(d.expectedDelivery) : null;
  const po = await prisma.purchaseOrder.update({ where: { id }, data, include: { supplier: true } });
  if (d.status) {
    await prisma.activity.create({ data: { type: "po", message: `PO ${po.poNumber} status changed to ${d.status}` } });
  }
  return Response.json(po);
}

export async function DELETE(_req, { params }) {
  await prisma.purchaseOrder.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
