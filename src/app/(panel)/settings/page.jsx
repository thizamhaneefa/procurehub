"use client";
import { useEffect, useState } from "react";
import { Trash2, Plus, KeyRound, Building, Tags, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useApp, useConfirm } from "@/components/PanelShell";
import PageHeader from "@/components/PageHeader";
import { uploadFileDirect } from "@/lib/uploadClient";

export default function SettingsPage() {
  const { refreshSettings } = useApp();
  const confirm = useConfirm();
  const [profile, setProfile] = useState({ companyName: "", logoUrl: "", address: "" });
  const [cats, setCats] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [ai, setAi] = useState({ hasApiKey: false, aiModel: "claude-opus-4-8", newKey: "" });
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => {
      setProfile({ companyName: s.companyName || "", logoUrl: s.logoUrl || "", address: s.address || "" });
      setAi((a) => ({ ...a, hasApiKey: s.hasApiKey, aiModel: s.aiModel || "claude-opus-4-8" }));
    });
    loadCats();
  }, []);

  async function saveAi(e) {
    e.preventDefault();
    setBusy("ai");
    const payload = { aiModel: ai.aiModel };
    if (ai.newKey) payload.anthropicApiKey = ai.newKey;
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy("");
    if (res.ok) {
      const s = await res.json();
      setAi((a) => ({ ...a, hasApiKey: s.hasApiKey, newKey: "" }));
      toast.success("AI settings saved");
    } else toast.error("Failed to save AI settings");
  }

  async function clearKey() {
    const ok = await confirm({ title: "Remove AI API key?", message: "Email Marketing will fall back to manual (copy-paste) generation." });
    if (!ok) return;
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropicApiKey: "" }),
    });
    if (res.ok) { setAi((a) => ({ ...a, hasApiKey: false, newKey: "" })); toast.success("API key removed"); }
  }
  const loadCats = () => fetch("/api/categories").then((r) => r.json()).then(setCats);

  async function saveProfile(e) {
    e.preventDefault();
    setBusy("profile");
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setBusy("");
    if (res.ok) { toast.success("Company profile saved"); refreshSettings(); }
    else toast.error("Failed to save profile");
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("logo");
    try {
      const url = await uploadFileDirect(file);
      setProfile((p) => ({ ...p, logoUrl: url }));
      toast.success("Logo uploaded — click Save to apply");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy("");
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) { toast.error("New passwords do not match"); return; }
    setBusy("pwd");
    const res = await fetch("/api/auth/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwd),
    });
    setBusy("");
    if (res.ok) {
      toast.success("Password changed");
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed to change password");
    }
  }

  async function addCat(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    if (res.ok) { setNewCat(""); loadCats(); toast.success("Category added"); }
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Failed");
    }
  }

  async function delCat(c) {
    const ok = await confirm({
      title: `Delete category "${c.name}"?`,
      message: "Existing suppliers and products keep the category name — it just won't be offered for new records.",
    });
    if (!ok) return;
    await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    loadCats();
    toast.success("Category deleted");
  }

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[["Settings"]]} title="Settings" subtitle="Company profile, security & categories" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Building size={17} className="text-rose-500" /> Company Profile</h2>
          <div><label className="label">Company Name</label><input className="input" value={profile.companyName} onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))} /></div>
          <div><label className="label">Address (shown on printable documents)</label><input className="input" value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} /></div>
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-4">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt="logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain p-1 dark:border-slate-700" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-700">None</div>
              )}
              <input type="file" accept="image/*" onChange={uploadLogo} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-600 dark:file:bg-rose-500/15" />
              {busy === "logo" && <span className="text-xs text-slate-400">Uploading…</span>}
            </div>
          </div>
          <div className="flex justify-end"><button className="btn-primary" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save Profile"}</button></div>
        </form>

        <form onSubmit={changePassword} className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><KeyRound size={17} className="text-rose-500" /> Change Password</h2>
          <div><label className="label">Current Password</label><input type="password" required className="input" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">New Password</label><input type="password" required minLength={6} className="input" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} /></div>
            <div><label className="label">Confirm New Password</label><input type="password" required className="input" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} /></div>
          </div>
          <p className="text-xs text-slate-400">Minimum 6 characters. You stay signed in after changing.</p>
          <div className="flex justify-end"><button className="btn-primary" disabled={busy === "pwd"}>{busy === "pwd" ? "Updating…" : "Update Password"}</button></div>
        </form>
      </div>

      <form onSubmit={saveAi} className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Sparkles size={17} className="text-rose-500" /> AI Copywriting (optional)</h2>
        <p className="text-sm text-slate-500">
          The Email Marketing dashboard works fully without this. Add an Anthropic API key to enable one-click AI email generation.
          Without a key, it produces a prompt you paste into Claude yourself. The key is stored locally and never shown again after saving.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Anthropic API Key {ai.hasApiKey && <span className="text-emerald-600 dark:text-emerald-400">— key set ✓</span>}</label>
            <input type="password" className="input" placeholder={ai.hasApiKey ? "•••••••• (leave blank to keep)" : "sk-ant-..."} value={ai.newKey} onChange={(e) => setAi((a) => ({ ...a, newKey: e.target.value }))} />
          </div>
          <div>
            <label className="label">Model</label>
            <select className="input" value={ai.aiModel} onChange={(e) => setAi((a) => ({ ...a, aiModel: e.target.value }))}>
              <option value="claude-opus-4-8">Claude Opus 4.8 — most capable ($5 / $25 per 1M)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — balanced ($3 / $15)</option>
              <option value="claude-haiku-4-5">Claude Haiku 4.5 — cheapest, fast ($1 / $5)</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400">Get a key at console.anthropic.com → API Keys. Billing is pay-as-you-go and separate from any Claude subscription. A marketing email costs a fraction of a cent.</p>
        <div className="flex justify-end gap-2">
          {ai.hasApiKey && <button type="button" className="btn-ghost" onClick={clearKey}>Remove Key</button>}
          <button className="btn-primary" disabled={busy === "ai"}>{busy === "ai" ? "Saving…" : "Save AI Settings"}</button>
        </div>
      </form>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Tags size={17} className="text-rose-500" /> Product Categories</h2>
        <form onSubmit={addCat} className="mb-4 flex max-w-md gap-2">
          <input className="input" placeholder="New category name…" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="btn-primary shrink-0"><Plus size={15} /> Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              {c.name}
              <button onClick={() => delCat(c)} className="text-slate-400 hover:text-rose-500"><Trash2 size={13} /></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
