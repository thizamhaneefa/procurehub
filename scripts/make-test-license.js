/* Generates well-formed PDFs (via pdf-lib) to test trade-license expiry extraction. */
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");

async function makePdf(lines, outPath) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  lines.forEach((l, i) => page.drawText(l, { x: 72, y: 720 - i * 20, size: 12, font }));
  fs.writeFileSync(outPath, await doc.save({ useObjectStreams: false }));
}

(async () => {
  const outDir = path.join(__dirname, "..", "public", "uploads");
  fs.mkdirSync(outDir, { recursive: true });
  await makePdf([
    "DEPARTMENT OF ECONOMIC DEVELOPMENT - DUBAI",
    "TRADE LICENSE",
    "License No: 1234567",
    "Company: Famous Flowers L.L.C",
    "Issue Date: 16/03/2025",
    "Expiry Date: 15/03/2027",
  ], path.join(outDir, "test-license-valid.pdf"));
  await makePdf([
    "DEPARTMENT OF ECONOMIC DEVELOPMENT - DUBAI",
    "TRADE LICENSE",
    "License No: 7654321",
    "Company: Old Trading Co",
    "Issue Date: 02/11/2023",
    "Expiry Date: 01/11/2024",
  ], path.join(outDir, "test-license-expired.pdf"));
  console.log("Wrote test-license-valid.pdf (expiry 15/03/2027) and test-license-expired.pdf (expiry 01/11/2024)");
})();
