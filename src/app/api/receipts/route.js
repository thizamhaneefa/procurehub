export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    orderBy: { date: "desc" },
    include: {
      supplier: { select: { id: true, name: true } },
      po: { select: { id: true, poNumber: true } },
      invoice: { select: { id: true, invoiceNo: true } },
      items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
    },
  });
  return Response.json(receipts);
}

// Posting a GRN increases stock, writes stock movements and updates the PO status.
export async function POST(req) {
  const d = await req.json();
  const items = (d.items || [])
    .map((it) => ({ productId: Number(it.productId), qty: Number(it.qty) }))
    .filter((it) => it.productId && it.qty > 0);
  if (!d.supplierId || items.length === 0) {
    return Response.json({ error: "Supplier and at least one received item are required" }, { status: 400 });
  }

  const count = await prisma.receipt.count();
  const date = d.date ? new Date(d.date) : new Date();
  const receiptNo = d.receiptNo || `GRN-${date.getFullYear()}-${String(count + 101)}`;

  const receipt = await prisma.$transaction(async (tx) => {
    const rec = await tx.receipt.create({
      data: {
        receiptNo,
        date,
        supplierId: Number(d.supplierId),
        poId: d.poId ? Number(d.poId) : null,
        invoiceId: d.invoiceId ? Number(d.invoiceId) : null,
        receivedBy: d.receivedBy || "—",
        fileUrl: d.fileUrl || null,
        items: { create: items },
      },
      include: { supplier: true },
    });

    for (const it of items) {
      const product = await tx.product.update({
        where: { id: it.productId },
        data: { stockQty: { increment: it.qty } },
      });
      await tx.stockMovement.create({
        data: {
          productId: it.productId, type: "IN", date,
          reference: receiptNo, quantity: it.qty, balanceAfter: product.stockQty,
        },
      });
    }

    if (rec.poId) {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: rec.poId },
        include: { items: true, receipts: { include: { items: true } } },
      });
      const ordered = po.items.reduce((s, it) => s + it.qty, 0);
      const received = po.receipts.reduce((s, r) => s + r.items.reduce((a, it) => a + it.qty, 0), 0);
      const status = received >= ordered ? "Received" : "Partially Received";
      if (po.status !== "Closed" && po.status !== status) {
        await tx.purchaseOrder.update({ where: { id: po.id }, data: { status } });
      }
    }

    await tx.activity.create({
      data: { type: "receipt", message: `GRN ${receiptNo} posted — goods received from ${rec.supplier.name}` },
    });
    return rec;
  });

  return Response.json(receipt);
}
