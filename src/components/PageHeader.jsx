"use client";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

/**
 * crumbs: array of [label, href?] — last crumb is the current page (no link).
 */
export default function PageHeader({ crumbs = [], title, subtitle, actions }) {
  return (
    <div className="space-y-2">
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="flex items-center gap-1 transition hover:text-rose-600 dark:hover:text-rose-400">
          <Home size={12} /> Home
        </Link>
        {crumbs.map(([label, href], i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
            {href ? (
              <Link href={href} className="transition hover:text-rose-600 dark:hover:text-rose-400">{label}</Link>
            ) : (
              <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
