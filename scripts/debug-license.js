(async () => {
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  const c = await p.customer.findFirst({ where: { name: { contains: "FAMOUS" } } });
  console.log("file:", c.tradeLicenseUrl, "| stored expiry:", c.licenseExpiry);
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const fs = require("fs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync("public" + c.tradeLicenseUrl)), useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    text += tc.items.map((x) => x.str).join(" ") + "\n";
  }
  await p.$disconnect();
  const t = text.replace(/\s+/g, " ");
  const re = /(expir|valid|renewal|issue)/gi;
  let m;
  while ((m = re.exec(t))) {
    console.log("CTX:", JSON.stringify(t.slice(Math.max(0, m.index - 70), m.index + 90)));
  }
  console.log("ALL DATES:", t.match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g));
})();
