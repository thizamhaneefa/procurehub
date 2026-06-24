export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return Response.json(await prisma.lead.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(req) {
  const d = await req.json();
  const lead = await prisma.lead.create({
    data: {
      companyName: d.companyName, contact: d.contact || "", email: d.email || null,
      phone: d.phone || null, productOffered: d.productOffered || "",
      quotedPrice: d.quotedPrice ? Number(d.quotedPrice) : null,
      source: d.source || "Email", status: d.status || "New",
      notes: d.notes || null,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
    },
  });
  await prisma.activity.create({ data: { type: "lead", message: `New lead added: ${lead.companyName} (${lead.source})` } });
  return Response.json(lead);
}
