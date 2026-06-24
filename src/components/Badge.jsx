const STYLES = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  gray: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
};

const STATUS_COLOR = {
  Active: "green", Inactive: "gray",
  Paid: "green", Pending: "amber", Approved: "blue", Overdue: "red",
  Draft: "gray", Sent: "blue", "Partially Received": "amber", Received: "green", Closed: "gray",
  New: "blue", Contacted: "cyan", "Quotation Received": "violet",
  "Sample Requested": "amber", Rejected: "red",
  IN: "green", OUT: "red", "Low Stock": "red", "In Stock": "green",
};

export default function Badge({ status, color }) {
  const c = STYLES[color || STATUS_COLOR[status] || "gray"];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>
      {status}
    </span>
  );
}
