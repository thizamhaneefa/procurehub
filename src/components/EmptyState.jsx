export default function EmptyState({ title = "Nothing here yet", description, children, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"}`}>
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="mb-4 text-slate-300 dark:text-slate-700">
        <rect x="20" y="26" width="80" height="54" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 40h80" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="29" cy="33" r="2.2" fill="currentColor" />
        <circle cx="37" cy="33" r="2.2" fill="currentColor" />
        <circle cx="45" cy="33" r="2.2" fill="currentColor" />
        <rect x="30" y="50" width="36" height="5" rx="2.5" fill="currentColor" opacity="0.55" />
        <rect x="30" y="61" width="52" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="30" y="72" width="24" height="5" rx="2.5" fill="currentColor" opacity="0.25" />
        <circle cx="95" cy="20" r="13" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M90 20h10M95 15v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {children && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
