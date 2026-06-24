const fs = require("fs");
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
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const t = fs.readFileSync("C:/Users/procu/Downloads/orders_export_1 (2).csv", "utf8");
const rows = parseCSV(t);
const h = rows[0]; const idx = Object.fromEntries(h.map((x, i) => [x, i]));
const data = rows.slice(1).filter((r) => r.length > 5);
console.log("lineitem rows:", data.length);
const orders = new Set(data.map((r) => r[idx["Name"]]).filter(Boolean));
console.log("distinct orders:", orders.size);
const withTotal = data.filter((r) => r[idx["Total"]] !== "");
console.log("rows with Total:", withTotal.length);
const dates = withTotal.map((r) => r[idx["Created at"]]).filter(Boolean).sort();
console.log("date range:", dates[0], "->", dates[dates.length - 1]);
const pay = {}; withTotal.forEach((r) => { const p = r[idx["Payment Method"]] || "(blank)"; pay[p] = (pay[p] || 0) + 1; });
console.log("payment methods:", JSON.stringify(pay));
const src = {}; withTotal.forEach((r) => { const s = r[idx["Source"]] || "(blank)"; src[s] = (src[s] || 0) + 1; });
console.log("sources:", JSON.stringify(src));
const fin = {}; withTotal.forEach((r) => { const s = r[idx["Financial Status"]] || "(blank)"; fin[s] = (fin[s] || 0) + 1; });
console.log("financial:", JSON.stringify(fin));
const contRow = data.find((r) => r[idx["Total"]] === "");
if (contRow) console.log("continuation sample: Name=", contRow[idx["Name"]], "| item=", contRow[idx["Lineitem name"]], "| qty=", contRow[idx["Lineitem quantity"]], "| email=", contRow[idx["Email"]]);
const years = {}; withTotal.forEach((r) => { const y = (r[idx["Created at"]] || "").slice(0, 4); years[y] = (years[y] || 0) + 1; });
console.log("orders by year:", JSON.stringify(years));
const cancelled = withTotal.filter((r) => r[idx["Cancelled at"]]).length;
console.log("cancelled orders:", cancelled);
const refunded = withTotal.filter((r) => Number(r[idx["Refunded Amount"]]) > 0).length;
console.log("orders with refunds:", refunded);
// transactions probe
const tt = fs.readFileSync("C:/Users/procu/Downloads/transactions_export_1.csv", "utf8");
const trows = parseCSV(tt); const th = trows[0]; const tidx = Object.fromEntries(th.map((x, i) => [x, i]));
const tdata = trows.slice(1).filter((r) => r.length > 3);
const kinds = {}; tdata.forEach((r) => { const k = r[tidx["Kind"]] + "/" + r[tidx["Status"]]; kinds[k] = (kinds[k] || 0) + 1; });
console.log("txn kinds:", JSON.stringify(kinds));
const gw = {}; tdata.forEach((r) => { const g = r[tidx["Gateway"]] || "(blank)"; gw[g] = (gw[g] || 0) + 1; });
console.log("gateways:", JSON.stringify(gw));
// customers probe
const ct = fs.readFileSync("C:/Users/procu/Downloads/customers_export (2).csv", "utf8");
const crows = parseCSV(ct); const ch = crows[0]; const cidx = Object.fromEntries(ch.map((x, i) => [x, i]));
const cdata = crows.slice(1).filter((r) => r.length > 3);
console.log("customers:", cdata.length);
const spends = cdata.map((r) => Number(r[cidx["Total Spent"]]) || 0).sort((a, b) => b - a);
console.log("top customer spends:", spends.slice(0, 5).join(", "));
const withOrders = cdata.filter((r) => Number(r[cidx["Total Orders"]]) > 0).length;
console.log("customers with orders:", withOrders);
