export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let s = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!s) s = await prisma.setting.create({ data: { id: 1 } });
  // Never send the raw API key to the client — only whether one is set.
  const { anthropicApiKey, ...rest } = s;
  return Response.json({ ...rest, hasApiKey: !!anthropicApiKey });
}

export async function PUT(req) {
  const d = await req.json();
  const update = {};
  for (const k of ["companyName", "logoUrl", "address", "aiModel"]) {
    if (k in d) update[k] = d[k];
  }
  // Only overwrite the key when a non-empty value is provided; "" clears it.
  if ("anthropicApiKey" in d) {
    update.anthropicApiKey = d.anthropicApiKey ? d.anthropicApiKey.trim() : null;
  }
  const s = await prisma.setting.upsert({
    where: { id: 1 },
    update,
    create: { id: 1, ...update },
  });
  const { anthropicApiKey, ...rest } = s;
  return Response.json({ ...rest, hasApiKey: !!anthropicApiKey });
}
