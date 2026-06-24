export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  const data = {};
  for (const k of ["companyName", "contact", "email", "phone", "productOffered", "source", "status", "notes"]) {
    if (k in d) data[k] = d[k];
  }
  if ("quotedPrice" in d) data.quotedPrice = d.quotedPrice === "" || d.quotedPrice == null ? null : Number(d.quotedPrice);
  if ("followUpDate" in d) data.followUpDate = d.followUpDate ? new Date(d.followUpDate) : null;
  return Response.json(await prisma.lead.update({ where: { id: Number(params.id) }, data }));
}

export async function DELETE(_req, { params }) {
  await prisma.lead.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
