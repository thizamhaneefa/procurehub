export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { extractExpiryFromPdf } from "@/lib/licenseExpiry";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  // lazy backfill: read expiry from any trade license PDF that hasn't been parsed yet
  for (const c of customers) {
    if (c.tradeLicenseUrl && !c.licenseExpiry) {
      const expiry = await extractExpiryFromPdf(c.tradeLicenseUrl);
      if (expiry) {
        await prisma.customer.update({ where: { id: c.id }, data: { licenseExpiry: expiry } });
        c.licenseExpiry = expiry;
      }
    }
  }
  return Response.json(customers);
}

export async function POST(req) {
  const d = await req.json();
  if (!d.name?.trim()) return Response.json({ error: "Customer name is required" }, { status: 400 });

  let licenseExpiry = d.licenseExpiry ? new Date(d.licenseExpiry) : null;
  if (!licenseExpiry && d.tradeLicenseUrl) {
    licenseExpiry = await extractExpiryFromPdf(d.tradeLicenseUrl);
  }

  const c = await prisma.customer.create({
    data: {
      name: d.name.trim(),
      email: d.email || "",
      phone: d.phone || "",
      address: d.address || "",
      emiratesId: d.emiratesId || "",
      agreementUrl: d.agreementUrl || null,
      tradeLicenseUrl: d.tradeLicenseUrl || null,
      vatRegUrl: d.vatRegUrl || null,
      licenseExpiry,
      notes: d.notes || null,
    },
  });
  await prisma.activity.create({ data: { type: "customer", message: `Customer added: ${c.name}` } });
  return Response.json(c);
}
