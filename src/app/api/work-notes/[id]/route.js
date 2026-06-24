export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  const data = {};
  for (const k of ["title", "content", "imageUrl"]) if (k in d) data[k] = d[k] || null;
  if (data.title === null) delete data.title;
  if ("status" in d && ["Pending", "In Progress", "Completed"].includes(d.status)) data.status = d.status;
  if ("dueDate" in d) data.dueDate = d.dueDate ? new Date(d.dueDate) : null;
  const note = await prisma.workNote.update({ where: { id: Number(params.id) }, data });
  return Response.json(note);
}

export async function DELETE(_req, { params }) {
  await prisma.workNote.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
