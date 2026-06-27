export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  const list = await prisma.supplierPricelist.findMany({
    where: { supplierId: Number(params.id) },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(list);
}

export async function POST(req, { params }) {
  const d = await req.json();
  if (!d.fileUrl || !d.fileName) return Response.json({ error: "Missing file" }, { status: 400 });
  const pl = await prisma.supplierPricelist.create({
    data: {
      supplierId: Number(params.id),
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileType: d.fileType || "",
    },
  });
  return Response.json(pl);
}
