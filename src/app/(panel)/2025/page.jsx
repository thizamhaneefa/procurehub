"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, BarChart,
} from "recharts";
import {
  Wallet, ShoppingBag, Receipt, Package, Users, Repeat, TrendingUp, Crown,
  LayoutDashboard, BarChart3, Boxes, ContactRound, Banknote, Undo2, AlertTriangle,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import DATA from "@/data/sales2025.json";

const COLORS = ["#ec4899", "#f43f5e", "#fb7185", "#a855f7", "#f59e0b", "#ef4444", "#f472b6", "#c026d3", "#64748b"];
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sales", label: "Sales Report", icon: BarChart3 },
  { id: "items", label: "Item Analytics", icon: Boxes },
  { id: "customers", label: "Customers", icon: ContactRound },
];

const tooltipStyle = { borderRadius: 10, fontSize: 12 };
const axisTick = { fontSize: 11, fill: "#94a3b8" };
const kfmt = (v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}K` : v);

function Card({ title, sub, children, className = "" }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function MoneyPie({ data, money = true }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => (money ? fmtMoney(v) : v)} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard2025() {
  const [year, setYear] = useState(DATA.years.includes("2025") ? "2025" : "All");
  const [tab, setTab] = useState("overview");
  const d = DATA.byYear[year];

  const newCustomersTotal = useMemo(() => d.monthly.reduce((s, m) => s + m.newCustomers, 0), [d]);
  const bestSeller = d.topProducts[0];
  const trendLabel = year === "All" ? "" : `vs ${Number(year) - 1}`;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["2025 Dashboard"]]}
        title="2025 Dashboard"
        subtitle={`Final sales data — ${DATA.dateRange.from} to ${DATA.dateRange.to} (${DATA.excluded.voided} voided & ${DATA.excluded.cancelled} cancelled orders excluded)`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {DATA.years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  year === y ? "bg-rose-600 text-white shadow" : "border border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id ? "bg-rose-600 text-white shadow" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard icon={Wallet} label="Net Revenue" value={fmtMoneyShort(d.kpis.revenue)} color="rose" trend={d.kpis.revenueGrowth} trendLabel={trendLabel} />
            <KpiCard icon={ShoppingBag} label="Orders" value={d.kpis.orders.toLocaleString()} color="blue" trend={d.kpis.ordersGrowth} trendLabel={trendLabel} />
            <KpiCard icon={Receipt} label="Avg Order Value" value={fmtMoney(d.kpis.aov)} color="green" />
            <KpiCard icon={Package} label="Items Sold" value={d.kpis.itemsSold.toLocaleString()} color="amber" />
            <KpiCard icon={Users} label="Customers" value={d.kpis.customers.toLocaleString()} color="rose" />
            <KpiCard icon={Repeat} label="Repeat Rate" value={`${d.kpis.repeatRate}%`} sub={`${d.kpis.repeatCustomers} returning`} color="red" />
          </div>

          <Card title="Revenue & Orders by Month" sub="Net revenue (line) vs number of orders (bars)">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={d.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                  <XAxis dataKey="month" tick={axisTick} />
                  <YAxis yAxisId="rev" tick={axisTick} tickFormatter={kfmt} />
                  <YAxis yAxisId="ord" orientation="right" tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === "Net Revenue (AED)" ? fmtMoney(v) : v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="#fbcfe8" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Net Revenue (AED)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 2.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Payment Methods" sub="Share of net revenue">
              <MoneyPie data={d.paymentPie} />
            </Card>
            <Card title="Sales Channels" sub="Orders by source">
              <MoneyPie data={d.sourcePie} money={false} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Revenue by Weekday" sub="Which days bring the money">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.weekday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                    <XAxis dataKey="day" tick={axisTick} />
                    <YAxis tick={axisTick} tickFormatter={kfmt} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Orders by Hour of Day" sub="Shop traffic pattern (8:00–23:00)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                    <XAxis dataKey="hour" tick={{ ...axisTick, fontSize: 10 }} />
                    <YAxis tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============ SALES REPORT ============ */}
      {tab === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Banknote} label="Gross Sales" value={fmtMoneyShort(d.kpis.gross)} color="rose" />
            <KpiCard icon={Undo2} label="Refunded" value={fmtMoneyShort(d.kpis.refunds)} color="red" />
            <KpiCard icon={Wallet} label="Net Revenue" value={fmtMoneyShort(d.kpis.revenue)} color="green" trend={d.kpis.revenueGrowth} trendLabel={trendLabel} />
            <KpiCard icon={AlertTriangle} label="Failed Transactions" value={DATA.transactions.failures} sub="all time" color="amber" />
          </div>

          <Card title="Month-over-Month Growth" sub="Net revenue change vs previous month (%)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly.filter((m) => m.growth !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                  <XAxis dataKey="month" tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <Bar dataKey="growth" name="MoM Growth">
                    {d.monthly.filter((m) => m.growth !== null).map((m, i) => (
                      <Cell key={i} fill={m.growth >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Monthly Sales Report" sub="Export to CSV / Excel with the buttons on the right">
            <DataTable
              columns={[
                { key: "month", label: "Month" },
                { key: "orders", label: "Orders" },
                { key: "items", label: "Items" },
                { key: "gross", label: "Gross", render: (r) => fmtMoney(r.gross) },
                { key: "refunds", label: "Refunds", render: (r) => (r.refunds > 0 ? <span className="text-rose-500">{fmtMoney(r.refunds)}</span> : "—") },
                { key: "revenue", label: "Net Revenue", render: (r) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
                { key: "aov", label: "AOV", render: (r) => fmtMoney(r.aov) },
                {
                  key: "growth", label: "MoM",
                  render: (r) => r.growth === null ? "—" : (
                    <span className={`font-semibold ${r.growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {r.growth >= 0 ? "▲" : "▼"} {Math.abs(r.growth)}%
                    </span>
                  ),
                },
              ]}
              rows={d.monthly}
              searchKeys={["month"]}
              pageSize={12}
              exportName={`sales-report-${year}`}
            />
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Payment Gateways" sub="Successful captured payments (all time)">
              <DataTable
                columns={[
                  { key: "name", label: "Gateway", render: (r) => <span className="font-medium">{r.name}</span> },
                  { key: "count", label: "Transactions" },
                  { key: "amount", label: "Amount", render: (r) => <span className="font-semibold">{fmtMoney(r.amount)}</span> },
                ]}
                rows={DATA.transactions.gateways}
                searchKeys={["name"]}
                pageSize={10}
                exportName="payment-gateways"
              />
            </Card>
            <Card title="Order Status Breakdown" sub={`Orders in ${year === "All" ? "all years" : year} by financial status`}>
              <MoneyPie data={d.financialMix} money={false} />
              <p className="mt-2 text-center text-xs text-slate-400">
                {DATA.transactions.refundsCount} refund transactions totalling {fmtMoney(DATA.transactions.refundsAmount)} (all time)
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ============ ITEM ANALYTICS ============ */}
      {tab === "items" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard icon={Package} label="Items Sold" value={d.kpis.itemsSold.toLocaleString()} color="rose" />
            <KpiCard icon={Crown} label="Best Seller" value={bestSeller ? (bestSeller.name.length > 26 ? bestSeller.name.slice(0, 26) + "…" : bestSeller.name) : "—"} sub={bestSeller ? `${fmtMoney(bestSeller.revenue)} · ${bestSeller.qty} sold` : ""} color="amber" />
            <KpiCard icon={TrendingUp} label="Top Product Share" value={bestSeller ? `${bestSeller.share}%` : "—"} sub="of item revenue" color="green" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Top 10 Products by Revenue">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.topProducts.slice(0, 10)} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                    <XAxis type="number" tick={axisTick} tickFormatter={kfmt} />
                    <YAxis type="category" dataKey="name" width={190} tick={{ ...axisTick, fontSize: 10 }} tickFormatter={(v) => (v.length > 30 ? v.slice(0, 30) + "…" : v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#ec4899" radius={[0, 5, 5, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Revenue Share" sub="Top 7 products vs everything else">
              <MoneyPie data={d.productPie} />
            </Card>
          </div>

          <Card title={`Product Performance — Top ${d.topProducts.length}`} sub="By item revenue. Search, sort and export below.">
            <DataTable
              columns={[
                { key: "name", label: "Product", className: "max-w-[340px] !whitespace-normal", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "sku", label: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku || "—"}</span> },
                { key: "qty", label: "Qty Sold" },
                { key: "orders", label: "Order Lines" },
                { key: "avgPrice", label: "Avg Price", render: (r) => fmtMoney(r.avgPrice) },
                { key: "revenue", label: "Revenue", render: (r) => <span className="font-semibold">{fmtMoney(r.revenue)}</span> },
                { key: "share", label: "Share", render: (r) => `${r.share}%` },
              ]}
              rows={d.topProducts}
              searchKeys={["name", "sku"]}
              pageSize={15}
              exportName={`item-analytics-${year}`}
            />
          </Card>
        </div>
      )}

      {/* ============ CUSTOMERS ============ */}
      {tab === "customers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Users} label="Customers (period)" value={d.kpis.customers.toLocaleString()} color="rose" />
            <KpiCard icon={TrendingUp} label="New Customers" value={newCustomersTotal.toLocaleString()} sub="first purchase in period" color="green" />
            <KpiCard icon={Repeat} label="Repeat Rate" value={`${d.kpis.repeatRate}%`} sub={`${d.kpis.repeatCustomers} bought more than once`} color="amber" />
            <KpiCard icon={ContactRound} label="Registered (all time)" value={DATA.customers.total.toLocaleString()} sub={`${DATA.customers.withOrders} with orders`} color="blue" />
          </div>

          <Card title="New Customers by Month" sub="Customers whose first-ever purchase falls in that month">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                  <XAxis dataKey="month" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="newCustomers" name="New Customers" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title={`Top Customers — ${year === "All" ? "All Years" : year}`} sub="Ranked by net spend in the selected period">
            <DataTable
              columns={[
                { key: "name", label: "Customer", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "contact", label: "Contact", render: (r) => <span className="text-slate-500">{r.contact}</span> },
                { key: "orders", label: "Orders" },
                { key: "items", label: "Items" },
                { key: "aov", label: "Avg Order", render: (r) => fmtMoney(r.aov) },
                { key: "spend", label: "Total Spend", render: (r) => <span className="font-semibold">{fmtMoney(r.spend)}</span> },
              ]}
              rows={d.topCustomers}
              searchKeys={["name", "contact"]}
              pageSize={10}
              exportName={`top-customers-${year}`}
            />
          </Card>

          <Card title="Customer Directory — Lifetime" sub={`Top ${DATA.customers.list.length} by lifetime spend (from the customers export)`}>
            <DataTable
              columns={[
                { key: "name", label: "Customer", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "email", label: "Email", render: (r) => <span className="text-slate-500">{r.email || "—"}</span> },
                { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
                { key: "city", label: "City", render: (r) => r.city || "—" },
                { key: "orders", label: "Orders" },
                { key: "spent", label: "Lifetime Spend", render: (r) => <span className="font-semibold">{fmtMoney(r.spent)}</span> },
              ]}
              rows={DATA.customers.list}
              searchKeys={["name", "email", "phone", "city"]}
              pageSize={15}
              exportName="customer-directory"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
