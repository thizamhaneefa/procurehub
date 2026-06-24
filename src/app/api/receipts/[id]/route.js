export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

// Deleting a GRN reverses the stock it added.
export async function DELETE(_req, { params }) {
  const id = Number(params.id);
  const rec = await prisma.receipt.findUnique({ where: { id }, include: { items: true } });
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    for (const it of rec.items) {
      const product = await tx.product.update({
        where: { id: it.productId },
        data: { stockQty: { decrement: it.qty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: it.productId, type: "OUT", date: new Date(),
          reference: `Reversal ${rec.receiptNo}`, quantity: it.qty,
          balanceAfter: product.stockQty,
        },
      });
    }
    await tx.receipt.delete({ where: { id } });
  });
  return Response.json({ ok: true });
}
