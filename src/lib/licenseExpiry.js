import { downloadFile, pathFromUrl } from "./storage";

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function mkDate(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  if (y < 100) y += 2000;
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return isNaN(date) ? null : date;
}

// All date shapes we accept, day-first (UAE convention) for ambiguous numerics
function datesIn(text) {
  const found = [];
  let m;
  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy (also 2-digit year)
  const re1 = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g;
  while ((m = re1.exec(text))) {
    const d = mkDate(m[3], m[2], m[1]);
    if (d) found.push({ date: d, index: m.index });
  }
  // yyyy/mm/dd, yyyy-mm-dd
  const re2 = /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g;
  while ((m = re2.exec(text))) {
    const d = mkDate(m[1], m[2], m[3]);
    if (d) found.push({ date: d, index: m.index });
  }
  // 15 Mar 2026 / 15 March 2026 / Mar 15, 2026
  const re3 = /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]+(\d{4})/gi;
  while ((m = re3.exec(text))) {
    const d = mkDate(m[3], MONTHS[m[2].toLowerCase().slice(0, 3)], m[1]);
    if (d) found.push({ date: d, index: m.index });
  }
  const re4 = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/gi;
  while ((m = re4.exec(text))) {
    const d = mkDate(m[3], MONTHS[m[1].toLowerCase().slice(0, 3)], m[2]);
    if (d) found.push({ date: d, index: m.index });
  }
  return found;
}

const KEYWORDS = /exp\.?\s*date|expiry|expire[sd]?|expiration|valid\s*(till|until|to|thru|through)|renewal\s*date|تاريخ\s*الانتهاء/gi;

export function extractExpiryFromText(rawText) {
  const text = String(rawText || "").replace(/\s+/g, " ");
  if (!text) return null;
  const dates = datesIn(text);
  if (!dates.length) return null;

  // 1) collect ALL dates near an expiry-style keyword and take the LATEST.
  //    Bilingual (EN/AR) licenses interleave labels and values in unpredictable order,
  //    so the date right next to the keyword is often the issue/registration date —
  //    but the expiry is always the latest date in that neighbourhood.
  let best = null;
  let m;
  const kw = new RegExp(KEYWORDS.source, "gi");
  while ((m = kw.exec(text))) {
    for (const d of dates) {
      if (d.index >= m.index - 40 && d.index <= m.index + 120) {
        if (!best || d.date > best) best = d.date;
      }
    }
  }
  if (best) return best;

  // 2) fallback: latest date mentioned anywhere (issue dates always precede expiry)
  return dates.map((d) => d.date).sort((a, b) => b - a)[0];
}

export async function extractExpiryFromPdf(fileUrl) {
  try {
    if (!fileUrl) return null;
    const objectPath = pathFromUrl(fileUrl);
    if (!objectPath || !objectPath.toLowerCase().endsWith(".pdf")) return null;
    const file = await downloadFile(objectPath);
    if (!file) return null;
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(file.buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;
    let text = "";
    const pages = Math.min(doc.numPages, 5);
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      text += tc.items.map((it) => it.str).join(" ") + "\n";
    }
    await doc.destroy();
    return extractExpiryFromText(text);
  } catch {
    return null;
  }
}
