export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return Response.json(await prisma.workNote.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(req) {
  const d = await req.json();
  if (!d.title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });
  const note = await prisma.workNote.create({
    data: {
      title: d.title.trim(),
      content: d.content || null,
      imageUrl: d.imageUrl || null,
      status: ["Pending", "In Progress", "Completed"].includes(d.status) ? d.status : "Pending",
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
    },
  });
  return Response.json(note);
}
