export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/overdue";

export async function GET() {
  await markOverdueInvoices();
  const [products, overdue] = await Promise.all([
    prisma.product.findMany({ orderBy: { stockQty: "asc" } }),
    prisma.invoice.findMany({
      where: { status: "Overdue" },
      include: { supplier: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);
  const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel).slice(0, 10);
  return Response.json({ lowStock, overdue });
}
