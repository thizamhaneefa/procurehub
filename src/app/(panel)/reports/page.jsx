"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Wallet, ReceiptText, CheckCircle2 } from "lucide-react";
import DataTable from "@/components/DataTable";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { SkeletonKpis, SkeletonChart, Skeleton } from "@/components/Skeleton";
import { fmtMoney, toInputDate } from "@/lib/format";

const PIE_COLORS = ["#ec4899", "#f43f5e", "#fb7185", "#a855f7", "#f59e0b", "#f472b6"];

export default function ReportsPage() {
  const yearAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const [from, setFrom] = useState(toInputDate(yearAgo));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [data, setData] = useState(null);

  const load = (f = from, t = to) =>
    fetch(`/api/reports?from=${f}&to=${t}`).then((r) => r.json()).then(setData).catch(() => {});

  useEffect(() => { load(); }, []); // eslint-disable-line

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader crumbs={[["Reports"]]} title="Reports" subtitle="Spend & supplier performance" />
        <SkeletonKpis count={3} />
        <div className="card p-5"><Skeleton className="mb-4 h-5 w-48" /><SkeletonChart /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Reports"]]}
        title="Reports"
        subtitle="Spend & supplier performance — export any table to CSV or Excel"
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <div><label className="label">From</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="label">To</label><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <button className="btn-primary" onClick={() => load()}>Apply</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Wallet} label="Total Spend (Range)" value={fmtMoney(data.totals.spend)} color="rose" />
        <KpiCard icon={ReceiptText} label="Invoices in Range" value={data.totals.invoices} color="amber" />
        <KpiCard icon={CheckCircle2} label="Paid in Range" value={fmtMoney(data.totals.paid)} color="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Monthly Spend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} />
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 10 }} />
                <Bar dataKey="spend" name="Spend (AED)" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Spend by Category</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 10 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Monthly Spend Report</h2>
        <DataTable
          columns={[
            { key: "month", label: "Month" },
            { key: "invoices", label: "Invoices" },
            { key: "spend", label: "Total Spend", render: (r) => <span className="font-semibold">{fmtMoney(r.spend)}</span> },
          ]}
          rows={data.monthly}
          searchKeys={["month"]}
          pageSize={12}
          exportName="monthly-spend-report"
        />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Supplier Performance Report</h2>
        <DataTable
          columns={[
            { key: "name", label: "Supplier", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
            { key: "category", label: "Category" },
            { key: "country", label: "Country" },
            { key: "totalSpend", label: "Total Spend", render: (r) => <span className="font-semibold">{fmtMoney(r.totalSpend)}</span> },
            { key: "invoiceCount", label: "Invoices" },
            { key: "deliveries", label: "Deliveries" },
            {
              key: "onTimePct", label: "On-Time %",
              render: (r) => r.onTimePct == null ? <span className="text-slate-400">—</span> : (
                <span className={`font-semibold ${r.onTimePct >= 80 ? "text-emerald-600 dark:text-emerald-400" : r.onTimePct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {r.onTimePct}%
                </span>
              ),
            },
            { key: "avgPrice", label: "Avg Unit Price", render: (r) => (r.avgPrice == null ? "—" : fmtMoney(r.avgPrice)), exportValue: (r) => r.avgPrice ?? "" },
          ]}
          rows={data.performance}
          searchKeys={["name", "category", "country"]}
          pageSize={15}
          exportName="supplier-performance-report"
        />
      </div>
    </div>
  );
}
