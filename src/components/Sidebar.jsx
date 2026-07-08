"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./PanelShell";
import {
  LayoutDashboard, Building2, UserPlus, Package, Boxes,
  ShoppingCart, ReceiptText, ClipboardCheck, BarChart3, Settings, X, Container,
  LogOut, ChevronsLeft, ChevronsRight, FileSignature, StickyNote, Receipt, FileSpreadsheet,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/pricelist", label: "Pricelist", icon: FileSpreadsheet },
  { href: "/customers", label: "Customer Agreements", icon: FileSignature },
  { href: "/work-notes", label: "Work Notes - Thizam", icon: StickyNote },
  { href: "/misc-expense", label: "Misc Expense", icon: Receipt },
  { href: "/leads", label: "New Leads", icon: UserPlus },
  { href: "/products", label: "Products Sourced", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Vendor Invoices", icon: ReceiptText },
  { href: "/receipts", label: "Receipts (GRN)", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, user } = useApp();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-[#3a0a22] to-[#52102f] text-pink-100/80 transition-all duration-200 border-r border-pink-950/40 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "w-64 lg:w-[76px]" : "w-64"}`}
      >
        {/* Logo / company */}
        <div className={`flex items-center gap-3 border-b border-pink-300/15 py-5 ${collapsed ? "px-5 lg:justify-center lg:px-3" : "px-5"}`}>
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="logo" className="h-9 w-9 shrink-0 rounded-lg bg-white/10 object-contain p-1" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-600/40">
              <Container size={18} />
            </div>
          )}
          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="truncate text-sm font-bold text-white">{settings.companyName || "ProcureHub"}</p>
            <p className="text-[11px] text-pink-200/70">Procurement Control Panel</p>
          </div>
          <button className="ml-auto text-pink-200/70 lg:hidden" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? "px-3 lg:px-2.5" : "px-3"}`}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${active ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-600/30" : "hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggleCollapse}
          className="mx-3 mb-2 hidden items-center justify-center gap-2 rounded-lg border border-pink-300/15 py-2 text-xs text-pink-200/70 transition hover:bg-white/10 hover:text-white lg:flex"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> Collapse</>}
        </button>

        {/* Logged-in user */}
        <div className={`border-t border-pink-300/15 p-3 ${collapsed ? "lg:px-2" : ""}`}>
          <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "lg:flex-col lg:gap-2 lg:px-0" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-sm font-bold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold text-white">{user?.name || "—"}</p>
              <p className="truncate text-[11px] text-pink-200/70">@{user?.username || ""}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="shrink-0 rounded-lg p-2 text-pink-200/70 transition hover:bg-white/10 hover:text-rose-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
