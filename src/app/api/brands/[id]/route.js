export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function PUT(req, { params }) {
  const d = await req.json();
  if (!d.name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  try {
    const b = await prisma.brand.update({ where: { id: Number(params.id) }, data: { name: d.name.trim() } });
    return Response.json(b);
  } catch {
    return Response.json({ error: "A brand with that name already exists" }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  await prisma.brand.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
