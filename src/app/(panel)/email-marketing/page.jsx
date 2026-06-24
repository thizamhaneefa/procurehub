"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  Mail, Users, Layers, Crown, Sparkles, LayoutDashboard, Send, Megaphone, Image as ImageIcon,
  Copy, Download, Wand2, ClipboardPaste, Tag, Clock, AlertCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Badge from "@/components/Badge";
import { useApp } from "@/components/PanelShell";
import { fmtMoney, fmtMoneyShort, fmtDate } from "@/lib/format";
import { TEMPLATES, TONES, bannerSVG, BANNER_THEMES } from "@/lib/emailTemplates";
import DATA from "@/data/marketing2025.json";

const COLORS = ["#ec4899", "#f43f5e", "#fb7185", "#a855f7", "#f59e0b", "#ef4444", "#f472b6", "#c026d3", "#fda4af", "#64748b"];
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "segments", label: "Segments", icon: Layers },
  { id: "studio", label: "Campaign Studio", icon: Megaphone },
  { id: "ai", label: "AI Copywriter", icon: Sparkles },
];
const TIER_COLOR = { Platinum: "violet", Gold: "amber", Silver: "blue", Bronze: "gray" };
const axisTick = { fontSize: 11, fill: "#94a3b8" };
const tipStyle = { borderRadius: 10, fontSize: 12 };

function Card({ title, sub, children, className = "", actions }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export default function EmailMarketingPage() {
  const { settings } = useApp();
  const company = settings.companyName || "AquaGallery";
  const [tab, setTab] = useState("overview");
  const [aiConfig, setAiConfig] = useState({ hasApiKey: false, aiModel: "claude-opus-4-8" });

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => setAiConfig({ hasApiKey: s.hasApiKey, aiModel: s.aiModel })).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["Email Marketing"]]}
        title="Email Marketing"
        subtitle={`Targeted campaigns from your 2025 customer base — ${DATA.kpis.contactable} contactable customers, ${DATA.segments.length} segments`}
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === id ? "bg-rose-600 text-white shadow" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "segments" && <Segments company={company} />}
      {tab === "studio" && <Studio company={company} />}
      {tab === "ai" && <AIStudio company={company} aiConfig={aiConfig} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview() {
  const { kpis, tierCounts, categories } = DATA;
  const catChart = categories.map((c) => ({ name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name, customers: c.customers, revenue: c.revenue }));
  const tierChart = Object.entries(tierCounts).map(([name, value]) => ({ name, value }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Users} label="Contactable Customers" value={kpis.contactable.toLocaleString()} sub={`${kpis.withEmail} with email`} color="rose" />
        <KpiCard icon={Layers} label="Targeted Segments" value={kpis.segments} color="blue" />
        <KpiCard icon={Crown} label="VIP (Platinum)" value={tierCounts.Platinum} color="amber" />
        <KpiCard icon={Send} label="Service Prospects" value={kpis.serviceProspects} sub="own tanks / equipment" color="green" />
        <KpiCard icon={Clock} label="Win-Back Targets" value={kpis.lapsed} sub="lapsed 120+ days" color="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Customers by Category" sub="How many customers buy in each category — your targeting pool" className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catChart} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="name" width={150} tick={{ ...axisTick, fontSize: 10 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="customers" name="Customers" fill="#ec4899" radius={[0, 5, 5, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Customer Tiers" sub="Value-based tiers drive email frequency">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={3}>
                  {tierChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="How targeting works" sub="The strategy baked into these segments">
        <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Crown size={18} className="mb-2 text-amber-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Prioritise top customers</p>
            <p className="mt-1 text-xs">Every segment lists Platinum & Gold customers first — they get the most frequent, most premium emails.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Tag size={18} className="mb-2 text-rose-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Category relevance</p>
            <p className="mt-1 text-xs">Customers are matched to the categories they actually buy, so emails stay relevant and convert better.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Clock size={18} className="mb-2 text-emerald-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Smart cadence</p>
            <p className="mt-1 text-xs">Platinum weekly, Gold fortnightly, Silver monthly, Bronze every 6–8 weeks — set per customer.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <Send size={18} className="mb-2 text-rose-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Service upsell</p>
            <p className="mt-1 text-xs">Tank & equipment owners form a maintenance-service segment for recurring revenue.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Segments ---------------- */
function Segments({ company }) {
  const [active, setActive] = useState(DATA.segments[0]);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-1">
        {DATA.segments.map((s) => (
          <button key={s.id} onClick={() => setActive(s)}
            className={`w-full rounded-xl border p-4 text-left transition ${active.id === s.id ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s.customerCount}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{s.description}</p>
          </button>
        ))}
      </div>
      <div className="lg:col-span-2">
        <Card title={active.name} sub={`${active.customerCount} customers · est. segment value ${fmtMoneyShort(active.totalValue)} · sorted by tier then spend`}>
          <DataTable
            columns={[
              { key: "name", label: "Customer", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.name}</span> },
              { key: "contact", label: "Contact", render: (r) => <span className="text-slate-500">{r.contact}</span> },
              { key: "tier", label: "Tier", render: (r) => <Badge status={r.tier} color={TIER_COLOR[r.tier]} /> },
              { key: "cadence", label: "Email Cadence" },
              { key: "segmentSpend", label: "Spend (segment)", render: (r) => fmtMoney(r.segmentSpend) },
              { key: "lastOrder", label: "Last Order", render: (r) => fmtDate(r.lastOrder), exportValue: (r) => r.lastOrder },
            ]}
            rows={active.customers}
            searchKeys={["name", "contact", "tier"]}
            filters={[{ key: "tier", label: "Tier", options: ["Platinum", "Gold", "Silver", "Bronze"] }]}
            pageSize={10}
            exportName={`segment-${active.id}-recipients`}
          />
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Campaign Studio ---------------- */
function fillTemplate(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function Studio({ company }) {
  const [segId, setSegId] = useState(DATA.segments[0].id);
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const [offer, setOffer] = useState("10% off your next purchase this week");
  const [cta, setCta] = useState("Reply to this email or visit us in-store.");
  const [theme, setTheme] = useState(BANNER_THEMES[0]);

  const segment = DATA.segments.find((s) => s.id === segId);
  const tpl = TEMPLATES.find((t) => t.id === tplId);
  const sampleName = segment.customers[0]?.name?.split(" ")[0] || "there";
  const vars = { first_name: sampleName, company_name: company, category: segment.name, offer, cta };
  const subject = fillTemplate(tpl.subject, vars);
  const bodyPreview = fillTemplate(tpl.body, vars);
  const banner = bannerSVG({ company, headline: tpl.name.replace(/ .*/, "") === "New" ? "New Arrivals" : segment.name, sub: offer, accent: theme.accent, accent2: theme.accent2 });

  function copy(text, label) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  }
  function downloadBanner() {
    const blob = new Blob([banner], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${segment.id}-banner.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function exportRecipients() {
    const rows = segment.customers;
    const keys = ["name", "contact", "tier", "cadence", "segmentSpend", "lastOrder"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [["Name", "Contact", "Tier", "Cadence", "Segment Spend", "Last Order"].map(esc).join(","),
      ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${segment.id}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="1 · Build your campaign" sub="Pick who it goes to and which template to use">
        <div className="space-y-4">
          <div>
            <label className="label">Target segment</label>
            <select className="input" value={segId} onChange={(e) => setSegId(e.target.value)}>
              {DATA.segments.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.customerCount})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Template</label>
            <select className="input" value={tplId} onChange={(e) => setTplId(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-400">{tpl.purpose}</p>
          </div>
          <div>
            <label className="label">Offer / hook (fills {"{{offer}}"})</label>
            <input className="input" value={offer} onChange={(e) => setOffer(e.target.value)} />
          </div>
          <div>
            <label className="label">Call to action (fills {"{{cta}}"})</label>
            <input className="input" value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
          <div>
            <label className="label">Banner theme</label>
            <div className="flex flex-wrap gap-2">
              {BANNER_THEMES.map((t) => (
                <button key={t.name} onClick={() => setTheme(t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${theme.name === t.name ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-300 dark:border-slate-700"}`}>
                  <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: t.accent }} />{t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button className="btn-primary" onClick={exportRecipients}><Download size={15} /> Export {segment.customerCount} Recipients (CSV)</button>
            <button className="btn-ghost" onClick={downloadBanner}><ImageIcon size={15} /> Download Banner</button>
          </div>
        </div>
      </Card>

      <Card title="2 · Email preview" sub="Personalized with a sample customer — merge fields fill per recipient on send" actions={
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => copy(`Subject: ${subject}\n\n${bodyPreview}`, "Email")}><Copy size={13} /> Copy</button>
      }>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div dangerouslySetInnerHTML={{ __html: banner }} className="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" />
          <div className="space-y-3 p-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{subject}</p>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">{bodyPreview}</pre>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Export the recipient CSV, then use it for mail-merge in Gmail/Outlook or any email tool. Merge fields like <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{"{{first_name}}"}</code> map to the Name column.
        </p>
      </Card>
    </div>
  );
}

/* ---------------- AI Copywriter ---------------- */
function AIStudio({ company, aiConfig }) {
  const [form, setForm] = useState({
    segment: DATA.segments[0].name, category: DATA.categories[0].name,
    goal: "Drive repeat purchases from engaged customers",
    tone: TONES[0], offer: "", productHints: "", channel: "marketing email",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generate() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/marketing/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company }),
      });
      const d = await res.json();
      setResult(d);
      if (d.mode === "ai") toast.success(`Generated with ${d.model}`);
      else if (d.mode === "manual") toast.info("No API key set — copy the prompt into Claude");
      else if (d.error) toast.error(d.error);
    } catch {
      toast.error("Generation failed");
    } finally {
      setBusy(false);
    }
  }
  const copy = (t, l) => navigator.clipboard.writeText(t).then(() => toast.success(`${l} copied`));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="AI Copywriter" sub="Generate subject lines + email body tailored to a segment">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Segment / audience</label>
              <select className="input" value={form.segment} onChange={setF("segment")}>
                {DATA.segments.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category focus</label>
              <select className="input" value={form.category} onChange={setF("category")}>
                {DATA.categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Campaign goal</label>
            <input className="input" value={form.goal} onChange={setF("goal")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tone</label>
              <select className="input" value={form.tone} onChange={setF("tone")}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <div>
              <label className="label">Channel</label>
              <select className="input" value={form.channel} onChange={setF("channel")}>
                <option>marketing email</option><option>SMS / WhatsApp message</option><option>short promo (social caption)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Offer / hook (optional)</label>
            <input className="input" value={form.offer} onChange={setF("offer")} placeholder="e.g. 15% off plants this weekend" />
          </div>
          <div>
            <label className="label">Products to mention (optional)</label>
            <input className="input" value={form.productHints} onChange={setF("productHints")} placeholder="e.g. Chihiros WRGB light, new Anubias range" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50">
            <span className="flex items-center gap-1.5 text-slate-500">
              {aiConfig.hasApiKey
                ? <><CheckCircle2 size={13} className="text-emerald-500" /> AI key set — one-click generation ({aiConfig.aiModel})</>
                : <><AlertCircle size={13} className="text-amber-500" /> No API key — generates a prompt to paste into Claude</>}
            </span>
          </div>

          <button className="btn-primary w-full" onClick={generate} disabled={busy}>
            <Wand2 size={16} /> {busy ? "Generating…" : aiConfig.hasApiKey ? "Generate with AI" : "Generate Prompt"}
          </button>
        </div>
      </Card>

      <Card title="Result" sub={aiConfig.hasApiKey ? "AI-written copy — edit and use" : "Copy this into Claude, then paste the result back"}>
        {!result && <p className="py-12 text-center text-sm text-slate-400">Fill in the campaign and hit Generate.</p>}

        {result?.mode === "ai" && (
          <div className="space-y-3">
            <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm dark:border-slate-800 dark:bg-slate-900">{result.text}</pre>
            <button className="btn-ghost" onClick={() => copy(result.text, "Copy")}><Copy size={14} /> Copy Result</button>
          </div>
        )}

        {(result?.mode === "manual" || result?.mode === "error") && (
          <div className="space-y-3">
            {result.mode === "error" && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10">{result.error} — use the prompt below instead.</p>}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Step 1 — copy this prompt into Claude</p>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">{result.prompt}</pre>
              <button className="btn-ghost mt-2 !px-3 !py-1.5 text-xs" onClick={() => copy(result.prompt, "Prompt")}><Copy size={13} /> Copy Prompt</button>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><ClipboardPaste size={13} /> Step 2 — paste Claude's reply here to keep it</p>
              <textarea className="input min-h-[140px]" placeholder="Paste the generated email here…" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
