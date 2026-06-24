"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppCtx = createContext({ settings: {}, user: null, refreshSettings: () => {}, confirm: async () => false });
export const useApp = () => useContext(AppCtx);
export const useConfirm = () => useContext(AppCtx).confirm;

export default function PanelShell({ children }) {
  const [settings, setSettings] = useState({ companyName: "ProcureHub", currency: "AED" });
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const refreshSettings = () =>
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});

  useEffect(() => {
    refreshSettings();
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then(setUser).catch(() => {});
    setCollapsed(localStorage.getItem("ph-sidebar") === "collapsed");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem("ph-sidebar", c ? "open" : "collapsed");
      return !c;
    });
  };

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setConfirmState({ ...opts, resolve })),
    []
  );
  const closeConfirm = (val) => {
    confirmState?.resolve(val);
    setConfirmState(null);
  };

  return (
    <AppCtx.Provider value={{ settings, user, refreshSettings, confirm }}>
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
          <Topbar onMenu={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => closeConfirm(false)} />
          <div className="card relative z-10 w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white">{confirmState.title || "Are you sure?"}</h3>
                <p className="mt-1 text-sm text-slate-500">{confirmState.message || "This action cannot be undone."}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => closeConfirm(false)} autoFocus>Cancel</button>
              <button className="btn-danger" onClick={() => closeConfirm(true)}>
                {confirmState.confirmText || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppCtx.Provider>
  );
}
