/* Builds the Email Marketing dataset from the final 2025 exports.
   Categorizes products, profiles each customer by category affinity, and builds
   targeted segments prioritized by spend. Writes src/data/marketing2025.json. */
const fs = require("fs");
const path = require("path");

const PROJ = path.join(__dirname, "..");
const DATA_DIR = path.join(PROJ, "data-2025");

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
  const idx = Object.fromEntries(rows[0].map((h, i) => [h, i]));
  return { idx, rows: rows.slice(1).filter((r) => r.length > 3) };
};
const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; };
const r2 = (n) => Math.round(n * 100) / 100;
const clean = (s) => String(s || "").replace(/^'+/, "").trim();

// ---------- Category rules (first match wins) ----------
const CATEGORY_RULES = [
  ["Lighting", /\b(wrgb|chihiros|led|light|lamp|lumi|par\b|fluval plant)\b/i],
  ["Filtration & Equipment", /\b(filter|canister|pump|co2|diffuser|regulator|skimmer|powerhead|wave ?maker|heater|chiller|sponge|media|uv\b|air ?stone|aerator|inline|reactor)\b/i],
  ["Tanks & Aquariums", /\b(tank|aquarium|cube|rimless|cabinet|nano|aquascap|glass tank)\b/i],
  ["Aquatic Plants", /\b(plant|anubias|bucephalandra|buce\b|moss|rotala|ludwigia|cryptocoryne|crypt\b|java fern|vallisneria|echinodorus|monte carlo|tissue culture|stem|carpet|hairgrass|hygrophila|alternanthera)\b/i],
  ["Fish Food & Care", /\b(food|essential|feed|pellet|flake|wafer|bloodworm|brine|tropical|spirulina|granule|tropic)\b/i],
  ["Substrate & Décor", /\b(soil|substrate|sand|gravel|aquasoil|stone|rock|seiryu|dragon stone|wood|driftwood|spider wood|decor|ornament|background|lava)\b/i],
  ["Water Treatment", /\b(conditioner|treatment|bacteria|remover|buffer|fertili|fert\b|supplement|dechlor|stability|prime|root tab|gh\b|kh\b|api\b|seachem)\b/i],
  ["Accessories & Tools", /\b(tweezer|scissor|net\b|tubing|hose|brush|scraper|thermometer|test kit|magnet|clip|holder|tool|glassware|lily pipe|outflow|inflow)\b/i],
  ["Livestock — Fish & Inverts", /\b(molly|guppy|tetra|betta|shrimp|snail|pleco|cichlid|corydoras|cory\b|danio|barb|angelfish|discus|goldfish|koi|ramshorn|neocaridina|caridina|rasbora|gourami|loach|catfish|killifish|endler|platy|swordtail|otocinclus|oto\b|nerite|amano|cherry|crayfish|poecilia|fish)\b/i],
];
function categorize(name) {
  const n = String(name || "");
  for (const [cat, re] of CATEGORY_RULES) if (re.test(n)) return cat;
  return "Other / Misc";
}

// ---------- Load orders ----------
const O = load("orders.csv");
const oi = O.idx;
const orders = new Map();
for (const r of O.rows) {
  const name = r[oi["Name"]];
  if (!name) continue;
  if (r[oi["Total"]] !== "") {
    orders.set(name, {
      name,
      createdAt: r[oi["Created at"]] || "",
      total: num(r[oi["Total"]]),
      financial: r[oi["Financial Status"]] || "",
      cancelled: !!r[oi["Cancelled at"]],
      email: clean(r[oi["Email"]]).toLowerCase(),
      phone: clean(r[oi["Phone"]] || r[oi["Billing Phone"]]),
      billingName: clean(r[oi["Billing Name"]]),
      items: [],
    });
  }
}
for (const r of O.rows) {
  const o = orders.get(r[oi["Name"]]);
  if (!o) continue;
  const itemName = r[oi["Lineitem name"]];
  if (!itemName) continue;
  o.items.push({ name: itemName, qty: num(r[oi["Lineitem quantity"]]), price: num(r[oi["Lineitem price"]]) });
}
const valid = [...orders.values()].filter((o) => o.createdAt && o.financial !== "voided" && !o.cancelled);

// dataset reference "now" = latest order date (data is final)
const maxDate = valid.map((o) => o.createdAt).sort().at(-1).slice(0, 10);
const NOW = new Date(maxDate + "T23:59:59");
const daysBetween = (a, b) => Math.round((b - new Date(a)) / 86400000);

// ---------- Customer directory (names/emails) ----------
const C = load("customers.csv");
const ci = C.idx;
const dir = new Map();
for (const r of C.rows) {
  const nm = `${clean(r[ci["First Name"]])} ${clean(r[ci["Last Name"]])}`.trim();
  const email = clean(r[ci["Email"]]).toLowerCase();
  const phone = clean(r[ci["Phone"]] || r[ci["Default Address Phone"]]);
  const city = clean(r[ci["Default Address City"]]);
  if (email) dir.set(email, { name: nm, city });
  if (phone) dir.set(phone, { name: nm, city });
}

// ---------- Build customer profiles ----------
const custKey = (o) => o.email || o.phone || (o.billingName ? `name:${o.billingName.toLowerCase()}` : "");
const profiles = new Map();
const catTotals = {}; // category -> {revenue, units, orders:Set, customers:Set, products:{}}

for (const o of valid) {
  const k = custKey(o);
  if (!k) continue;
  if (!profiles.has(k)) {
    const d = dir.get(o.email) || dir.get(o.phone) || {};
    profiles.set(k, {
      key: k,
      name: d.name || o.billingName || o.email || o.phone || "Unknown",
      email: o.email || "",
      phone: o.phone || "",
      city: d.city || "",
      totalSpend: 0, orders: 0, items: 0,
      categories: {},
      firstOrder: o.createdAt, lastOrder: o.createdAt,
    });
  }
  const p = profiles.get(k);
  p.totalSpend += o.total;
  p.orders += 1;
  if (o.createdAt < p.firstOrder) p.firstOrder = o.createdAt;
  if (o.createdAt > p.lastOrder) p.lastOrder = o.createdAt;
  for (const it of o.items) {
    const cat = categorize(it.name);
    const rev = it.qty * it.price;
    p.items += it.qty;
    p.categories[cat] = (p.categories[cat] || 0) + rev;
    const ct = (catTotals[cat] ||= { revenue: 0, units: 0, orders: new Set(), customers: new Set(), products: {} });
    ct.revenue += rev; ct.units += it.qty; ct.orders.add(o.name); ct.customers.add(k);
    ct.products[it.name] = (ct.products[it.name] || { qty: 0, revenue: 0 });
    ct.products[it.name].qty += it.qty; ct.products[it.name].revenue += rev;
  }
}

const allProfiles = [...profiles.values()];
allProfiles.forEach((p) => {
  p.totalSpend = r2(p.totalSpend);
  p.topCategory = Object.entries(p.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  p.daysSinceLast = daysBetween(p.lastOrder, NOW);
});

// ---------- Tiers (by total spend quantile) + recommended cadence ----------
const spends = allProfiles.map((p) => p.totalSpend).sort((a, b) => b - a);
const q = (frac) => spends[Math.floor(spends.length * frac)] || 0;
const t90 = q(0.10), t75 = q(0.25), t50 = q(0.50); // top 10% / 25% / 50%
function tierOf(spend) {
  if (spend >= t90) return "Platinum";
  if (spend >= t75) return "Gold";
  if (spend >= t50) return "Silver";
  return "Bronze";
}
const CADENCE = { Platinum: "Weekly", Gold: "Every 2 weeks", Silver: "Monthly", Bronze: "Every 6–8 weeks" };
allProfiles.forEach((p) => { p.tier = tierOf(p.totalSpend); p.cadence = CADENCE[p.tier]; });

const tierCounts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
allProfiles.forEach((p) => tierCounts[p.tier]++);

// ---------- Categories summary ----------
const categories = Object.entries(catTotals).map(([name, c]) => ({
  name,
  revenue: r2(c.revenue),
  units: c.units,
  orders: c.orders.size,
  customers: c.customers.size,
  topProducts: Object.entries(c.products).map(([pn, v]) => ({ name: pn, qty: v.qty, revenue: r2(v.revenue) }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5),
})).sort((a, b) => b.revenue - a.revenue);

// ---------- Segments: per category, customers who bought in it, prioritized ----------
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tierRank = { Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 };
function buildSegment(id, name, description, members, valueKey) {
  const customers = members.map((p) => ({
    name: p.name, email: p.email, phone: p.phone, city: p.city,
    contact: p.email || p.phone || "—",
    segmentSpend: r2(valueKey(p)),
    totalSpend: p.totalSpend, orders: p.orders, tier: p.tier, cadence: p.cadence,
    lastOrder: p.lastOrder.slice(0, 10), daysSinceLast: p.daysSinceLast,
  })).sort((a, b) => (tierRank[b.tier] - tierRank[a.tier]) || (b.segmentSpend - a.segmentSpend));
  return { id, name, description, customerCount: customers.length, totalValue: r2(members.reduce((s, p) => s + valueKey(p), 0)), customers: customers.slice(0, 200) };
}

const segments = [];
for (const cat of categories) {
  const members = allProfiles.filter((p) => p.categories[cat.name]);
  if (members.length < 3) continue;
  segments.push(buildSegment(
    slug(cat.name), cat.name,
    `Customers who have purchased ${cat.name} — top spenders first.`,
    members, (p) => p.categories[cat.name]
  ));
}

// Special segments
const hardwareCats = ["Tanks & Aquariums", "Filtration & Equipment", "Lighting"];
const serviceProspects = allProfiles.filter((p) => hardwareCats.some((c) => p.categories[c]));
segments.unshift(buildSegment(
  "aquarium-maintenance", "Aquarium Maintenance Service",
  "Customers who own tanks, filters or lighting — strong prospects for recurring maintenance contracts.",
  serviceProspects, (p) => hardwareCats.reduce((s, c) => s + (p.categories[c] || 0), 0)
));

const vips = allProfiles.filter((p) => p.tier === "Platinum");
segments.unshift(buildSegment(
  "vip-top-customers", "VIP — Top Customers",
  "Your highest-value customers across all categories. Highest email frequency, premium offers.",
  vips, (p) => p.totalSpend
));

const lapsed = allProfiles.filter((p) => p.daysSinceLast > 120 && p.orders >= 2);
segments.push(buildSegment(
  "win-back-lapsed", "Win-Back — Lapsed Customers",
  "Repeat customers who haven't ordered in 120+ days. Re-engagement & comeback offers.",
  lapsed, (p) => p.totalSpend
));

// ---------- Customer directory for the page (top 500) ----------
const customerList = [...allProfiles].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 500).map((p) => ({
  name: p.name, email: p.email, phone: p.phone, city: p.city,
  totalSpend: p.totalSpend, orders: p.orders, topCategory: p.topCategory,
  tier: p.tier, cadence: p.cadence, lastOrder: p.lastOrder.slice(0, 10), daysSinceLast: p.daysSinceLast,
}));

const out = {
  generatedAt: new Date().toISOString(),
  currency: "AED",
  dataAsOf: maxDate,
  kpis: {
    contactable: allProfiles.filter((p) => p.email || p.phone).length,
    withEmail: allProfiles.filter((p) => p.email).length,
    totalCustomers: allProfiles.length,
    segments: segments.length,
    topCategory: categories[0]?.name || "—",
    serviceProspects: serviceProspects.length,
    lapsed: lapsed.length,
  },
  tierCounts,
  categories,
  segments,
  customers: customerList,
};

const outPath = path.join(PROJ, "src", "data", "marketing2025.json");
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
console.log(`Customers: ${allProfiles.length} | Segments: ${segments.length} | Categories: ${categories.length}`);
console.log(`Tiers: ${JSON.stringify(tierCounts)} | Service prospects: ${serviceProspects.length} | Lapsed: ${lapsed.length}`);
console.log(`Categories: ${categories.map((c) => `${c.name} (${c.customers})`).join(", ")}`);
