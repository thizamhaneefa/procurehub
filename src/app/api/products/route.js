export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { sku: "asc" },
    include: { supplier: { select: { id: true, name: true } } },
  });
  return Response.json(products);
}

export async function POST(req) {
  const d = await req.json();
  try {
    const p = await prisma.product.create({
      data: {
        sku: d.sku, name: d.name, category: d.category || "", unit: d.unit || "Pcs",
        supplierId: d.supplierId ? Number(d.supplierId) : null,
        unitCost: Number(d.unitCost) || 0,
        lastPurchasePrice: Number(d.lastPurchasePrice) || Number(d.unitCost) || 0,
        stockQty: Number(d.stockQty) || 0,
        reorderLevel: Number(d.reorderLevel) || 0,
        status: d.status || "Active",
      },
    });
    if (p.stockQty > 0) {
      await prisma.stockMovement.create({
        data: { productId: p.id, type: "IN", reference: "Opening Stock", quantity: p.stockQty, balanceAfter: p.stockQty },
      });
    }
    return Response.json(p);
  } catch (e) {
    if (e.code === "P2002") return Response.json({ error: "SKU already exists" }, { status: 400 });
    throw e;
  }
}
