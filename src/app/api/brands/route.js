export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { pricelists: true } } },
  });
  return Response.json(brands);
}

export async function POST(req) {
  const d = await req.json();
  if (!d.name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  try {
    const b = await prisma.brand.create({ data: { name: d.name.trim() } });
    return Response.json(b);
  } catch {
    return Response.json({ error: "A brand with that name already exists" }, { status: 400 });
  }
}
