import { TrendingUp, TrendingDown } from "lucide-react";

const COLORS = {
  // Girly palette: primary + "blue" lean pink/rose; green/amber/red kept semantic.
  indigo: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * trend: percent change vs previous period (number) or null/undefined to hide.
 * invertTrend: set true when an increase is BAD (e.g. overdue, low stock).
 */
export default function KpiCard({ icon: Icon, label, value, sub, color = "indigo", trend, trendLabel = "vs last month", invertTrend = false }) {
  const hasTrend = trend !== null && trend !== undefined && isFinite(trend);
  const up = hasTrend && trend >= 0;
  const good = invertTrend ? !up : up;
  return (
    <div className="card group p-5 transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${COLORS[color]}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="truncate text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && !hasTrend && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
      {hasTrend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${good ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}%
          </span>
          <span className="text-slate-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
