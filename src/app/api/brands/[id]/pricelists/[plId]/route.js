export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { removeFile, pathFromUrl } from "@/lib/storage";

export async function DELETE(_req, { params }) {
  const pl = await prisma.brandPricelist.findUnique({ where: { id: Number(params.plId) } });
  if (pl) {
    await removeFile(pathFromUrl(pl.fileUrl));
    await prisma.brandPricelist.delete({ where: { id: pl.id } });
  }
  return Response.json({ ok: true });
}
