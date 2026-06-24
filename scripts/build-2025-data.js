/* One-time builder for the 2025 Dashboard.
   Reads the final Shopify exports, precomputes all analytics, writes src/data/sales2025.json.
   Source CSVs are copied into data-2025/ so the dashboard never depends on the Downloads folder. */
const fs = require("fs");
const path = require("path");

const PROJ = path.join(__dirname, "..");
const DATA_DIR = path.join(PROJ, "data-2025");
const SOURCES = {
  "orders.csv": "C:/Users/procu/Downloads/orders_export_1 (2).csv",
  "transactions.csv": "C:/Users/procu/Downloads/transactions_export_1.csv",
  "customers.csv": "C:/Users/procu/Downloads/customers_export (2).csv",
};

fs.mkdirSync(DATA_DIR, { recursive: true });
for (const [dest, src] of Object.entries(SOURCES)) {
  const destPath = path.join(DATA_DIR, dest);
  if (!fs.existsSync(destPath)) {
    if (!fs.existsSync(src)) { console.error(`Missing source file: ${src}`); process.exit(1); }
    fs.copyFileSync(src, destPath);
    console.log(`Copied ${src} -> data-2025/${dest}`);
  }
}

function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur.replace(/\r$/, "")); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || row.some((x) => x !== "")) { row.push(cur); rows.push(row); }
  return rows;
}
const load = (file) => {
  const rows = parseCSV(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { idx, rows: rows.slice(1).filter((r) => r.length > 3) };
};
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const r2 = (n) => Math.round(n * 100) / 100;
const clean = (s) => String(s || "").replace(/^'+/, "").trim();

// ---------- Orders ----------
const O = load("orders.csv");
const oi = O.idx;
const ordersMap = new Map(); // name -> order
for (const r of O.rows) {
  const name = r[oi["Name"]];
  if (!name) continue;
  if (r[oi["Total"]] !== "") {
    ordersMap.set(name, {
      name,
      createdAt: r[oi["Created at"]] || "",
      total: num(r[oi["Total"]]),
      subtotal: num(r[oi["Subtotal"]]),
      shipping: num(r[oi["Shipping"]]),
      taxes: num(r[oi["Taxes"]]),
      discount: num(r[oi["Discount Amount"]]),
      refunded: num(r[oi["Refunded Amount"]]),
      financial: r[oi["Financial Status"]] || "unknown",
      fulfillment: r[oi["Fulfillment Status"]] || "unfulfilled",
      payment: r[oi["Payment Method"]] || "",
      source: r[oi["Source"]] || "other",
      email: clean(r[oi["Email"]]).toLowerCase(),
      phone: clean(r[oi["Phone"]] || r[oi["Billing Phone"]]),
      billingName: clean(r[oi["Billing Name"]]),
      cancelled: !!r[oi["Cancelled at"]],
      items: [],
    });
  }
}
for (const r of O.rows) {
  const o = ordersMap.get(r[oi["Name"]]);
  if (!o) continue;
  const itemName = r[oi["Lineitem name"]];
  if (!itemName) continue;
  o.items.push({
    name: itemName,
    sku: r[oi["Lineitem sku"]] || "",
    qty: num(r[oi["Lineitem quantity"]]),
    price: num(r[oi["Lineitem price"]]),
  });
}
const allOrders = [...ordersMap.values()].filter((o) => o.createdAt);
// exclude voided + cancelled orders from sales analytics
const orders = allOrders.filter((o) => o.financial !== "voided" && !o.cancelled);

const dpart = (o) => ({
  y: o.createdAt.slice(0, 4),
  ym: o.createdAt.slice(0, 7),
  hour: Number(o.createdAt.slice(11, 13)),
  weekday: new Date(Number(o.createdAt.slice(0, 4)), Number(o.createdAt.slice(5, 7)) - 1, Number(o.createdAt.slice(8, 10))).getDay(),
});
const custKey = (o) => o.email || o.phone || (o.billingName ? `name:${o.billingName.toLowerCase()}` : "");

// first-ever order date per customer (for new vs returning)
const firstOrder = new Map();
for (const o of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
  const k = custKey(o);
  if (k && !firstOrder.has(k)) firstOrder.set(k, o.createdAt);
}

function payBucket(pm) {
  const s = (pm || "").toLowerCase();
  if (!s) return "Other / Unspecified";
  if (s.includes("+")) return "Split Payment";
  if (s.includes("stripe")) return "Card — Online (Stripe)";
  if (s.includes("network")) return "Card — POS Terminal";
  if (s.includes("custom")) return "Card — POS Terminal";
  if (s.includes("cash on delivery") || s.includes("cod")) return "Cash on Delivery";
  if (s.includes("cash")) return "Cash";
  if (s.includes("bank")) return "Bank Transfer / Deposit";
  if (s.includes("manual")) return "Manual / Other";
  return "Other / Unspecified";
}
const sourceLabel = { pos: "In-Store (POS)", web: "Online Store", shopify_draft_order: "Draft / Invoice", iphone: "POS App (iPhone)" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// customers export (for names/emails lookup + customers tab)
const C = load("customers.csv");
const ci = C.idx;
const customerDir = new Map(); // email/phone -> display name
const customersList = [];
for (const r of C.rows) {
  const first = clean(r[ci["First Name"]]), last = clean(r[ci["Last Name"]]);
  const nameC = `${first} ${last}`.trim() || "(no name)";
  const email = clean(r[ci["Email"]]).toLowerCase();
  const phone = clean(r[ci["Phone"]] || r[ci["Default Address Phone"]]);
  if (email) customerDir.set(email, nameC);
  if (phone) customerDir.set(phone, nameC);
  customersList.push({
    name: nameC, email, phone,
    city: clean(r[ci["Default Address City"]]),
    spent: r2(num(r[ci["Total Spent"]])),
    orders: Math.round(num(r[ci["Total Orders"]])),
  });
}

function aggregate(subset, prevSubset) {
  const net = (o) => o.total - o.refunded;
  const revenue = subset.reduce((s, o) => s + net(o), 0);
  const gross = subset.reduce((s, o) => s + o.total, 0);
  const refunds = subset.reduce((s, o) => s + o.refunded, 0);
  const itemsSold = subset.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const custSet = new Set(subset.map(custKey).filter(Boolean));
  const orderCountByCust = {};
  subset.forEach((o) => { const k = custKey(o); if (k) orderCountByCust[k] = (orderCountByCust[k] || 0) + 1; });
  const repeatCust = Object.values(orderCountByCust).filter((c) => c > 1).length;

  // monthly series
  const mmap = new Map();
  for (const o of subset) {
    const { ym } = dpart(o);
    if (!mmap.has(ym)) mmap.set(ym, { ym, revenue: 0, gross: 0, refunds: 0, orders: 0, items: 0, newCustomers: 0, seen: new Set() });
    const m = mmap.get(ym);
    m.revenue += net(o); m.gross += o.total; m.refunds += o.refunded; m.orders += 1;
    m.items += o.items.reduce((a, i) => a + i.qty, 0);
    const k = custKey(o);
    // "new" = this month is the customer's first-ever purchase month
    if (k && firstOrder.get(k)?.slice(0, 7) === o.createdAt.slice(0, 7) && !m.seen.has(k)) {
      m.newCustomers += 1; m.seen.add(k);
    }
  }
  const monthly = [...mmap.values()].sort((a, b) => a.ym.localeCompare(b.ym)).map((m, i, arr) => ({
    month: `${MONTHS[Number(m.ym.slice(5, 7)) - 1]} ${m.ym.slice(2, 4)}`,
    ym: m.ym,
    revenue: r2(m.revenue), gross: r2(m.gross), refunds: r2(m.refunds),
    orders: m.orders, items: m.items,
    aov: m.orders ? r2(m.revenue / m.orders) : 0,
    growth: i > 0 && arr[i - 1].revenue > 0 ? r2(((m.revenue - arr[i - 1].revenue) / arr[i - 1].revenue) * 100) : null,
    newCustomers: m.newCustomers,
  }));

  // products
  const pmapAgg = new Map();
  for (const o of subset) for (const it of o.items) {
    if (!pmapAgg.has(it.name)) pmapAgg.set(it.name, { name: it.name, sku: it.sku, qty: 0, revenue: 0, orders: 0 });
    const p = pmapAgg.get(it.name);
    p.qty += it.qty; p.revenue += it.qty * it.price; p.orders += 1;
  }
  const products = [...pmapAgg.values()].sort((a, b) => b.revenue - a.revenue);
  const itemRevTotal = products.reduce((s, p) => s + p.revenue, 0);
  const topProducts = products.slice(0, 100).map((p) => ({
    ...p, revenue: r2(p.revenue),
    avgPrice: p.qty ? r2(p.revenue / p.qty) : 0,
    share: itemRevTotal ? r2((p.revenue / itemRevTotal) * 100) : 0,
  }));
  const productPie = [
    ...products.slice(0, 7).map((p) => ({ name: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name, value: r2(p.revenue) })),
    { name: "Others", value: r2(products.slice(7).reduce((s, p) => s + p.revenue, 0)) },
  ].filter((x) => x.value > 0);

  // top customers (from orders, named ones only)
  const cmapAgg = new Map();
  for (const o of subset) {
    const k = custKey(o);
    if (!k) continue;
    if (!cmapAgg.has(k)) {
      cmapAgg.set(k, {
        name: customerDir.get(o.email) || customerDir.get(o.phone) || o.billingName || o.email || o.phone,
        contact: o.email || o.phone || "—",
        orders: 0, spend: 0, items: 0,
      });
    }
    const c = cmapAgg.get(k);
    c.orders += 1; c.spend += net(o); c.items += o.items.reduce((a, i) => a + i.qty, 0);
  }
  const topCustomers = [...cmapAgg.values()].sort((a, b) => b.spend - a.spend).slice(0, 50)
    .map((c) => ({ ...c, spend: r2(c.spend), aov: c.orders ? r2(c.spend / c.orders) : 0 }));

  // payment / source / weekday / hourly mixes
  const pmix = {}, smix = {}, wd = Array(7).fill(0).map((_, i) => ({ day: WEEKDAYS[i].slice(0, 3), orders: 0, revenue: 0 })), hr = {};
  for (const o of subset) {
    const pb = payBucket(o.payment);
    pmix[pb] = (pmix[pb] || 0) + net(o);
    const sl = sourceLabel[o.source] || "Other";
    smix[sl] = (smix[sl] || 0) + 1;
    const { weekday, hour } = dpart(o);
    wd[weekday].orders += 1; wd[weekday].revenue += net(o);
    hr[hour] = (hr[hour] || 0) + 1;
  }
  const paymentPie = Object.entries(pmix).map(([name, value]) => ({ name, value: r2(value) })).sort((a, b) => b.value - a.value);
  const sourcePie = Object.entries(smix).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, orders: hr[h] || 0 })).filter((x, i) => i >= 8 && i <= 23);
  const weekday = wd.map((w) => ({ ...w, revenue: r2(w.revenue) }));

  // financial status breakdown (uses ALL orders incl. voided for honesty)
  const finmix = {};
  for (const o of subset) finmix[o.financial] = (finmix[o.financial] || 0) + 1;

  const prevRevenue = prevSubset ? prevSubset.reduce((s, o) => s + net(o), 0) : null;
  const prevOrders = prevSubset ? prevSubset.length : null;
  return {
    kpis: {
      revenue: r2(revenue), gross: r2(gross), refunds: r2(refunds),
      orders: subset.length, itemsSold,
      aov: subset.length ? r2(revenue / subset.length) : 0,
      customers: custSet.size, repeatCustomers: repeatCust,
      repeatRate: custSet.size ? r2((repeatCust / custSet.size) * 100) : 0,
      revenueGrowth: prevRevenue > 0 ? r2(((revenue - prevRevenue) / prevRevenue) * 100) : null,
      ordersGrowth: prevOrders > 0 ? r2(((subset.length - prevOrders) / prevOrders) * 100) : null,
    },
    monthly, topProducts, productPie, topCustomers, paymentPie, sourcePie, weekday, hourly,
    financialMix: Object.entries(finmix).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  };
}

const years = [...new Set(orders.map((o) => dpart(o).y))].sort();
const byYear = { All: aggregate(orders, null) };
for (const y of years) {
  const subset = orders.filter((o) => dpart(o).y === y);
  const prev = orders.filter((o) => dpart(o).y === String(Number(y) - 1));
  byYear[y] = aggregate(subset, prev.length ? prev : null);
}

// ---------- Transactions summary ----------
const T = load("transactions.csv");
const ti = T.idx;
const txn = { kinds: {}, gateways: {}, failures: 0, refundsCount: 0, refundsAmount: 0 };
for (const r of T.rows) {
  const kind = r[ti["Kind"]], status = r[ti["Status"]], amt = num(r[ti["Amount"]]);
  txn.kinds[`${kind} (${status})`] = (txn.kinds[`${kind} (${status})`] || 0) + 1;
  if (status === "failure") txn.failures += 1;
  if (kind === "refund" && status === "success") { txn.refundsCount += 1; txn.refundsAmount += amt; }
  if (status === "success" && (kind === "sale" || kind === "capture")) {
    const g = r[ti["Gateway"]] || "unknown";
    txn.gateways[g] = (txn.gateways[g] || { count: 0, amount: 0 });
    txn.gateways[g].count += 1; txn.gateways[g].amount += amt;
  }
}
const transactions = {
  total: T.rows.length,
  failures: txn.failures,
  refundsCount: txn.refundsCount,
  refundsAmount: r2(txn.refundsAmount),
  kinds: Object.entries(txn.kinds).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  gateways: Object.entries(txn.gateways).map(([name, v]) => ({ name, count: v.count, amount: r2(v.amount) })).sort((a, b) => b.amount - a.amount),
};

// ---------- Customers tab ----------
const customers = {
  total: customersList.length,
  withOrders: customersList.filter((c) => c.orders > 0).length,
  list: customersList.filter((c) => c.orders > 0).sort((a, b) => b.spent - a.spent).slice(0, 300),
};

const out = {
  generatedAt: new Date().toISOString(),
  currency: "AED",
  dateRange: { from: orders.map((o) => o.createdAt).sort()[0]?.slice(0, 10), to: orders.map((o) => o.createdAt).sort().at(-1)?.slice(0, 10) },
  excluded: { voided: allOrders.filter((o) => o.financial === "voided").length, cancelled: allOrders.filter((o) => o.cancelled && o.financial !== "voided").length },
  years: ["All", ...years],
  byYear, transactions, customers,
};

const outPath = path.join(PROJ, "src", "data", "sales2025.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
console.log(`Years: ${years.join(", ")} | Orders analysed: ${orders.length} (excluded ${out.excluded.voided} voided, ${out.excluded.cancelled} cancelled)`);
