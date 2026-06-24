export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  const data = {};
  for (const k of ["invoiceNo", "currency", "status", "fileUrl"]) if (k in d) data[k] = d[k];
  if ("supplierId" in d) data.supplierId = Number(d.supplierId);
  if ("poId" in d) data.poId = d.poId ? Number(d.poId) : null;
  if ("amount" in d) data.amount = Number(d.amount) || 0;
  if ("invoiceDate" in d) data.invoiceDate = new Date(d.invoiceDate);
  if ("dueDate" in d) data.dueDate = new Date(d.dueDate);
  const inv = await prisma.invoice.update({ where: { id: Number(params.id) }, data });
  if (d.status === "Paid") {
    await prisma.activity.create({ data: { type: "invoice", message: `Invoice ${inv.invoiceNo} marked as Paid` } });
  }
  return Response.json(inv);
}

export async function DELETE(_req, { params }) {
  await prisma.invoice.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
