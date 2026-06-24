"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { Wallet, Building2, ReceiptText, PackageOpen, ShoppingCart, Activity as ActivityIcon, Database } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { SkeletonKpis, SkeletonChart, Skeleton } from "@/components/Skeleton";
import { fmtMoney, fmtMoneyShort, timeAgo } from "@/lib/format";

const PIE_COLORS = ["#ec4899", "#f43f5e", "#fb7185", "#a855f7", "#f59e0b", "#f472b6"];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader crumbs={[["Dashboard"]]} title="Dashboard" subtitle="Procurement & inventory overview" />
        <SkeletonKpis count={5} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="card p-5 xl:col-span-2"><Skeleton className="mb-4 h-5 w-56" /><SkeletonChart /></div>
          <div className="card p-5"><Skeleton className="mb-4 h-5 w-40" /><SkeletonChart /></div>
        </div>
      </div>
    );
  }
  const { kpis, monthlySpend, byCategory, topSuppliers, activity } = data;
  const hasSpend = byCategory.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[["Dashboard"]]} title="Dashboard" subtitle="Procurement & inventory overview" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Wallet} label="Spend This Month" value={fmtMoneyShort(kpis.spendThisMonth)} color="rose" trend={kpis.spendTrend} />
        <KpiCard icon={Building2} label="Active Suppliers" value={kpis.activeSuppliers} color="blue" sub={kpis.newSuppliersThisMonth > 0 ? `+${kpis.newSuppliersThisMonth} this month` : undefined} />
        <KpiCard icon={ReceiptText} label="Pending Invoices" value={kpis.pendingInvoices} sub={fmtMoneyShort(kpis.pendingAmount)} color="amber" />
        <KpiCard icon={PackageOpen} label="Low Stock Items" value={kpis.lowStock} color="red" />
        <KpiCard icon={ShoppingCart} label="Open POs" value={kpis.openPOs} color="green" trend={kpis.poTrend} trendLabel="orders vs last month" />
      </div>

      {!hasSpend && (
        <div className="card">
          <EmptyState
            title="No data yet — let's get you set up"
            description="Add suppliers and products manually, import them from Excel, or load the sample dataset to explore the panel."
          >
            <Link href="/suppliers" className="btn-primary">Add Suppliers</Link>
            <Link href="/products" className="btn-ghost">Add Products</Link>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Database size={13} /> or run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">npm run db:demo</code> for sample data</span>
          </EmptyState>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Monthly Spend — Last 12 Months</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} />
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 10 }} />
                <Line type="monotone" dataKey="spend" name="Spend (AED)" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Spend by Category</h2>
          <div className="h-72">
            {hasSpend ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState compact title="No spend recorded" description="Spend by category appears once invoices are added." />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Top 5 Suppliers by Spend</h2>
          <div className="h-72">
            {topSuppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 10 }} />
                  <Bar dataKey="spend" name="Spend (AED)" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState compact title="No supplier spend yet" description="Top suppliers appear once invoices are recorded." />
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <ActivityIcon size={16} className="text-rose-500" /> Recent Activity
          </h2>
          {activity.length === 0 ? (
            <EmptyState compact title="No activity yet" description="Actions you take will appear here." />
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  <div className="min-w-0">
                    <p className="text-slate-700 dark:text-slate-300">{a.message}</p>
                    <p className="text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
