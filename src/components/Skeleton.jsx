export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

const GRID = { 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5" };

export function SkeletonKpis({ count = 5 }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${GRID[count] || "xl:grid-cols-5"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-5">
          <Skeleton className="h-12 w-12 !rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "h-72" }) {
  return (
    <div className={`flex items-end gap-3 p-4 ${className}`}>
      {[40, 65, 50, 80, 60, 90, 70, 55, 75, 45, 85, 60].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-slate-200 dark:bg-slate-800" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function SkeletonRows({ cols = 5, rows = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="td">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  ));
}
