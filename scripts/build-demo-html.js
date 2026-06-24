/* Builds a single self-contained offline demo of the whole ProcureHub app.
   Full sidebar + topbar, every page/tab and button visible, real 2025 numbers.
   Output: ProcureHub-Demo.html — open in any browser, no server needed. */
const fs = require("fs");
const path = require("path");

const PROJ = path.join(__dirname, "..");
const sales = JSON.parse(fs.readFileSync(path.join(PROJ, "src/data/sales2025.json"), "utf8"));
const mkt = JSON.parse(fs.readFileSync(path.join(PROJ, "src/data/marketing2025.json"), "utf8"));
const y = sales.byYear["2025"];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16"];
const money = (n) => "AED " + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyS = (n) => (Math.abs(n) >= 1e6 ? "AED " + (n / 1e6).toFixed(2) + "M" : Math.abs(n) >= 1e3 ? "AED " + (n / 1e3).toFixed(1) + "K" : money(n));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- tiny SVG charts (pre-rendered) ----
function vbars(data, xKey, yKey, color, h = 150) {
  const max = Math.max(...data.map((d) => Math.abs(d[yKey])), 1);
  return `<div class="bars" style="height:${h}px">` + data.map((d) =>
    `<div class="bcol" title="${esc(d[xKey])}: ${esc(d[yKey])}"><div class="bar" style="height:${Math.round(Math.abs(d[yKey]) / max * 100)}%;background:${typeof color === "function" ? color(d) : color}"></div><div class="bx">${esc(d[xKey])}</div></div>`
  ).join("") + `</div>`;
}
function donut(data, isMoney) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let a0 = -90, paths = "";
  const cx = 80, cy = 80, r1 = 78, r2 = 46, rad = (a) => a * Math.PI / 180;
  const p = (r, a) => (cx + r * Math.cos(rad(a))).toFixed(2) + " " + (cy + r * Math.sin(rad(a))).toFixed(2);
  data.forEach((d, i) => {
    const a1 = a0 + Math.min(d.value / total * 360, 359.9), large = a1 - a0 > 180 ? 1 : 0;
    paths += `<path d="M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r2, a1)} A ${r2} ${r2} 0 ${large} 0 ${p(r2, a0)} Z" fill="${COLORS[i % COLORS.length]}"></path>`;
    a0 = a1;
  });
  const legend = data.map((d, i) => `<div><span class="dot" style="background:${COLORS[i % COLORS.length]}"></span><span style="flex:1">${esc(d.name)}</span><b>${isMoney ? moneyS(d.value) : d.value.toLocaleString()}</b></div>`).join("");
  return `<div class="donutwrap"><svg width="160" height="160" viewBox="0 0 160 160">${paths}</svg><div class="legend" style="flex:1;min-width:200px">${legend}</div></div>`;
}

// ---- demo data for operational pages (aquarium retail context) ----
const SUPPLIERS = [
  ["Chihiros Aquatic Studio", "Li Wei", "China", "Lighting", "T/T 30 Days", "Active", 5],
  ["Dymax Industries", "Tan Beng", "Malaysia", "Fish Food & Care", "Net 30", "Active", 4],
  ["Tropica Aquarium Plants", "Anders K.", "Denmark", "Aquatic Plants", "Net 45", "Active", 5],
  ["Seachem Laboratories", "John Reed", "USA", "Water Treatment", "Net 30", "Active", 4],
  ["ADA (Aqua Design Amano)", "Hiro Tanaka", "Japan", "Substrate & Décor", "LC at Sight", "Active", 5],
  ["Eheim GmbH", "Klaus Berg", "Germany", "Filtration & Equipment", "Net 30", "Active", 4],
  ["Gulf Aqua Trading FZE", "Omar Saleh", "UAE", "Tanks & Aquariums", "Net 15", "Active", 3],
  ["Shrimp King Imports", "Chen Hui", "China", "Livestock", "30% Advance", "Inactive", 3],
];
const PRODUCTS = [
  ["LGT-001", "Chihiros WRGB II Pro 120", "Lighting", "Pcs", "Chihiros Aquatic Studio", 2190, 18, 5],
  ["FOD-014", "Dymax Tropical Essential 100g", "Fish Food & Care", "Pcs", "Dymax Industries", 28, 6, 25],
  ["PLT-052", "Anubias Nana Petite (pot)", "Aquatic Plants", "Pot", "Tropica Aquarium Plants", 42, 3, 20],
  ["WTR-009", "Seachem Prime 500ml", "Water Treatment", "Pcs", "Seachem Laboratories", 65, 48, 15],
  ["SUB-003", "ADA Amazonia Soil 9L", "Substrate & Décor", "Bag", "ADA", 185, 9, 12],
  ["FLT-021", "Eheim Classic 2215 Canister", "Filtration & Equipment", "Pcs", "Eheim GmbH", 540, 4, 6],
];
const INVOICES = [
  ["INV-2026-0042", "Chihiros Aquatic Studio", "PO-2026-118", 26280, "Paid"],
  ["INV-2026-0051", "Eheim GmbH", "PO-2026-121", 10800, "Pending"],
  ["INV-2026-0039", "Seachem Laboratories", "—", 4875, "Overdue"],
  ["INV-2026-0055", "Tropica Aquarium Plants", "PO-2026-124", 6300, "Approved"],
  ["INV-2026-0033", "ADA", "PO-2026-115", 18500, "Paid"],
];
const POS = [
  ["PO-2026-124", "Tropica Aquarium Plants", "12 Feb 2026", 6300, "Sent", 4],
  ["PO-2026-121", "Eheim GmbH", "05 Feb 2026", 10800, "Partially Received", 3],
  ["PO-2026-118", "Chihiros Aquatic Studio", "28 Jan 2026", 26280, "Received", 6],
  ["PO-2026-126", "Gulf Aqua Trading FZE", "14 Feb 2026", 4200, "Draft", 2],
];
const LEADS = [
  ["Reef Pro Supplies", "Marine salt & test kits", "Quotation Received", "Exhibition"],
  ["AquaTech Robotics", "Auto water-change systems", "Sample Requested", "Website"],
  ["NatureScape Wood", "Spider wood & dragon stone", "Contacted", "Referral"],
  ["BettaWorld Farm", "Premium betta livestock", "New", "Email"],
];

const tag = (status) => {
  const map = { Active: "green", Inactive: "gray", Paid: "green", Pending: "amber", Overdue: "red", Approved: "blue", Draft: "gray", Sent: "blue", "Partially Received": "amber", Received: "green", New: "blue", Contacted: "cyan", "Quotation Received": "violet", "Sample Requested": "amber" };
  return `<span class="badge ${map[status] || "gray"}">${esc(status)}</span>`;
};
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// ---- NAV ----
const NAV = [
  ["dashboard", "Dashboard", "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"],
  ["suppliers", "Suppliers", "M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01"],
  ["customers", "Customer Agreements", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h4"],
  ["worknotes", "Work Notes - Thizam", "M4 4h16v16H4z M8 9h8 M8 13h6"],
  ["leads", "New Leads", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 M19 8v6 M22 11h-6"],
  ["products", "Products Sourced", "M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"],
  ["inventory", "Inventory", "M20 7H4 M20 12H4 M20 17H4"],
  ["pos", "Purchase Orders", "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"],
  ["invoices", "Vendor Invoices", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6"],
  ["receipts", "Receipts (GRN)", "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
  ["reports", "Reports", "M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3"],
  ["settings", "Settings", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"],
];
const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.split(" M").map((seg, i) => `<path d="${i ? "M" + seg : seg}"/>`).join("")}</svg>`;

function table(headers, rows) {
  return `<div class="card tablecard"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function pageHead(title, sub, actions) {
  return `<div class="pagehead"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="acts">${actions || ""}</div></div>`;
}
const kpi = (label, val, sub, color) => `<div class="card kpi"><div class="accent" style="background:${color}"></div><div class="lbl">${esc(label)}</div><div class="val">${val}</div>${sub ? `<div class="note">${esc(sub)}</div>` : ""}</div>`;
const btn = (label, primary) => `<button class="btn ${primary ? "primary" : ""}" onclick="demoToast()">${label}</button>`;

// ---- PAGES ----
const PAGES = {};

PAGES.dashboard = pageHead("Dashboard", "Procurement & inventory overview")
  + `<div class="grid kpis">${kpi("Spend This Month", moneyS(48250), "▲ 8% vs last month", "#6366f1")}${kpi("Active Suppliers", "15", "+2 this month", "#3b82f6")}${kpi("Pending Invoices", "4", moneyS(22000), "#f59e0b")}${kpi("Low Stock Items", "6", "needs reorder", "#ef4444")}${kpi("Open POs", "5", "", "#10b981")}</div>`
  + `<div class="grid two"><div class="card"><h2>Monthly Spend — Last 12 Months</h2>${vbars(y.monthly, "month", "spend", "#6366f1", 200)}</div><div class="card"><h2>Spend by Category</h2>${donut(y.productPie.slice(0, 6), true)}</div></div>`
  + `<div class="card"><h2>Recent Activity</h2><ul class="feed"><li><span class="dotf"></span>Invoice INV-2026-0042 marked Paid — Chihiros Aquatic Studio<em>2h ago</em></li><li><span class="dotf"></span>GRN posted: goods received from Eheim GmbH<em>5h ago</em></li><li><span class="dotf"></span>Low stock alert: Eheim Classic 2215 Canister<em>1d ago</em></li><li><span class="dotf"></span>New lead added: Reef Pro Supplies (Exhibition)<em>2d ago</em></li></ul></div>`;

PAGES.suppliers = pageHead("Suppliers", "15 suppliers — click a row to view details", btn("⤓ Import Excel") + btn("+ Add Supplier", 1))
  + table(["Supplier", "Contact", "Country", "Category", "Terms", "Rating", "Status"],
    SUPPLIERS.map((s) => [`<b>${s[0]}</b>`, s[1], s[2], s[3], s[4], `<span class="rate">${stars(s[6])}</span>`, tag(s[5])]));

PAGES.customers = pageHead("Customer Agreements", "B2B customers — signed agreements & documents", btn("+ Add Customer", 1))
  + table(["Customer", "Email", "Emirates ID", "Agreement", "Trade License", "VAT Reg", "License Expiry"],
    [
      ["FAMOUS FLOWERS L.L.C", "ey.zain@gmail.com", "784-1985-...", `<span class="badge green">✓ View</span>`, `<span class="badge green">✓ View</span>`, `<span class="badge green">✓ View</span>`, `19 Nov 2026<br><b class="ok">Valid</b>`],
      ["Blue Reef Aquatics LLC", "info@bluereef.ae", "784-1990-...", `<span class="badge green">✓ View</span>`, `<span class="badge green">✓ View</span>`, `<span class="badge red">Missing</span>`, `04 Aug 2025<br><b class="bad">Expired</b>`],
      ["Dubai Aqua Centre", "sales@dubaiaqua.ae", "784-1988-...", `<span class="badge green">✓ View</span>`, `<span class="badge red">Missing</span>`, `<span class="badge green">✓ View</span>`, `<span class="muted">Not detected</span>`],
    ]);

PAGES.worknotes = pageHead("Work Notes - Thizam", "3 notes — 2 open, 1 overdue", `<span class="toggle"><span class="on">▦ Kanban</span><span>☰ List</span></span>` + btn("+ Add Note", 1))
  + `<div class="grid three">
    <div><div class="kcol"><span class="kh"><span class="kd amber"></span>Pending</span><span class="kn">1</span></div>
      <div class="kbody"><div class="card kcard"><b>Follow up LC documents with bank</b><p>Call Emirates NBD trade desk re: LC amendment.</p><div class="kmeta"><span>🕑 2h ago</span><span class="bad">📅 Due 09 Jun</span></div>${tag("Pending")}</div></div></div>
    <div><div class="kcol"><span class="kh"><span class="kd blue"></span>In Progress</span><span class="kn">1</span></div>
      <div class="kbody"><div class="card kcard"><div class="kimg"></div><b>Renew trade license</b><p>Expires end of month — typing centre visit.</p><div class="kmeta"><span>🕑 1d ago</span><span class="warn">📅 Due 25 Jun</span></div><span class="badge blue">In Progress</span></div></div></div>
    <div><div class="kcol"><span class="kh"><span class="kd green"></span>Completed</span><span class="kn">1</span></div>
      <div class="kbody"><div class="card kcard"><b>Send Q2 supplier scorecards</b><p>Emailed to manager.</p><div class="kmeta"><span>🕑 3d ago</span></div><span class="badge green">Completed</span></div></div></div>
  </div>`;

PAGES.leads = pageHead("New Leads", "Potential supplier pipeline — 8 leads", `<span class="toggle"><span class="on">☰ Table</span><span>▦ Kanban</span></span>` + btn("⤓ Import Excel") + btn("+ Add Lead", 1))
  + table(["Company", "Product Offered", "Stage", "Source"], LEADS.map((l) => [`<b>${l[0]}</b>`, l[1], tag(l[2]), l[3]]));

PAGES.products = pageHead("Products Sourced", "40 products — 6 at or below reorder level", btn("⤓ Import Excel") + btn("+ Add Product", 1))
  + table(["SKU", "Product", "Category", "Supplier", "Last Price", "Stock", "Reorder", "Status"],
    PRODUCTS.map((p) => { const low = p[6] <= p[7]; return [`<span class="mono">${p[0]}</span>`, `<b>${p[1]}</b>`, p[2], p[4], money(p[5]), `<b class="${low ? "bad" : ""}">${low ? "⚠ " : ""}${p[6]}</b>`, p[7], tag(low ? "Low Stock" : "Active") === undefined ? "" : (low ? `<span class="badge red">Low Stock</span>` : `<span class="badge green">In Stock</span>`)]; }));

PAGES.inventory = pageHead("Inventory", "Stock movements & low stock alerts", btn("↑ Stock Out") + btn("+ Stock In", 1))
  + `<div class="card alert"><h2 class="bad">⚠ Low Stock Alerts (6)</h2><div class="grid three">${[["Eheim Classic 2215 Canister", "FLT-021", 4, 6], ["ADA Amazonia Soil 9L", "SUB-003", 9, 12], ["Anubias Nana Petite", "PLT-052", 3, 20]].map((p) => `<div class="lowbox"><div><b>${p[0]}</b><span>${p[1]}</span></div><div class="r"><b class="bad">${p[2]} left</b><span>reorder at ${p[3]}</span></div></div>`).join("")}</div></div>`
  + table(["Date", "SKU", "Product", "Type", "Reference", "Qty", "Running Balance"],
    [["14 Feb 2026", "FLT-021", "Eheim Classic 2215", `<span class="badge green">IN</span>`, "GRN-2026-088", `<b class="ok">+10</b>`, "<b>14</b>"], ["13 Feb 2026", "WTR-009", "Seachem Prime 500ml", `<span class="badge red">OUT</span>`, "ISS-1042", `<b class="bad">−6</b>`, "<b>48</b>"], ["12 Feb 2026", "LGT-001", "Chihiros WRGB II Pro", `<span class="badge green">IN</span>`, "GRN-2026-085", `<b class="ok">+6</b>`, "<b>18</b>"]]);

PAGES.pos = pageHead("Purchase Orders", "12 purchase orders — click a row for the printable view", btn("+ New Purchase Order", 1))
  + table(["PO #", "Supplier", "Order Date", "Items", "Total", "Status"],
    POS.map((p) => [`<b class="link">${p[0]}</b>`, p[1], p[2], p[5], `<b>${money(p[3])}</b>`, tag(p[4])]));

PAGES.invoices = pageHead("Vendor Invoices", "20 invoices — overdue is flagged automatically", btn("⤓ Import Excel") + btn("+ Add Invoice", 1))
  + `<div class="grid kpis3">${kpi("Total Pending", moneyS(17100), "", "#f59e0b")}${kpi("Total Overdue", moneyS(4875), "", "#ef4444")}${kpi("Paid This Month", moneyS(44780), "", "#10b981")}</div>`
  + table(["Invoice #", "Supplier", "PO", "Amount", "Status", "File"],
    INVOICES.map((i) => [`<b>${i[0]}</b>`, i[1], i[2], `<b>${money(i[3])}</b>`, tag(i[4]), `<span class="muted">📎</span>`]));

PAGES.receipts = pageHead("Goods Receipts (GRN)", "Receiving stock automatically increases inventory", btn("+ New Receipt", 1))
  + table(["Receipt #", "Date", "Supplier", "Linked PO", "Received By", "Items"],
    [["GRN-2026-088", "14 Feb 2026", "Eheim GmbH", "PO-2026-121", "Ahmed Hassan", "3"], ["GRN-2026-085", "12 Feb 2026", "Chihiros Aquatic Studio", "PO-2026-118", "Maria Santos", "6"], ["GRN-2026-081", "08 Feb 2026", "ADA", "PO-2026-115", "John Pinto", "4"]].map((r) => [`<b>${r[0]}</b>`, r[1], r[2], `<span class="link">${r[3]}</span>`, r[4], r[5]]));

PAGES.reports = pageHead("Reports", "Spend & supplier performance — export any table to CSV or Excel", `<input class="inp" value="From" disabled><input class="inp" value="To" disabled>${btn("Apply", 1)}`)
  + `<div class="grid kpis3">${kpi("Total Spend", moneyS(412000), "selected range", "#6366f1")}${kpi("Invoices", "184", "", "#3b82f6")}${kpi("Paid", moneyS(356000), "", "#10b981")}</div>`
  + `<div class="card"><h2>Monthly Spend</h2>${vbars(y.monthly, "month", "spend", "#10b981", 200)}</div>`
  + table(["Supplier", "On-time %", "Total Spend", "Avg Price"], SUPPLIERS.slice(0, 5).map((s, i) => [`<b>${s[0]}</b>`, `${88 + i * 2}%`, money(40000 - i * 6000), money(180 + i * 40)]));

PAGES.settings = pageHead("Settings", "Company profile, security, AI & categories")
  + `<div class="grid two">
    <div class="card"><h2>🏢 Company Profile</h2><label>Company Name</label><input class="inp" value="AquaGallery Trading LLC"><label>Address</label><input class="inp" value="Business Bay, Dubai, UAE"><div class="r2">${btn("Save Profile", 1)}</div></div>
    <div class="card"><h2>🔑 Change Password</h2><label>Current Password</label><input class="inp" type="password" value="******"><label>New Password</label><input class="inp" type="password" value="******"><div class="r2">${btn("Update Password", 1)}</div></div>
  </div>
  <div class="card"><h2>✨ AI Copywriting (optional)</h2><p class="muted2">The Email Marketing dashboard works fully without this. Add an Anthropic API key for one-click AI email generation.</p><div class="grid two"><div><label>Anthropic API Key</label><input class="inp" type="password" placeholder="sk-ant-..."></div><div><label>Model</label><input class="inp" value="Claude Opus 4.8 — most capable" disabled></div></div><div class="r2">${btn("Save AI Settings", 1)}</div></div>
  <div class="card"><h2>🏷️ Product Categories</h2><div class="chips">${["Lighting", "Aquatic Plants", "Fish Food & Care", "Filtration & Equipment", "Tanks & Aquariums", "Substrate & Décor", "Water Treatment", "Livestock", "Accessories"].map((c) => `<span class="chip">${c} <i>×</i></span>`).join("")}</div></div>`;

// 2025 Dashboard
PAGES.y2025 = pageHead("2025 Dashboard", `Final sales data — ${sales.dateRange.from} to ${sales.dateRange.to}`, `<span class="toggle"><span>All</span><span class="on">2025</span><span>2024</span></span>`)
  + `<div class="subtabs"><span class="on">Overview</span><span>Sales Report</span><span>Item Analytics</span><span>Customers</span></div>`
  + `<div class="grid kpis">${kpi("Net Revenue", moneyS(y.kpis.revenue), "▲ " + y.kpis.revenueGrowth + "% vs 2024", "#6366f1")}${kpi("Orders", y.kpis.orders.toLocaleString(), "▲ " + y.kpis.ordersGrowth + "% vs 2024", "#3b82f6")}${kpi("Avg Order Value", money(y.kpis.aov), "", "#10b981")}${kpi("Items Sold", y.kpis.itemsSold.toLocaleString(), "", "#f59e0b")}${kpi("Repeat Rate", y.kpis.repeatRate + "%", y.kpis.repeatCustomers + " returning", "#ef4444")}</div>`
  + `<div class="grid two"><div class="card"><h2>Revenue by Month</h2>${vbars(y.monthly, "month", "revenue", "#6366f1", 220)}</div><div class="card"><h2>Top Products — Revenue Share</h2>${donut(y.productPie.slice(0, 6), true)}</div></div>`
  + `<div class="card"><h2>Top Products</h2>` + table(["Product", "Qty Sold", "Avg Price", "Revenue", "Share"], y.topProducts.slice(0, 8).map((p) => [`<b>${esc(p.name)}</b>`, p.qty, money(p.avgPrice), `<b>${money(p.revenue)}</b>`, p.share + "%"])).replace('<div class="card tablecard">', "<div>").replace(/<\/div>$/, "") + `</div>`
  + `<div class="card"><h2>Top Customers</h2>` + table(["Customer", "Orders", "Avg Order", "Total Spend"], y.topCustomers.slice(0, 8).map((c) => [`<b>${esc(c.name)}</b>`, c.orders, money(c.aov), `<b>${money(c.spend)}</b>`])).replace('<div class="card tablecard">', "<div>").replace(/<\/div>$/, "") + `</div>`;

// Email Marketing
PAGES.marketing = pageHead("Email Marketing", `Targeted campaigns — ${mkt.kpis.contactable} contactable customers, ${mkt.segments.length} segments`)
  + `<div class="subtabs"><span class="on">Overview</span><span>Segments</span><span>Campaign Studio</span><span>AI Copywriter</span></div>`
  + `<div class="grid kpis">${kpi("Contactable Customers", mkt.kpis.contactable.toLocaleString(), mkt.kpis.withEmail + " with email", "#6366f1")}${kpi("Segments", mkt.segments.length, "", "#3b82f6")}${kpi("VIP (Platinum)", mkt.tierCounts.Platinum, "", "#f59e0b")}${kpi("Service Prospects", mkt.kpis.serviceProspects, "own tanks/equipment", "#10b981")}${kpi("Win-Back Targets", mkt.kpis.lapsed, "lapsed 120+ days", "#ef4444")}</div>`
  + `<div class="grid two"><div class="card"><h2>Customers by Category</h2>${vbars(mkt.categories.slice(0, 8).map((c) => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name, v: c.customers })), "name", "v", "#6366f1", 200)}</div><div class="card"><h2>Customer Tiers</h2>${donut(Object.entries(mkt.tierCounts).map(([name, value]) => ({ name, value })), false)}</div></div>`
  + `<div class="card"><h2>Targeted Segments — prioritized by value</h2>` + table(["Segment", "Customers", "Strategy"], mkt.segments.map((s) => [`<b>${esc(s.name)}</b>`, `<span class="badge gray">${s.customerCount}</span>`, `<span class="muted2">${esc(s.description)}</span>`])).replace('<div class="card tablecard">', "<div>").replace(/<\/div>$/, "") + `</div>`;

const PAGE_ORDER = NAV.map((n) => n[0]).concat(["y2025", "marketing"]);

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ProcureHub — Demo</title>
<style>
:root{--bg:#f1f5f9;--card:#fff;--ink:#0f172a;--mut:#64748b;--line:#e2e8f0;--acc:#6366f1;--side:#0f172a}
.dark{--bg:#020617;--card:#0f172a;--ink:#e2e8f0;--mut:#94a3b8;--line:#1e293b;--side:#020617}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",system-ui,sans-serif;background:var(--bg);color:var(--ink);display:flex;min-height:100vh}
a{color:inherit}
.side{width:256px;background:var(--side);color:#cbd5e1;display:flex;flex-direction:column;position:fixed;inset:0 auto 0 0;border-right:1px solid var(--line)}
.brand{display:flex;gap:12px;align-items:center;padding:18px 20px;border-bottom:1px solid #1e293b}
.logo{width:38px;height:38px;border-radius:10px;background:var(--acc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.brand b{color:#fff;font-size:14px;display:block}.brand small{color:#94a3b8;font-size:11px}
.nav{flex:1;overflow-y:auto;padding:14px 12px}
.nav a{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:9px;font-size:14px;font-weight:500;color:#cbd5e1;text-decoration:none;cursor:pointer;margin-bottom:3px}
.nav a svg{width:17px;height:17px;flex:none}
.nav a:hover{background:#1e293b;color:#fff}
.nav a.active{background:var(--acc);color:#fff;box-shadow:0 8px 20px -8px var(--acc)}
.uside{border-top:1px solid #1e293b;padding:12px;display:flex;gap:10px;align-items:center}
.av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.uside b{color:#fff;font-size:13px;display:block}.uside small{color:#94a3b8;font-size:11px}
.main{flex:1;margin-left:256px;display:flex;flex-direction:column}
.top{position:sticky;top:0;z-index:10;display:flex;gap:12px;align-items:center;padding:12px 24px;background:color-mix(in srgb,var(--card) 90%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.search{flex:1;max-width:420px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:9px;padding:8px 12px;color:var(--mut);font-size:13px;background:var(--card)}
.tbtn{border:1px solid var(--line);background:var(--card);border-radius:9px;padding:8px 12px;font-size:12px;font-weight:600;color:var(--mut);cursor:pointer;display:flex;align-items:center;gap:6px}
.tbtn:hover{color:var(--acc);border-color:var(--acc)}
.content{padding:24px;max-width:1300px;width:100%}
.pagehead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.pagehead h1{font-size:24px;letter-spacing:-.5px}.pagehead p{color:var(--mut);font-size:13px;margin-top:3px}
.acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{border:1px solid var(--line);background:var(--card);border-radius:9px;padding:8px 14px;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#fff}
.btn:active{transform:scale(.97)}
.inp{border:1px solid var(--line);border-radius:9px;padding:8px 12px;font-size:13px;background:var(--card);color:var(--ink);width:100%;margin-bottom:10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(15,23,42,.05);margin-bottom:18px}
.card h2{font-size:15px;margin-bottom:14px}
.grid{display:grid;gap:16px;margin-bottom:18px}
.kpis{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.kpis3{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.two{grid-template-columns:1fr 1fr}.three{grid-template-columns:1fr 1fr 1fr}
@media(max-width:1000px){.two,.three{grid-template-columns:1fr}}
.kpi{position:relative;overflow:hidden}
.accent{position:absolute;top:0;left:0;width:34px;height:4px;border-radius:0 0 4px 0}
.kpi .lbl{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--mut);margin-top:6px}
.kpi .val{font-size:22px;font-weight:700;margin-top:4px}.kpi .note{font-size:11.5px;color:var(--mut);margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--mut);padding:10px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent);white-space:nowrap}
tr:hover td{background:color-mix(in srgb,var(--acc) 4%,transparent)}
.tablecard{padding:6px 6px 2px}
.badge{display:inline-block;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:600}
.badge.green{background:#d1fae5;color:#047857}.badge.red{background:#ffe4e6;color:#be123c}.badge.amber{background:#fef3c7;color:#b45309}
.badge.blue{background:#dbeafe;color:#1d4ed8}.badge.violet{background:#ede9fe;color:#6d28d9}.badge.cyan{background:#cffafe;color:#0e7490}.badge.gray{background:#e2e8f0;color:#475569}
.dark .badge.green{background:rgba(16,185,129,.15);color:#34d399}.dark .badge.red{background:rgba(239,68,68,.15);color:#fb7185}.dark .badge.amber{background:rgba(245,158,11,.15);color:#fbbf24}.dark .badge.blue{background:rgba(59,130,246,.15);color:#60a5fa}.dark .badge.gray{background:rgba(100,116,139,.2);color:#94a3b8}.dark .badge.violet{background:rgba(139,92,246,.15);color:#a78bfa}.dark .badge.cyan{background:rgba(6,182,212,.15);color:#22d3ee}
.mono{font-family:ui-monospace,monospace;font-size:12px;font-weight:600}
.rate{color:#f59e0b;letter-spacing:1px}
.ok{color:#059669}.bad{color:#e11d48}.warn{color:#b45309}.link{color:var(--acc)}.muted{color:#cbd5e1}.muted2{color:var(--mut);font-size:12px}
.bars{display:flex;align-items:flex-end;gap:6px;padding-top:6px}
.bcol{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:0}
.bar{width:100%;border-radius:5px 5px 0 0;min-height:2px}.bx{font-size:9px;color:var(--mut);margin-top:5px;white-space:nowrap;overflow:hidden;max-width:100%}
.donutwrap{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.legend{font-size:12.5px}.legend div{display:flex;align-items:center;gap:8px;padding:3px 0}.dot{width:10px;height:10px;border-radius:3px;flex:none}
.feed{list-style:none}.feed li{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px;border-bottom:1px solid color-mix(in srgb,var(--line) 50%,transparent)}.feed em{margin-left:auto;color:var(--mut);font-size:11px;font-style:normal}.dotf{width:8px;height:8px;border-radius:50%;background:var(--acc);flex:none}
.toggle{display:inline-flex;border:1px solid var(--line);border-radius:9px;padding:3px;background:var(--card)}.toggle span{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;color:var(--mut)}.toggle span.on{background:var(--acc);color:#fff}
.subtabs{display:inline-flex;gap:4px;border:1px solid var(--line);border-radius:11px;padding:5px;background:var(--card);margin-bottom:18px}.subtabs span{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:var(--mut)}.subtabs span.on{background:var(--acc);color:#fff}
.kcol{display:flex;justify-content:space-between;align-items:center;padding:0 4px 8px}.kh{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px}.kd{width:10px;height:10px;border-radius:50%}.kd.amber{background:#f59e0b}.kd.blue{background:#3b82f6}.kd.green{background:#10b981}.kn{font-size:12px;font-weight:700;color:var(--mut)}
.kbody{background:color-mix(in srgb,var(--mut) 12%,transparent);border-radius:12px;padding:8px;min-height:120px}
.kcard{padding:12px;margin-bottom:0;cursor:pointer}.kcard b{font-size:14px}.kcard p{font-size:12px;color:var(--mut);margin:5px 0}.kmeta{display:flex;gap:10px;font-size:11px;color:var(--mut);margin:6px 0 8px}.kimg{height:80px;border-radius:8px;background:linear-gradient(135deg,#ef4444,#f59e0b);margin-bottom:8px}
.alert{border-left:4px solid #ef4444}.lowbox{display:flex;justify-content:space-between;background:color-mix(in srgb,#ef4444 8%,transparent);border-radius:10px;padding:10px 14px}.lowbox span{font-size:11px;color:var(--mut);display:block}.lowbox .r{text-align:right}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{border:1px solid var(--line);background:color-mix(in srgb,var(--mut) 8%,transparent);border-radius:99px;padding:6px 12px;font-size:13px}.chip i{color:var(--mut);font-style:normal;cursor:pointer}
.r2{display:flex;justify-content:flex-end;margin-top:6px}
label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--mut);display:block;margin-bottom:5px}
.page{display:none}.page.active{display:block;animation:f .25s ease}@keyframes f{from{opacity:0;transform:translateY(6px)}to{opacity:1}}
.demobanner{background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;text-align:center;font-size:12px;padding:7px;font-weight:600}
.toast{position:fixed;bottom:20px;right:20px;background:#0f172a;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transform:translateY(10px);transition:.25s;z-index:100}.toast.show{opacity:1;transform:translateY(0)}
@media(max-width:760px){.side{display:none}.main{margin-left:0}}
</style></head>
<body>
<aside class="side">
  <div class="brand"><div class="logo">🐠</div><div><b>AquaGallery Hub</b><small>Procurement Control Panel</small></div></div>
  <nav class="nav" id="nav">
    ${NAV.map((n, i) => `<a data-p="${n[0]}" class="${i === 0 ? "active" : ""}" onclick="go('${n[0]}')">${icon(n[2])}${n[1]}</a>`).join("")}
  </nav>
  <div class="uside"><div class="av">A</div><div style="flex:1"><b>Administrator</b><small>@admin</small></div><span class="tbtn" style="padding:6px" onclick="demoToast()">⎋</span></div>
</aside>
<div class="main">
  <div class="demobanner">📋 OFFLINE DEMO — full interface preview. Navigation works; data is illustrative. The live app connects to a database.</div>
  <header class="top">
    <div class="search">🔍 Search suppliers, products, invoices, POs…</div>
    <button class="tbtn" onclick="go('marketing')">✉ <span>Email Marketing</span></button>
    <button class="tbtn" onclick="go('y2025')">📅 <span>2025 Dashboard</span></button>
    <button class="tbtn" onclick="toggleTheme()" id="themebtn">🌙</button>
    <button class="tbtn" onclick="demoToast()">🔔</button>
  </header>
  <main class="content">
    ${PAGE_ORDER.map((id, i) => `<section class="page ${i === 0 ? "active" : ""}" id="page-${id}">${PAGES[id]}</section>`).join("")}
  </main>
</div>
<div class="toast" id="toast"></div>
<script>
function go(p){
  document.querySelectorAll('.page').forEach(s=>s.classList.toggle('active',s.id==='page-'+p));
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.p===p));
  window.scrollTo({top:0,behavior:'smooth'});
}
function toggleTheme(){var d=document.body.classList.toggle('dark');document.getElementById('themebtn').textContent=d?'☀':'🌙';}
var tt;
function demoToast(){var t=document.getElementById('toast');t.textContent='Demo preview — open the live app to use this action.';t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1800);}
</script>
</body></html>`;

const out = path.join(PROJ, "ProcureHub-Demo.html");
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(fs.statSync(out).size / 1024)} KB) — ${PAGE_ORDER.length} pages`);
