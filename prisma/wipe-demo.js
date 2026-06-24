/* Removes all transactional/sample data. Keeps: admin user, settings (company profile), categories. */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  await p.activity.deleteMany();
  await p.receipt.deleteMany(); // cascades receipt items
  await p.invoice.deleteMany();
  await p.purchaseOrder.deleteMany(); // cascades PO items
  await p.stockMovement.deleteMany();
  await p.product.deleteMany();
  await p.lead.deleteMany();
  await p.supplier.deleteMany();
  console.log("Sample data cleared. Kept: user, settings, categories.");
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
