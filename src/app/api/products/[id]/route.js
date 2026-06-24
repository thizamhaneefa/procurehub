export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  const p = await prisma.product.update({
    where: { id: Number(params.id) },
    data: {
      sku: d.sku, name: d.name, category: d.category, unit: d.unit,
      supplierId: d.supplierId ? Number(d.supplierId) : null,
      unitCost: Number(d.unitCost) || 0,
      lastPurchasePrice: Number(d.lastPurchasePrice) || 0,
      reorderLevel: Number(d.reorderLevel) || 0,
      status: d.status,
    },
  });
  return Response.json(p);
}

export async function DELETE(_req, { params }) {
  await prisma.product.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
