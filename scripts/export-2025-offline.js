/* Generates a fully offline, single-file copy of the 2025 Dashboard.
   Output: AquaGallery-2025-Dashboard.html (no server / internet needed — just double-click). */
const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "data", "sales2025.json"), "utf8"));
const json = JSON.stringify(DATA).replace(/</g, "\\u003c");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AquaGallery — 2025 Sales Dashboard</title>
<style>
  :root { --ink:#0f172a; --mut:#64748b; --line:#e2e8f0; --bg:#f1f5f9; --card:#ffffff; --acc:#6366f1; --green:#10b981; --red:#ef4444; --amber:#f59e0b; --cyan:#06b6d4; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:"Segoe UI",system-ui,-apple-system,sans-serif; background:var(--bg); color:var(--ink); padding:24px; }
  .wrap { max-width:1280px; margin:0 auto; }
  h1 { font-size:26px; letter-spacing:-0.5px; }
  .sub { color:var(--mut); font-size:13px; margin-top:4px; }
  .topbar { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; gap:12px; margin-bottom:18px; }
  .brand { display:flex; gap:12px; align-items:center; }
  .logo { width:44px; height:44px; border-radius:12px; background:var(--acc); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { border:1px solid var(--line); background:var(--card); color:var(--mut); padding:7px 14px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; }
  .chip.on { background:var(--acc); border-color:var(--acc); color:#fff; }
  .tabs { display:flex; gap:4px; flex-wrap:wrap; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:5px; margin-bottom:20px; }
  .tab { border:0; background:transparent; color:var(--mut); padding:9px 18px; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; }
  .tab.on { background:var(--acc); color:#fff; }
  .grid { display:grid; gap:16px; }
  .kpis { grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:18px; }
  .cols2 { grid-template-columns:1fr 1fr; margin-bottom:18px; }
  @media (max-width:900px){ .cols2 { grid-template-columns:1fr; } }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px; box-shadow:0 1px 2px rgba(15,23,42,.05); margin-bottom:0; }
  .card.mb { margin-bottom:18px; }
  .card h2 { font-size:15px; margin-bottom:2px; }
  .card .cs { color:var(--mut); font-size:12px; margin-bottom:14px; }
  .kpi .lbl { font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:var(--mut); }
  .kpi .val { font-size:21px; font-weight:700; margin-top:3px; }
  .kpi .note { font-size:11.5px; color:var(--mut); margin-top:3px; }
  .trend { display:inline-block; font-size:11px; font-weight:700; border-radius:99px; padding:2px 8px; margin-top:7px; }
  .trend.up { background:#d1fae5; color:#047857; } .trend.dn { background:#ffe4e6; color:#be123c; }
  .accent { width:34px; height:4px; border-radius:2px; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--mut); padding:9px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
  td { padding:8px 10px; border-bottom:1px solid #f1f5f9; }
  tr:hover td { background:#f8fafc; }
  .num { font-weight:600; }
  .up2 { color:#059669; font-weight:700; } .dn2 { color:#e11d48; font-weight:700; }
  .tbox { max-height:430px; overflow:auto; border:1px solid var(--line); border-radius:10px; }
  .tbox thead th { position:sticky; top:0; background:#f8fafc; }
  .thead-row { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
  .search { border:1px solid var(--line); border-radius:9px; padding:7px 12px; font-size:13px; min-width:220px; }
  .btn { border:1px solid var(--line); background:#fff; border-radius:9px; padding:7px 12px; font-size:12px; font-weight:600; color:var(--mut); cursor:pointer; }
  .btn:hover { color:var(--acc); border-color:var(--acc); }
  .bars { display:flex; align-items:flex-end; gap:6px; height:170px; padding-top:6px; }
  .bcol { flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:100%; min-width:0; }
  .bar { width:100%; border-radius:5px 5px 0 0; min-height:2px; }
  .bx { font-size:9.5px; color:var(--mut); margin-top:5px; white-space:nowrap; overflow:hidden; max-width:100%; }
  .hrow { display:flex; align-items:center; gap:10px; margin-bottom:9px; font-size:12.5px; }
  .hlbl { width:230px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--ink); }
  .htrack { flex:1; background:#eef2ff; border-radius:6px; height:20px; }
  .hfill { height:100%; border-radius:6px; background:var(--acc); min-width:2px; }
  .hval { width:110px; text-align:right; font-weight:600; font-size:12px; }
  .legend { font-size:12.5px; margin-top:8px; }
  .legend div { display:flex; align-items:center; gap:8px; padding:3px 0; }
  .dot { width:10px; height:10px; border-radius:3px; flex:none; }
  .donutwrap { display:flex; gap:18px; align-items:center; flex-wrap:wrap; }
  .footer { text-align:center; color:var(--mut); font-size:11.5px; padding:22px 0 6px; }
  @media print { body { padding:0; background:#fff; } .chips,.tabs,.btn,.search { display:none !important; } .tbox { max-height:none; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <div class="logo">A</div>
      <div>
        <h1>AquaGallery — 2025 Sales Dashboard</h1>
        <p class="sub" id="subline"></p>
      </div>
    </div>
    <div class="chips" id="chips"></div>
  </div>
  <div class="tabs" id="tabs"></div>
  <div id="app"></div>
  <p class="footer">Offline snapshot — generated GENDATE · Final data, no further updates · Open in any browser, no internet required · Use your browser's Print → Save as PDF for a printable copy</p>
</div>
<script>
const DATA = ${json};
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#06b6d4","#8b5cf6","#ec4899","#84cc16","#64748b"];
const TABS = [["overview","Overview"],["sales","Sales Report"],["items","Item Analytics"],["customers","Customers"]];
let year = DATA.years.includes("2025") ? "2025" : "All";
let tab = "overview";

const money = n => "AED " + (Number(n)||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const moneyS = n => Math.abs(n)>=1e6 ? "AED "+(n/1e6).toFixed(2)+"M" : Math.abs(n)>=1e3 ? "AED "+(n/1e3).toFixed(1)+"K" : money(n);
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function kpi(label, val, color, note, trend, trendLabel){
  let t = "";
  if (trend !== null && trend !== undefined && isFinite(trend)) {
    const up = trend >= 0;
    t = '<span class="trend '+(up?"up":"dn")+'">'+(up?"&#9650;":"&#9660;")+" "+Math.abs(trend).toFixed(0)+"% "+esc(trendLabel||"")+"</span>";
  }
  return '<div class="card kpi"><div class="accent" style="background:'+color+'"></div><div class="lbl">'+esc(label)+'</div><div class="val">'+val+'</div>'+(note?'<div class="note">'+esc(note)+'</div>':"")+t+'</div>';
}

function vbars(data, xKey, yKey, color, fmt, h){
  const max = Math.max(...data.map(d=>Math.abs(d[yKey])), 1);
  let out = '<div class="bars" style="height:'+(h||170)+'px">';
  for (const d of data) {
    const hh = Math.round(Math.abs(d[yKey])/max*100);
    out += '<div class="bcol" title="'+esc(d[xKey])+': '+esc(fmt?fmt(d[yKey]):d[yKey])+'">'
        + '<div class="bar" style="height:'+hh+'%;background:'+(typeof color==="function"?color(d):color)+'"></div>'
        + '<div class="bx">'+esc(d[xKey])+'</div></div>';
  }
  return out + "</div>";
}

function hbars(data, lblKey, valKey, fmt, color){
  const max = Math.max(...data.map(d=>d[valKey]), 1);
  return data.map((d,i)=>'<div class="hrow"><div class="hlbl" title="'+esc(d[lblKey])+'">'+esc(d[lblKey])+'</div>'
    +'<div class="htrack"><div class="hfill" style="width:'+Math.max(2,Math.round(d[valKey]/max*100))+'%;background:'+(color||COLORS[i%COLORS.length])+'"></div></div>'
    +'<div class="hval">'+(fmt?fmt(d[valKey]):d[valKey])+'</div></div>').join("");
}

function donut(data, isMoney){
  const total = data.reduce((s,d)=>s+d.value,0) || 1;
  let a0 = -90, paths = "";
  const cx=80, cy=80, r1=78, r2=46;
  for (let i=0;i<data.length;i++){
    const frac = data[i].value/total;
    let a1 = a0 + Math.min(frac*360, 359.9);
    const rad = a => a*Math.PI/180;
    const p = (r,a)=> (cx+r*Math.cos(rad(a))).toFixed(2)+" "+(cy+r*Math.sin(rad(a))).toFixed(2);
    const large = (a1-a0)>180 ? 1 : 0;
    paths += '<path d="M '+p(r1,a0)+' A '+r1+' '+r1+' 0 '+large+' 1 '+p(r1,a1)+' L '+p(r2,a1)+' A '+r2+' '+r2+' 0 '+large+' 0 '+p(r2,a0)+' Z" fill="'+COLORS[i%COLORS.length]+'"><title>'+esc(data[i].name)+': '+esc(isMoney?money(data[i].value):data[i].value)+' ('+(frac*100).toFixed(1)+'%)</title></path>';
    a0 = a1;
  }
  const legend = data.map((d,i)=>'<div><span class="dot" style="background:'+COLORS[i%COLORS.length]+'"></span><span style="flex:1">'+esc(d.name)+'</span><b>'+(isMoney?moneyS(d.value):d.value.toLocaleString())+'</b><span style="color:var(--mut)">'+((d.value/total)*100).toFixed(1)+'%</span></div>').join("");
  return '<div class="donutwrap"><svg width="160" height="160" viewBox="0 0 160 160">'+paths+'</svg><div class="legend" style="flex:1;min-width:220px">'+legend+'</div></div>';
}

function combo(monthly){
  const W=900, H=290, L=60, R=46, T=14, B=30, iw=W-L-R, ih=H-T-B;
  const maxR = Math.max(...monthly.map(m=>m.revenue),1), maxO = Math.max(...monthly.map(m=>m.orders),1);
  const n = monthly.length, step = iw/Math.max(n,1);
  let s = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  for (let g=0; g<=4; g++){
    const y = T + ih - ih*g/4;
    s += '<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" stroke="#e2e8f0" stroke-dasharray="3 3"/>';
    s += '<text x="'+(L-8)+'" y="'+(y+4)+'" font-size="10" fill="#94a3b8" text-anchor="end">'+Math.round(maxR*g/4/1000)+'K</text>';
    s += '<text x="'+(W-R+8)+'" y="'+(y+4)+'" font-size="10" fill="#94a3b8">'+Math.round(maxO*g/4)+'</text>';
  }
  let pts = "";
  const lblEvery = Math.ceil(n/14);
  monthly.forEach((m,i)=>{
    const bx = L+i*step+step*0.18, bw = step*0.64, bh = m.orders/maxO*ih;
    s += '<rect x="'+bx.toFixed(1)+'" y="'+(T+ih-bh).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="3" fill="#c7d2fe"><title>'+esc(m.month)+': '+m.orders+' orders</title></rect>';
    if (i % lblEvery === 0) s += '<text x="'+(L+i*step+step/2)+'" y="'+(H-9)+'" font-size="10" fill="#94a3b8" text-anchor="middle">'+esc(m.month)+'</text>';
    pts += (L+i*step+step/2).toFixed(1)+","+(T+ih-(m.revenue/maxR*ih)).toFixed(1)+" ";
  });
  s += '<polyline points="'+pts.trim()+'" fill="none" stroke="#6366f1" stroke-width="2.5"/>';
  monthly.forEach((m,i)=>{
    s += '<circle cx="'+(L+i*step+step/2).toFixed(1)+'" cy="'+(T+ih-(m.revenue/maxR*ih)).toFixed(1)+'" r="3.4" fill="#6366f1"><title>'+esc(m.month)+': '+esc(money(m.revenue))+'</title></circle>';
  });
  s += '<text x="'+L+'" y="'+(T-2)+'" font-size="10" fill="#6366f1" font-weight="700">Net Revenue (AED)</text>';
  s += '<text x="'+(W-R)+'" y="'+(T-2)+'" font-size="10" fill="#818cf8" text-anchor="end" font-weight="700">Orders</text>';
  return s + "</svg>";
}

function tableHTML(id, cols, rows, searchable){
  let h = '<div class="thead-row">' + (searchable
    ? '<input class="search" placeholder="Search…" oninput="filterT(\\''+id+'\\', this.value)">' : "<span></span>")
    + '<button class="btn" onclick="csv(\\''+id+'\\')">&#8681; Download CSV</button></div>';
  h += '<div class="tbox"><table id="'+id+'"><thead><tr>'+cols.map(c=>"<th>"+esc(c[0])+"</th>").join("")+'</tr></thead><tbody>';
  for (const r of rows) h += "<tr>"+cols.map(c=>"<td>"+c[1](r)+"</td>").join("")+"</tr>";
  return h + "</tbody></table></div>";
}
function filterT(id, q){
  q = q.toLowerCase();
  document.querySelectorAll("#"+id+" tbody tr").forEach(tr=>{ tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none"; });
}
function csv(id){
  const rows = [...document.querySelectorAll("#"+id+" tr")].filter(tr=>tr.style.display!=="none");
  const c = rows.map(tr=>[...tr.children].map(td=>'"'+td.textContent.replace(/"/g,'""').trim()+'"').join(",")).join("\\r\\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\\uFEFF"+c],{type:"text/csv;charset=utf-8"}));
  a.download = id+".csv"; a.click(); URL.revokeObjectURL(a.href);
}

function render(){
  const d = DATA.byYear[year];
  const k = d.kpis;
  const tl = year==="All" ? "" : "vs "+(Number(year)-1);
  document.getElementById("subline").textContent = "Final sales data — "+DATA.dateRange.from+" to "+DATA.dateRange.to+" · "+(year==="All"?"All years":"Year "+year);
  document.getElementById("chips").innerHTML = DATA.years.map(y=>'<button class="chip'+(y===year?" on":"")+'" onclick="setYear(\\''+y+'\\')">'+y+'</button>').join("");
  document.getElementById("tabs").innerHTML = TABS.map(t=>'<button class="tab'+(t[0]===tab?" on":"")+'" onclick="setTab(\\''+t[0]+'\\')">'+t[1]+'</button>').join("");

  let h = "";
  if (tab==="overview"){
    h += '<div class="grid kpis">'
      + kpi("Net Revenue", moneyS(k.revenue), "#6366f1", null, k.revenueGrowth, tl)
      + kpi("Orders", k.orders.toLocaleString(), "#3b82f6", null, k.ordersGrowth, tl)
      + kpi("Avg Order Value", money(k.aov), "#10b981")
      + kpi("Items Sold", k.itemsSold.toLocaleString(), "#f59e0b")
      + kpi("Customers", k.customers.toLocaleString(), "#6366f1")
      + kpi("Repeat Rate", k.repeatRate+"%", "#ef4444", k.repeatCustomers+" returning")
      + '</div>';
    h += '<div class="card mb"><h2>Revenue &amp; Orders by Month</h2><p class="cs">Net revenue (line) vs number of orders (bars) — hover for values</p>'+combo(d.monthly)+'</div>';
    h += '<div class="grid cols2">'
      + '<div class="card"><h2>Payment Methods</h2><p class="cs">Share of net revenue</p>'+donut(d.paymentPie,true)+'</div>'
      + '<div class="card"><h2>Sales Channels</h2><p class="cs">Orders by source</p>'+donut(d.sourcePie,false)+'</div></div>';
    h += '<div class="grid cols2">'
      + '<div class="card"><h2>Revenue by Weekday</h2><p class="cs">Which days bring the money</p>'+vbars(d.weekday,"day","revenue","#10b981",moneyS)+'</div>'
      + '<div class="card"><h2>Orders by Hour of Day</h2><p class="cs">Shop traffic pattern (8:00–23:00)</p>'+vbars(d.hourly,"hour","orders","#f59e0b")+'</div></div>';
  }
  if (tab==="sales"){
    h += '<div class="grid kpis">'
      + kpi("Gross Sales", moneyS(k.gross), "#6366f1")
      + kpi("Refunded", moneyS(k.refunds), "#ef4444")
      + kpi("Net Revenue", moneyS(k.revenue), "#10b981", null, k.revenueGrowth, tl)
      + kpi("Failed Transactions", DATA.transactions.failures, "#f59e0b", "all time")
      + '</div>';
    const gm = d.monthly.filter(m=>m.growth!==null);
    h += '<div class="card mb"><h2>Month-over-Month Growth</h2><p class="cs">Net revenue change vs previous month (%)</p>'
      + vbars(gm,"month","growth",m=>m.growth>=0?"#10b981":"#ef4444",v=>v+"%",150)+'</div>';
    h += '<div class="card mb"><h2>Monthly Sales Report</h2><p class="cs">'+ (year==="All"?"All months":"Year "+year) +'</p>'
      + tableHTML("monthly", [
          ["Month", r=>esc(r.month)], ["Orders", r=>r.orders], ["Items", r=>r.items],
          ["Gross", r=>money(r.gross)], ["Refunds", r=>r.refunds>0?'<span class="dn2">'+money(r.refunds)+'</span>':"—"],
          ["Net Revenue", r=>'<span class="num">'+money(r.revenue)+'</span>'], ["AOV", r=>money(r.aov)],
          ["MoM", r=>r.growth===null?"—":'<span class="'+(r.growth>=0?"up2":"dn2")+'">'+(r.growth>=0?"&#9650;":"&#9660;")+" "+Math.abs(r.growth)+"%</span>"],
        ], d.monthly, false) + '</div>';
    h += '<div class="grid cols2">'
      + '<div class="card"><h2>Payment Gateways</h2><p class="cs">Successful captured payments (all time)</p>'
      + tableHTML("gateways", [["Gateway",r=>esc(r.name)],["Transactions",r=>r.count],["Amount",r=>'<span class="num">'+money(r.amount)+'</span>']], DATA.transactions.gateways, false) + '</div>'
      + '<div class="card"><h2>Order Status Breakdown</h2><p class="cs">'+DATA.transactions.refundsCount+' refund transactions totalling '+money(DATA.transactions.refundsAmount)+' (all time)</p>'+donut(d.financialMix,false)+'</div></div>';
  }
  if (tab==="items"){
    const b = d.topProducts[0] || {};
    h += '<div class="grid kpis">'
      + kpi("Items Sold", k.itemsSold.toLocaleString(), "#6366f1")
      + kpi("Best Seller", esc((b.name||"—").length>30?(b.name.slice(0,30)+"…"):(b.name||"—")), "#f59e0b", b.name?money(b.revenue)+" · "+b.qty+" sold":"")
      + kpi("Top Product Share", (b.share||0)+"%", "#10b981", "of item revenue")
      + '</div>';
    h += '<div class="grid cols2">'
      + '<div class="card"><h2>Top 10 Products by Revenue</h2><p class="cs">&nbsp;</p>'+hbars(d.topProducts.slice(0,10),"name","revenue",moneyS,"#6366f1")+'</div>'
      + '<div class="card"><h2>Revenue Share</h2><p class="cs">Top 7 products vs everything else</p>'+donut(d.productPie,true)+'</div></div>';
    h += '<div class="card mb" style="margin-top:18px"><h2>Product Performance — Top '+d.topProducts.length+'</h2><p class="cs">By item revenue</p>'
      + tableHTML("products", [
          ["Product", r=>esc(r.name)], ["SKU", r=>esc(r.sku||"—")], ["Qty Sold", r=>r.qty], ["Order Lines", r=>r.orders],
          ["Avg Price", r=>money(r.avgPrice)], ["Revenue", r=>'<span class="num">'+money(r.revenue)+'</span>'], ["Share", r=>r.share+"%"],
        ], d.topProducts, true) + '</div>';
  }
  if (tab==="customers"){
    const newC = d.monthly.reduce((s,m)=>s+m.newCustomers,0);
    h += '<div class="grid kpis">'
      + kpi("Customers (period)", k.customers.toLocaleString(), "#6366f1")
      + kpi("New Customers", newC.toLocaleString(), "#10b981", "first purchase in period")
      + kpi("Repeat Rate", k.repeatRate+"%", "#f59e0b", k.repeatCustomers+" bought more than once")
      + kpi("Registered (all time)", DATA.customers.total.toLocaleString(), "#3b82f6", DATA.customers.withOrders+" with orders")
      + '</div>';
    h += '<div class="card mb"><h2>New Customers by Month</h2><p class="cs">Customers whose first-ever purchase falls in that month</p>'+vbars(d.monthly,"month","newCustomers","#06b6d4")+'</div>';
    h += '<div class="card mb"><h2>Top Customers — '+(year==="All"?"All Years":year)+'</h2><p class="cs">Ranked by net spend in the selected period</p>'
      + tableHTML("topcust", [
          ["Customer", r=>esc(r.name)], ["Contact", r=>esc(r.contact)], ["Orders", r=>r.orders], ["Items", r=>r.items],
          ["Avg Order", r=>money(r.aov)], ["Total Spend", r=>'<span class="num">'+money(r.spend)+'</span>'],
        ], d.topCustomers, true) + '</div>';
    h += '<div class="card mb"><h2>Customer Directory — Lifetime</h2><p class="cs">Top '+DATA.customers.list.length+' by lifetime spend</p>'
      + tableHTML("dir", [
          ["Customer", r=>esc(r.name)], ["Email", r=>esc(r.email||"—")], ["Phone", r=>esc(r.phone||"—")], ["City", r=>esc(r.city||"—")],
          ["Orders", r=>r.orders], ["Lifetime Spend", r=>'<span class="num">'+money(r.spent)+'</span>'],
        ], DATA.customers.list, true) + '</div>';
  }
  document.getElementById("app").innerHTML = h;
}
function setYear(y){ year=y; render(); }
function setTab(t){ tab=t; render(); }
render();
</script>
</body>
</html>`.replace("GENDATE", new Date().toISOString().slice(0, 10));

const outName = "AquaGallery-2025-Dashboard.html";
const projOut = path.join(__dirname, "..", outName);
fs.writeFileSync(projOut, html);
console.log(`Wrote ${projOut} (${Math.round(fs.statSync(projOut).size / 1024)} KB)`);
