export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req, { params }) {
  await prisma.category.delete({ where: { id: Number(params.id) } });
  return Response.json({ ok: true });
}
