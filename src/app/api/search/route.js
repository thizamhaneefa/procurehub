export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ suppliers: [], customers: [], products: [], invoices: [], pos: [] });

  const [suppliers, customers, products, invoices, pos] = await Promise.all([
    prisma.supplier.findMany({
      where: { OR: [{ name: { contains: q } }, { contactPerson: { contains: q } }] },
      take: 5,
    }),
    prisma.customer.findMany({
      where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
      take: 5,
    }),
    prisma.product.findMany({
      where: { OR: [{ name: { contains: q } }, { sku: { contains: q } }] },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { invoiceNo: { contains: q } },
      include: { supplier: { select: { name: true } } },
      take: 5,
    }),
    prisma.purchaseOrder.findMany({
      where: { poNumber: { contains: q } },
      include: { supplier: { select: { name: true } } },
      take: 5,
    }),
  ]);
  return Response.json({ suppliers, customers, products, invoices, pos });
}
