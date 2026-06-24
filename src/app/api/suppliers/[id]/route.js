export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/overdue";

export async function GET(_req, { params }) {
  await markOverdueInvoices();
  const id = Number(params.id);
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: true,
      invoices: { orderBy: { invoiceDate: "desc" }, include: { po: { select: { poNumber: true } } } },
      purchaseOrders: { orderBy: { orderDate: "desc" }, include: { items: true } },
    },
  });
  if (!supplier) return Response.json({ error: "Not found" }, { status: 404 });
  const totalSpend = supplier.invoices.reduce((s, i) => s + i.amount, 0);
  return Response.json({ ...supplier, totalSpend });
}

export async function PUT(req, { params }) {
  const d = await req.json();
  const s = await prisma.supplier.update({
    where: { id: Number(params.id) },
    data: {
      name: d.name, contactPerson: d.contactPerson, email: d.email, phone: d.phone,
      country: d.country, city: d.city, category: d.category,
      paymentTerms: d.paymentTerms, status: d.status, rating: Number(d.rating) || 3,
    },
  });
  return Response.json(s);
}

export async function DELETE(_req, { params }) {
  const id = Number(params.id);
  const s = await prisma.supplier.findUnique({ where: { id } });
  await prisma.supplier.delete({ where: { id } });
  await prisma.activity.create({ data: { type: "supplier", message: `Supplier deleted: ${s?.name || id}` } });
  return Response.json({ ok: true });
}
