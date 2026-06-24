/* Clears stored license expiry dates so the fixed extractor re-reads them on next page load. */
(async () => {
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  const n = await p.customer.updateMany({
    where: { tradeLicenseUrl: { not: null } },
    data: { licenseExpiry: null },
  });
  console.log(`Cleared stored expiry for ${n.count} customer(s) — will re-extract on next load.`);
  await p.$disconnect();
})();
