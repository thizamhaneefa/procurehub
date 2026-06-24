export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [movements, products] = await Promise.all([
    prisma.stockMovement.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: 500,
      include: { product: { select: { sku: true, name: true, unit: true } } },
    }),
    prisma.product.findMany({ orderBy: { stockQty: "asc" } }),
  ]);
  const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel);
  return Response.json({ movements, lowStock });
}

export async function POST(req) {
  const d = await req.json();
  const productId = Number(d.productId);
  const qty = Math.abs(Number(d.quantity) || 0);
  const type = d.type === "OUT" ? "OUT" : "IN";
  if (!productId || qty <= 0) return Response.json({ error: "Product and quantity are required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  if (type === "OUT" && qty > product.stockQty) {
    return Response.json({ error: `Insufficient stock: only ${product.stockQty} available` }, { status: 400 });
  }
  const newBal = type === "IN" ? product.stockQty + qty : product.stockQty - qty;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId, type, quantity: qty, balanceAfter: newBal,
        reference: d.reference || (type === "IN" ? "Manual Stock In" : "Manual Issue"),
        date: d.date ? new Date(d.date) : new Date(),
      },
    }),
    prisma.product.update({ where: { id: productId }, data: { stockQty: newBal } }),
    prisma.activity.create({
      data: { type: "stock", message: `Stock ${type === "IN" ? "received" : "issued"}: ${product.name} x ${qty}` },
    }),
  ]);
  return Response.json(movement);
}
