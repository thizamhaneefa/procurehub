"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, Bell, Sun, Moon, AlertTriangle, ReceiptText, Building2, Package, ShoppingCart, FileSignature, CalendarRange, Mail } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export default function Topbar({ onMenu }) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [showBell, setShowBell] = useState(false);
  const [notifs, setNotifs] = useState({ lowStock: [], overdue: [] });
  const searchRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    fetch("/api/notifications").then((r) => r.json()).then(setNotifs).catch(() => {});
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()).then(setResults).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ph-theme", next ? "dark" : "light");
  }

  function go(href) {
    setResults(null);
    setQ("");
    router.push(href);
  }

  const notifCount = (notifs.lowStock?.length || 0) + (notifs.overdue?.length || 0);

  const groups = results && [
    { label: "Suppliers", icon: Building2, items: (results.suppliers || []).map((s) => ({ id: s.id, text: s.name, sub: s.category, href: `/suppliers/${s.id}` })) },
    { label: "Customers", icon: FileSignature, items: (results.customers || []).map((c) => ({ id: c.id, text: c.name, sub: c.email, href: "/customers" })) },
    { label: "Products", icon: Package, items: (results.products || []).map((p) => ({ id: p.id, text: p.name, sub: p.sku, href: "/products" })) },
    { label: "Invoices", icon: ReceiptText, items: (results.invoices || []).map((i) => ({ id: i.id, text: i.invoiceNo, sub: i.supplier?.name, href: "/invoices" })) },
    { label: "Purchase Orders", icon: ShoppingCart, items: (results.pos || []).map((p) => ({ id: p.id, text: p.poNumber, sub: p.supplier?.name, href: `/purchase-orders/${p.id}` })) },
  ].filter((g) => g.items.length);

  return (
    <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <button className="btn-ghost !p-2 lg:hidden" onClick={onMenu}><Menu size={18} /></button>

      <div ref={searchRef} className="relative max-w-md flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search suppliers, products, invoices, POs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {groups && (
          <div className="card absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto p-2">
            {groups.length === 0 && <p className="p-3 text-sm text-slate-400">No results for “{q}”</p>}
            {groups.map((g) => (
              <div key={g.label}>
                <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
                {g.items.map((it) => (
                  <button
                    key={`${g.label}-${it.id}`}
                    onClick={() => go(it.href)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <g.icon size={15} className="shrink-0 text-slate-400" />
                    <span className="truncate font-medium">{it.text}</span>
                    {it.sub && <span className="ml-auto shrink-0 text-xs text-slate-400">{it.sub}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Link href="/email-marketing" className="btn-ghost !px-3 !py-2 text-xs font-semibold" title="Email Marketing">
          <Mail size={15} />
          <span className="hidden sm:inline">Email Marketing</span>
        </Link>
        <Link href="/2025" className="btn-ghost !px-3 !py-2 text-xs font-semibold" title="2025 Dashboard">
          <CalendarRange size={15} />
          <span className="hidden sm:inline">2025 Dashboard</span>
        </Link>
        <button onClick={toggleTheme} className="btn-ghost !p-2" title="Toggle theme">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div ref={bellRef} className="relative">
          <button onClick={() => setShowBell((v) => !v)} className="btn-ghost relative !p-2" title="Notifications">
            <Bell size={17} />
            {notifCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>
          {showBell && (
            <div className="card absolute right-0 top-full z-30 mt-2 max-h-96 w-80 overflow-y-auto p-2">
              <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</p>
              {notifCount === 0 && <p className="p-3 text-sm text-slate-400">All clear — no alerts.</p>}
              {notifs.overdue?.map((i) => (
                <button key={`o${i.id}`} onClick={() => { setShowBell(false); router.push("/invoices"); }} className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ReceiptText size={15} className="mt-0.5 shrink-0 text-rose-500" />
                  <span className="text-sm">
                    <span className="font-medium">{i.invoiceNo}</span> overdue — {i.supplier?.name}
                    <span className="block text-xs text-slate-400">{fmtMoney(i.amount, i.currency)}</span>
                  </span>
                </button>
              ))}
              {notifs.lowStock?.map((p) => (
                <button key={`l${p.id}`} onClick={() => { setShowBell(false); router.push("/inventory"); }} className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <span className="text-sm">
                    <span className="font-medium">{p.name}</span> low stock
                    <span className="block text-xs text-slate-400">{p.stockQty} left (reorder at {p.reorderLevel})</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
