export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  const data = {};
  for (const k of ["description", "category", "vendor", "billUrl", "notes"]) {
    if (k in d) data[k] = d[k] || null;
  }
  if (data.description === null) delete data.description;
  if ("amount" in d) data.amount = Number(d.amount) || 0;
  if ("purchaseDate" in d) data.purchaseDate = d.purchaseDate ? new Date(d.purchaseDate) : new Date();
  const exp = await prisma.miscExpense.update({ where: { id: Number(params.id) }, data });
  return Response.json(exp);
}

export async function DELETE(_req, { params }) {
  await prisma.miscExpense.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
