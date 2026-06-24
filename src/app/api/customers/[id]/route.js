export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { extractExpiryFromPdf } from "@/lib/licenseExpiry";

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const d = await req.json();
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const data = {};
  for (const k of ["name", "email", "phone", "address", "emiratesId", "agreementUrl", "tradeLicenseUrl", "vatRegUrl", "notes"]) {
    if (k in d) data[k] = d[k];
  }

  if ("licenseExpiry" in d && d.licenseExpiry) {
    data.licenseExpiry = new Date(d.licenseExpiry); // manual value wins
  } else {
    const newUrl = "tradeLicenseUrl" in d ? d.tradeLicenseUrl : existing.tradeLicenseUrl;
    const urlChanged = "tradeLicenseUrl" in d && d.tradeLicenseUrl !== existing.tradeLicenseUrl;
    const cleared = "licenseExpiry" in d && !d.licenseExpiry;
    if (!newUrl) {
      data.licenseExpiry = null;
    } else if (urlChanged || cleared) {
      data.licenseExpiry = await extractExpiryFromPdf(newUrl); // re-read from (new) PDF
    }
  }

  const c = await prisma.customer.update({ where: { id }, data });
  return Response.json(c);
}

export async function DELETE(_req, { params }) {
  const id = Number(params.id);
  const c = await prisma.customer.findUnique({ where: { id } });
  await prisma.customer.delete({ where: { id } });
  await prisma.activity.create({ data: { type: "customer", message: `Customer deleted: ${c?.name || id}` } });
  return Response.json({ ok: true });
}
