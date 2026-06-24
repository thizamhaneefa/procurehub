export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/overdue";

export async function GET() {
  await markOverdueInvoices();
  const invoices = await prisma.invoice.findMany({
    orderBy: { invoiceDate: "desc" },
    include: {
      supplier: { select: { id: true, name: true } },
      po: { select: { id: true, poNumber: true } },
    },
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const summary = {
    totalPending: invoices.filter((i) => i.status === "Pending" || i.status === "Approved").reduce((s, i) => s + i.amount, 0),
    totalOverdue: invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0),
    paidThisMonth: invoices.filter((i) => i.status === "Paid" && new Date(i.invoiceDate) >= monthStart).reduce((s, i) => s + i.amount, 0),
  };
  return Response.json({ invoices, summary });
}

export async function POST(req) {
  const d = await req.json();
  if (!d.invoiceNo || !d.supplierId) {
    return Response.json({ error: "Invoice number and supplier are required" }, { status: 400 });
  }
  try {
    const inv = await prisma.invoice.create({
      data: {
        invoiceNo: d.invoiceNo,
        supplierId: Number(d.supplierId),
        poId: d.poId ? Number(d.poId) : null,
        invoiceDate: d.invoiceDate ? new Date(d.invoiceDate) : new Date(),
        dueDate: d.dueDate ? new Date(d.dueDate) : new Date(),
        amount: Number(d.amount) || 0,
        currency: d.currency || "AED",
        status: d.status || "Pending",
        fileUrl: d.fileUrl || null,
      },
      include: { supplier: true },
    });
    await prisma.activity.create({ data: { type: "invoice", message: `Invoice ${inv.invoiceNo} recorded — ${inv.supplier.name}` } });
    return Response.json(inv);
  } catch (e) {
    if (e.code === "P2002") return Response.json({ error: "Invoice number already exists" }, { status: 400 });
    throw e;
  }
}
