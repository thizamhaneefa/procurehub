export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return Response.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req) {
  const { name } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });
  try {
    return Response.json(await prisma.category.create({ data: { name: name.trim() } }));
  } catch {
    return Response.json({ error: "Category already exists" }, { status: 400 });
  }
}
