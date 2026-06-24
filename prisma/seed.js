/* Essentials-only seed: admin user, company settings row, default categories.
   No sample/demo data. Run `npm run db:demo` to load realistic demo data. */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  if ((await prisma.user.count()) === 0) {
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: bcrypt.hashSync("admin123", 10),
        name: "Administrator",
      },
    });
    console.log("Created admin user (admin / admin123)");
  }

  if (!(await prisma.setting.findUnique({ where: { id: 1 } }))) {
    await prisma.setting.create({
      data: { id: 1, companyName: "ProcureHub", currency: "AED" },
    });
    console.log("Created default company settings");
  }

  const categories = ["Electrical", "Packaging", "Raw Materials", "Safety Equipment", "Office Supplies"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
