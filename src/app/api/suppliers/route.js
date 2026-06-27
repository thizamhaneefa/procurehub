export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, invoices: true, purchaseOrders: true, pricelists: true } } },
  });
  return Response.json(suppliers);
}

export async function POST(req) {
  const d = await req.json();
  const s = await prisma.supplier.create({
    data: {
      name: d.name, contactPerson: d.contactPerson || "", email: d.email || "",
      phone: d.phone || "", country: d.country || "", city: d.city || "",
      category: d.category || "", paymentTerms: d.paymentTerms || "",
      status: d.status || "Active", rating: Number(d.rating) || 3,
    },
  });
  await prisma.activity.create({ data: { type: "supplier", message: `Supplier added: ${s.name}` } });
  return Response.json(s);
}
