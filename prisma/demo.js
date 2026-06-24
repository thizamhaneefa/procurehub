/* OPTIONAL demo data loader: `npm run db:demo`.
   Skips if suppliers already exist. Does not touch user accounts or company settings. */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

let _s = 987654321;
const rnd = () => ((_s = (_s * 16807) % 2147483647) - 1) / 2147483646;
const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const round2 = (n) => Math.round(n * 100) / 100;

const NOW = new Date();
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);
const daysFrom = (date, d) => new Date(new Date(date).getTime() + d * 86400000);
const monthsAgo = (m, day) =>
  new Date(NOW.getFullYear(), NOW.getMonth() - m, day || ri(2, 26), ri(8, 17), ri(0, 59));

async function main() {
  if ((await prisma.supplier.count()) > 0) {
    console.log("Suppliers already exist - demo loader skipped. (Clear data first to reload.)");
    return;
  }
  console.log("Loading ProcureHub demo data...");

  const categories = ["Electrical", "Packaging", "Raw Materials", "Safety Equipment", "Office Supplies"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ---------- Suppliers (15) ----------
  const supplierData = [
    ["Emirates Industrial Supplies LLC", "Khalid Al Mansoori", "UAE", "Dubai", "Electrical", "Net 30", 5],
    ["Gulf Pack Trading FZE", "Fatima Al Zaabi", "UAE", "Sharjah", "Packaging", "Net 45", 4],
    ["Al Noor Safety Equipment", "Omar Haddad", "UAE", "Abu Dhabi", "Safety Equipment", "Net 30", 4],
    ["Dubai Office World", "Priya Nair", "UAE", "Dubai", "Office Supplies", "Net 15", 3],
    ["Shenzhen BrightVolt Electronics", "Li Wei", "China", "Shenzhen", "Electrical", "30% Advance, 70% B/L", 4],
    ["Guangzhou PackPro Co. Ltd", "Chen Yong", "China", "Guangzhou", "Packaging", "T/T 30 Days", 5],
    ["Ningbo RawMat Industries", "Zhang Min", "China", "Ningbo", "Raw Materials", "LC at Sight", 3],
    ["Shanghai SafeGuard Mfg", "Wang Fang", "China", "Shanghai", "Safety Equipment", "T/T 30 Days", 4],
    ["Mumbai Polymers Pvt Ltd", "Rajesh Sharma", "India", "Mumbai", "Raw Materials", "Net 60", 4],
    ["Chennai Cable Corp", "Arun Krishnan", "India", "Chennai", "Electrical", "Net 45", 3],
    ["Delhi Print & Pack", "Sunita Verma", "India", "New Delhi", "Packaging", "Net 30", 4],
    ["Bangalore OfficeMart", "Vikram Rao", "India", "Bengaluru", "Office Supplies", "Net 30", 3],
    ["Mueller Industrietechnik GmbH", "Stefan Mueller", "Germany", "Stuttgart", "Electrical", "Net 30", 5],
    ["Rheinland Chemie AG", "Anna Fischer", "Germany", "Cologne", "Raw Materials", "Net 60", 5],
    ["Hamburg Safety Systems", "Jonas Weber", "Germany", "Hamburg", "Safety Equipment", "Net 45", 4],
  ];
  const phonePrefix = { UAE: "+971 4", China: "+86 21", India: "+91 22", Germany: "+49 711" };
  const suppliers = [];
  for (let i = 0; i < supplierData.length; i++) {
    const [name, contactPerson, country, city, category, paymentTerms, rating] = supplierData[i];
    const domain = name.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 14);
    suppliers.push(
      await prisma.supplier.create({
        data: {
          name, contactPerson, country, city, category, paymentTerms, rating,
          email: `${contactPerson.toLowerCase().split(" ")[0]}@${domain}.com`,
          phone: `${phonePrefix[country]} ${ri(200, 899)} ${ri(1000, 9999)}`,
          status: i === 11 ? "Inactive" : "Active",
          createdAt: monthsAgo(ri(6, 14)),
        },
      })
    );
  }
  const suppliersByCat = (cat) => suppliers.filter((s) => s.category === cat);

  // ---------- Products (40) ----------
  const productDefs = {
    Electrical: [
      ["Copper Cable 2.5mm (100m)", "Roll", 185], ["LED Floodlight 100W", "Pcs", 145],
      ["MCB Circuit Breaker 32A", "Pcs", 48], ["Cable Tray 200mm (3m)", "Length", 95],
      ["Contactor 3-Pole 40A", "Pcs", 210], ["PVC Conduit 25mm (3m)", "Length", 14],
      ["Distribution Board 12-Way", "Pcs", 420], ["Industrial Plug & Socket 32A", "Set", 88],
    ],
    Packaging: [
      ["Stretch Film Roll 500mm", "Roll", 42], ["Carton Box 60x40x40", "Pcs", 6.5],
      ["Bubble Wrap Roll 1m x 100m", "Roll", 95], ["Plastic Pallet 1200x1000", "Pcs", 165],
      ["PP Strapping Roll 12mm", "Roll", 58], ["Clear Tape 48mm (Pack of 36)", "Pack", 72],
      ["Foam Sheet 5mm (2x1m)", "Sheet", 18], ["Woven Sack 50kg (Bundle of 100)", "Bundle", 140],
    ],
    "Raw Materials": [
      ["HDPE Granules (25kg Bag)", "Bag", 132], ["Caustic Soda Flakes (25kg)", "Bag", 88],
      ["Aluminium Sheet 2mm (1x2m)", "Sheet", 240], ["Mild Steel Rod 12mm (6m)", "Pcs", 65],
      ["Calcium Carbonate Powder (25kg)", "Bag", 36], ["Epoxy Resin (20L Drum)", "Drum", 480],
      ["Silicone Sealant (Carton of 24)", "Carton", 220], ["Industrial Salt (50kg)", "Bag", 28],
    ],
    "Safety Equipment": [
      ["Safety Helmet White", "Pcs", 24], ["Anti-Fog Safety Goggles", "Pcs", 18],
      ["Nitrile Gloves (Box of 100)", "Box", 32], ["High-Vis Vest Class 2", "Pcs", 15],
      ["Safety Shoes S3", "Pair", 145], ["Full Body Harness", "Pcs", 230],
      ["Ear Defenders 32dB", "Pcs", 45], ["First Aid Kit 50-Person", "Kit", 185],
    ],
    "Office Supplies": [
      ["A4 Copy Paper (Box of 5 Reams)", "Box", 62], ["Toner Cartridge HP 26A", "Pcs", 310],
      ["Whiteboard Markers (Pack of 12)", "Pack", 28], ["Lever Arch File A4 (Pack of 10)", "Pack", 55],
      ["Sticky Notes 76x76 (Pack of 12)", "Pack", 22], ["Ballpoint Pens Blue (Box of 50)", "Box", 35],
      ["Heavy Duty Stapler", "Pcs", 48], ["Desk Organizer Set", "Set", 65],
    ],
  };
  const skuPrefix = {
    Electrical: "ELC", Packaging: "PKG", "Raw Materials": "RAW",
    "Safety Equipment": "SAF", "Office Supplies": "OFF",
  };
  const products = [];
  for (const cat of categories) {
    const catSuppliers = suppliersByCat(cat);
    const defs = productDefs[cat];
    for (let i = 0; i < defs.length; i++) {
      const [name, unit, base] = defs[i];
      const unitCost = round2(base * (0.9 + rnd() * 0.2));
      products.push(
        await prisma.product.create({
          data: {
            sku: `${skuPrefix[cat]}-${String(i + 1).padStart(3, "0")}`,
            name, category: cat, unit,
            supplierId: catSuppliers[i % catSuppliers.length].id,
            unitCost,
            lastPurchasePrice: round2(unitCost * (0.96 + rnd() * 0.14)),
            reorderLevel: ri(10, 50),
            status: "Active",
          },
        })
      );
    }
  }
  const productsOf = (supplierId) => products.filter((p) => p.supplierId === supplierId);

  // ---------- Leads (8) ----------
  const leadData = [
    ["Hangzhou EcoPack Solutions", "Lucy Zhao", "Biodegradable packaging film", 38.5, "Exhibition", "New", "Met at Gulfood Manufacturing. Competitive pricing on bio-film.", 3],
    ["Pune Wire Industries", "Anil Deshmukh", "Armoured copper cable", 172.0, "Email", "Contacted", "Sent company profile, awaiting catalogue.", 5],
    ["Jebel Ali Plastics FZCO", "Hassan Khoury", "HDPE & LDPE granules", 124.0, "Referral", "Quotation Received", "Quote 6% below current supplier. Verify material certs.", 7],
    ["Foshan SafetyPro Co.", "Tony Lin", "Safety shoes & PPE range", 98.0, "Website", "Quotation Received", "MOQ 500 pairs. Asked for size-run breakdown.", 4],
    ["Berlin LabTech GmbH", "Klara Schmidt", "Industrial adhesives", 410.0, "Exhibition", "Sample Requested", "Samples dispatched via DHL, ETA next week.", 10],
    ["Ajman Carton Factory", "Mohammed Saleh", "Custom printed cartons", 5.8, "Referral", "Sample Requested", "Print proof approved. Awaiting sample batch.", 6],
    ["Xiamen VoltEdge Ltd", "Jenny Wu", "LED industrial lighting", 118.0, "Email", "Approved", "Approved by management. Ready to convert to supplier.", 2],
    ["Karachi Textile Traders", "Imran Qureshi", "Cotton rags & wipers", 12.0, "Website", "Rejected", "Failed quality inspection on sample lot.", null],
  ];
  for (const [companyName, contact, productOffered, quotedPrice, source, status, notes, fu] of leadData) {
    await prisma.lead.create({
      data: {
        companyName, contact, productOffered, quotedPrice, source, status, notes,
        email: `${contact.toLowerCase().replace(/ /g, ".")}@${companyName.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 12)}.com`,
        phone: `+${ri(20, 98)} ${ri(100, 999)} ${ri(100, 999)} ${ri(1000, 9999)}`,
        followUpDate: fu ? daysFrom(NOW, fu) : null,
        createdAt: daysAgo(ri(5, 90)),
      },
    });
  }

  // ---------- Purchase Orders (12, oldest -> newest) ----------
  const poStatuses = ["Closed", "Closed", "Received", "Received", "Received", "Partially Received", "Partially Received", "Sent", "Sent", "Sent", "Draft", "Draft"];
  const pos = [];
  for (let i = 0; i < 12; i++) {
    const supplier = suppliers[(i * 5 + 2) % 15];
    const orderDate = monthsAgo(11 - i, ri(3, 22));
    let pool = productsOf(supplier.id);
    if (pool.length < 2) pool = products.filter((p) => p.category === supplier.category);
    const count = Math.min(ri(2, 4), pool.length);
    const chosen = [...pool].sort(() => rnd() - 0.5).slice(0, count);
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${orderDate.getFullYear()}-${String(i + 101).slice(-3)}`,
        supplierId: supplier.id,
        orderDate,
        expectedDelivery: daysFrom(orderDate, ri(14, 45)),
        status: poStatuses[i],
        notes: i % 3 === 0 ? "Deliver to main warehouse, Al Quoz. Working hours 8am-5pm." : null,
        items: {
          create: chosen.map((p) => ({
            productId: p.id,
            qty: ri(20, 200),
            unitPrice: p.lastPurchasePrice,
          })),
        },
      },
      include: { items: true, supplier: true },
    });
    pos.push(po);
  }
  const poTotal = (po) => round2(po.items.reduce((s, it) => s + it.qty * it.unitPrice, 0));

  // ---------- Receipts / GRNs (15) ----------
  const receivers = ["Ahmed Hassan", "Maria Santos", "John Pinto"];
  const receiptEvents = [];
  let grnSeq = 1;
  const receivable = pos.filter((po) => ["Partially Received", "Received", "Closed"].includes(po.status));
  const receipts = [];
  for (const po of receivable) {
    const partial = po.status === "Partially Received";
    const splits = partial ? 1 : 2;
    for (let s = 0; s < splits; s++) {
      const date = daysFrom(po.expectedDelivery, ri(-8, 1) + s * 2); // mostly on time, some late
      const itemRows = po.items.map((it) => {
        const full = Math.ceil(it.qty / splits);
        const qty = partial ? Math.ceil(it.qty * 0.5) : (s === splits - 1 ? it.qty - full : full);
        return { productId: it.productId, qty: Math.max(qty, 1) };
      }).filter((r) => r.qty > 0);
      const receiptNo = `GRN-${date.getFullYear()}-${String(grnSeq++).padStart(3, "0")}`;
      const rec = await prisma.receipt.create({
        data: {
          receiptNo, date, supplierId: po.supplierId, poId: po.id,
          receivedBy: pick(receivers),
          items: { create: itemRows },
        },
      });
      receipts.push(rec);
      for (const r of itemRows) receiptEvents.push({ productId: r.productId, qty: r.qty, date, ref: receiptNo });
    }
  }
  for (let i = 0; i < 3; i++) {
    const supplier = suppliers[(i * 4 + 1) % 15];
    let pool = productsOf(supplier.id);
    if (!pool.length) pool = products;
    const date = daysAgo(ri(4, 40));
    const itemRows = [...pool].sort(() => rnd() - 0.5).slice(0, 2).map((p) => ({ productId: p.id, qty: ri(10, 60) }));
    const receiptNo = `GRN-${date.getFullYear()}-${String(grnSeq++).padStart(3, "0")}`;
    const rec = await prisma.receipt.create({
      data: { receiptNo, date, supplierId: supplier.id, receivedBy: pick(receivers), items: { create: itemRows } },
    });
    receipts.push(rec);
    for (const r of itemRows) receiptEvents.push({ productId: r.productId, qty: r.qty, date, ref: receiptNo });
  }

  // ---------- Stock movements with running balance ----------
  const events = [];
  for (const p of products) {
    events.push({ productId: p.id, type: "IN", qty: ri(p.reorderLevel * 2, p.reorderLevel * 4), date: monthsAgo(11, ri(1, 5)), ref: "Opening Stock" });
  }
  for (const e of receiptEvents) {
    events.push({ productId: e.productId, type: "IN", qty: e.qty, date: e.date, ref: e.ref });
  }
  for (let i = 0; i < 45; i++) {
    const p = pick(products);
    events.push({ productId: p.id, type: "OUT", qty: ri(5, 40), date: daysAgo(ri(2, 300)), ref: `ISS-${String(1000 + i)}` });
  }
  const lowStockTargets = [products[3], products[9], products[14], products[22], products[28], products[35]];

  const byProduct = {};
  for (const e of events) (byProduct[e.productId] ||= []).push(e);
  for (const p of products) {
    const list = (byProduct[p.id] || []).sort((a, b) => a.date - b.date);
    let bal = 0;
    for (const e of list) {
      if (e.type === "OUT") e.qty = Math.min(e.qty, bal);
      if (e.qty <= 0) continue;
      bal += e.type === "IN" ? e.qty : -e.qty;
      await prisma.stockMovement.create({
        data: { productId: p.id, type: e.type, date: e.date, reference: e.ref, quantity: e.qty, balanceAfter: bal },
      });
    }
    if (lowStockTargets.includes(p)) {
      const target = Math.max(Math.floor(p.reorderLevel * 0.5), 2);
      if (bal > target) {
        const out = bal - target;
        bal = target;
        await prisma.stockMovement.create({
          data: { productId: p.id, type: "OUT", date: daysAgo(1), reference: "ISS-URGENT", quantity: out, balanceAfter: bal },
        });
      }
    }
    await prisma.product.update({ where: { id: p.id }, data: { stockQty: bal } });
  }

  // ---------- Invoices (20 + fillers) ----------
  let invSeq = 1;
  const mkInvoiceNo = (d) => `INV-${d.getFullYear()}-${String(invSeq++).padStart(4, "0")}`;
  const termDays = (terms) => (terms.includes("60") ? 60 : terms.includes("45") ? 45 : terms.includes("15") ? 15 : 30);

  const linked = pos.filter((po) => po.status !== "Draft");
  for (const po of linked) {
    const invoiceDate = daysFrom(po.orderDate, ri(10, 28));
    const dueDate = daysFrom(invoiceDate, termDays(po.supplier.paymentTerms));
    const monthsOld = (NOW - invoiceDate) / (30 * 86400000);
    let status;
    if (monthsOld > 4) status = "Paid";
    else if (dueDate < NOW) status = rnd() < 0.4 ? "Paid" : "Pending";
    else status = pick(["Pending", "Approved", "Approved", "Paid"]);
    await prisma.invoice.create({
      data: {
        invoiceNo: mkInvoiceNo(invoiceDate),
        supplierId: po.supplierId, poId: po.id,
        invoiceDate, dueDate, amount: poTotal(po), currency: "AED", status,
      },
    });
  }
  const standaloneMonths = [11, 9, 7, 5, 3, 2, 1, 1, 0, 0];
  for (let i = 0; i < standaloneMonths.length; i++) {
    const m = standaloneMonths[i];
    const supplier = suppliers[(i * 3 + 4) % 15];
    const invoiceDate = monthsAgo(m, ri(2, 24));
    const dueDate = daysFrom(invoiceDate, termDays(supplier.paymentTerms));
    let status;
    if (m >= 4) status = "Paid";
    else if (m === 0) status = i === 8 ? "Paid" : pick(["Pending", "Approved"]);
    else status = pick(["Pending", "Approved", "Pending"]);
    if (i === 4) status = "Pending";
    await prisma.invoice.create({
      data: {
        invoiceNo: mkInvoiceNo(invoiceDate),
        supplierId: supplier.id,
        invoiceDate, dueDate,
        amount: round2(ri(6000, 85000) + rnd()),
        currency: "AED", status,
      },
    });
  }

  // Fill pass: every month + category has spend so charts look populated
  const allInv = await prisma.invoice.findMany({ include: { supplier: true } });
  const haveMonth = new Set(allInv.map((i) => { const d = new Date(i.invoiceDate); return `${d.getFullYear()}-${d.getMonth()}`; }));
  const haveCat = new Set(allInv.map((i) => i.supplier.category));
  const fillers = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
    if (!haveMonth.has(`${d.getFullYear()}-${d.getMonth()}`)) fillers.push({ m, supplier: suppliers[(m * 7 + 3) % 15] });
  }
  for (const c of categories) {
    if (!haveCat.has(c)) fillers.push({ m: ri(1, 3), supplier: suppliersByCat(c)[0] });
  }
  for (const f of fillers) {
    const invoiceDate = monthsAgo(f.m, ri(3, 22));
    await prisma.invoice.create({
      data: {
        invoiceNo: mkInvoiceNo(invoiceDate),
        supplierId: f.supplier.id,
        invoiceDate,
        dueDate: daysFrom(invoiceDate, termDays(f.supplier.paymentTerms)),
        amount: round2(ri(8000, 55000) + rnd()),
        currency: "AED",
        status: "Paid",
      },
    });
  }

  // ---------- Activity feed ----------
  const acts = [
    ["invoice", "Invoice marked as Paid - Emirates Industrial Supplies LLC", 0.2],
    ["receipt", "GRN posted: goods received from Gulf Pack Trading FZE", 0.6],
    ["po", "Purchase order sent to Mueller Industrietechnik GmbH", 1.1],
    ["stock", "Low stock alert: LED Floodlight 100W below reorder level", 1.4],
    ["lead", "New lead added: Hangzhou EcoPack Solutions (Exhibition)", 2.0],
    ["invoice", "New vendor invoice recorded - Rheinland Chemie AG", 2.6],
    ["po", "PO partially received - Shanghai SafeGuard Mfg", 3.2],
    ["supplier", "Supplier rating updated: Guangzhou PackPro Co. Ltd -> 5 stars", 4.0],
    ["receipt", "GRN posted: goods received from Mumbai Polymers Pvt Ltd", 4.8],
    ["lead", "Lead Xiamen VoltEdge Ltd approved for onboarding", 5.5],
    ["invoice", "Payment scheduled for Chennai Cable Corp invoice", 6.3],
    ["stock", "Stock issued to production: HDPE Granules (25kg Bag)", 7.1],
  ];
  for (const [type, message, d] of acts) {
    await prisma.activity.create({ data: { type, message, createdAt: daysAgo(d) } });
  }

  console.log("Demo data loaded:");
  console.log(`  Suppliers: ${suppliers.length}, Products: ${products.length}, Leads: ${leadData.length}`);
  console.log(`  POs: ${pos.length}, Receipts: ${receipts.length}, Invoices: ${invSeq - 1}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
