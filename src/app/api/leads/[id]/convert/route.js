export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function POST(req, { params }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const supplier = await prisma.supplier.create({
    data: {
      name: lead.companyName,
      contactPerson: lead.contact,
      email: lead.email || "",
      phone: lead.phone || "",
      country: body.country || "",
      city: body.city || "",
      category: body.category || "General",
      paymentTerms: body.paymentTerms || "Net 30",
      status: "Active",
      rating: 3,
    },
  });
  await prisma.lead.update({ where: { id }, data: { status: "Approved" } });
  await prisma.activity.create({
    data: { type: "supplier", message: `Lead converted to supplier: ${lead.companyName}` },
  });
  return Response.json({ ok: true, supplier });
}
