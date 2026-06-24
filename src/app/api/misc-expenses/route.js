export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return Response.json(await prisma.miscExpense.findMany({ orderBy: { purchaseDate: "desc" } }));
}

export async function POST(req) {
  const d = await req.json();
  if (!d.description?.trim()) return Response.json({ error: "Description is required" }, { status: 400 });
  const exp = await prisma.miscExpense.create({
    data: {
      description: d.description.trim(),
      category: d.category || "Office Supplies",
      vendor: d.vendor || null,
      amount: Number(d.amount) || 0,
      purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : new Date(),
      billUrl: d.billUrl || null,
      notes: d.notes || null,
    },
  });
  await prisma.activity.create({ data: { type: "expense", message: `Misc expense added: ${exp.description}` } });
  return Response.json(exp);
}
