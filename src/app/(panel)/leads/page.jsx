"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Table2, Kanban, ArrowRightLeft, ChevronLeft, ChevronRight, CalendarClock, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ImportModal from "@/components/ImportModal";
import { useConfirm } from "@/components/PanelShell";
import { IMPORT_CONFIGS } from "@/lib/importConfigs";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/format";

const STAGES = ["New", "Contacted", "Quotation Received", "Sample Requested", "Approved", "Rejected"];
const SOURCES = ["Email", "Exhibition", "Referral", "Website"];
const EMPTY = { companyName: "", contact: "", email: "", phone: "", productOffered: "", quotedPrice: "", source: "Email", status: "New", notes: "", followUpDate: "" };

export default function LeadsPage() {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState("table");
  const [modal, setModal] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [convertForm, setConvertForm] = useState({ category: "General", paymentTerms: "Net 30", country: "", city: "" });
  const [cats, setCats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const confirm = useConfirm();

  const load = () => fetch("/api/leads").then((r) => r.json()).then(setRows).finally(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then(setCats);
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { mode, form } = modal;
    const res = await fetch(mode === "add" ? "/api/leads" : `/api/leads/${form.id}`, {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Lead saved"); setModal(null); load(); }
    else toast.error("Failed to save lead");
  }

  async function remove(row) {
    const ok = await confirm({
      title: `Delete lead "${row.companyName}"?`,
      message: "The lead and its notes will be permanently removed from the pipeline.",
    });
    if (!ok) return;
    await fetch(`/api/leads/${row.id}`, { method: "DELETE" });
    toast.success("Lead deleted");
    load();
  }

  async function moveStage(lead, dir) {
    const i = STAGES.indexOf(lead.status);
    const next = STAGES[i + dir];
    if (!next) return;
    await fetch(`/api/leads/${lead.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function doConvert(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/leads/${convertLead.id}/convert`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(convertForm),
    });
    setSaving(false);
    if (res.ok) { toast.success(`${convertLead.companyName} converted to supplier`); setConvertLead(null); load(); }
    else toast.error("Conversion failed");
  }

  const setF = (k) => (e) => setModal((m) => ({ ...m, form: { ...m.form, [k]: e.target.value } }));

  const columns = [
    { key: "companyName", label: "Company", render: (r) => <span className="font-medium text-slate-900 dark:text-white">{r.companyName}</span> },
    { key: "contact", label: "Contact" },
    { key: "productOffered", label: "Product Offered" },
    { key: "quotedPrice", label: "Quoted Price", render: (r) => (r.quotedPrice != null ? fmtMoney(r.quotedPrice) : "—") },
    { key: "source", label: "Source" },
    { key: "status", label: "Stage", render: (r) => <Badge status={r.status} /> },
    { key: "followUpDate", label: "Follow-up", render: (r) => fmtDate(r.followUpDate), exportValue: (r) => fmtDate(r.followUpDate) },
    {
      key: "_actions", label: "", sortable: false, export: false,
      render: (r) => (
        <span className="flex gap-1">
          {r.status !== "Rejected" && (
            <button className="btn-ghost !px-2 !py-1 text-xs" title="Convert to Supplier" onClick={() => { setConvertLead(r); setConvertForm({ category: cats[0]?.name || "General", paymentTerms: "Net 30", country: "", city: "" }); }}>
              <ArrowRightLeft size={13} /> Convert
            </button>
          )}
          <button className="btn-ghost !p-1.5" onClick={() => setModal({ mode: "edit", form: { ...r, quotedPrice: r.quotedPrice ?? "", followUpDate: toInputDate(r.followUpDate), email: r.email || "", phone: r.phone || "", notes: r.notes || "" } })}><Pencil size={14} /></button>
          <button className="btn-ghost !p-1.5 !text-rose-500" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[["New Leads"]]}
        title="New Leads"
        subtitle={`Potential supplier pipeline — ${rows.length} leads`}
        actions={
          <>
            <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
              <button onClick={() => setView("table")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "table" ? "bg-rose-600 text-white" : "text-slate-500"}`}><Table2 size={14} /> Table</button>
              <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-rose-600 text-white" : "text-slate-500"}`}><Kanban size={14} /> Kanban</button>
            </div>
            <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import Excel</button>
            <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY } })}><Plus size={16} /> Add Lead</button>
          </>
        }
      />

      {view === "table" ? (
        <DataTable
          loading={loading}
          empty={
            <EmptyState title="No leads in the pipeline" description="Track potential new suppliers here — add one manually or import a list from Excel.">
              <button className="btn-primary" onClick={() => setModal({ mode: "add", form: { ...EMPTY } })}><Plus size={15} /> Add Lead</button>
              <button className="btn-ghost" onClick={() => setImportOpen(true)}><UploadCloud size={15} /> Import from Excel</button>
            </EmptyState>
          }
          columns={columns}
          rows={rows}
          searchKeys={["companyName", "contact", "productOffered", "source"]}
          filters={[
            { key: "status", label: "Stage", options: STAGES },
            { key: "source", label: "Source", options: SOURCES },
          ]}
          exportName="leads"
        />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[1100px] gap-4">
            {STAGES.map((stage) => {
              const cards = rows.filter((r) => r.status === stage);
              return (
                <div key={stage} className="w-64 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <Badge status={stage} />
                    <span className="text-xs font-semibold text-slate-400">{cards.length}</span>
                  </div>
                  <div className="space-y-3 rounded-xl bg-slate-200/50 p-2 dark:bg-slate-900/60 min-h-[120px]">
                    {cards.map((lead) => (
                      <div key={lead.id} className="card p-3">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{lead.companyName}</p>
                        <p className="text-xs text-slate-500">{lead.contact} · {lead.source}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{lead.productOffered}</p>
                        {lead.quotedPrice != null && <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">{fmtMoney(lead.quotedPrice)}</p>}
                        {lead.followUpDate && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400"><CalendarClock size={11} /> Follow-up {fmtDate(lead.followUpDate)}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="flex gap-0.5">
                            <button className="btn-ghost !p-1" disabled={STAGES.indexOf(stage) === 0} onClick={() => moveStage(lead, -1)} title="Previous stage"><ChevronLeft size={13} /></button>
                            <button className="btn-ghost !p-1" disabled={STAGES.indexOf(stage) >= STAGES.length - 1} onClick={() => moveStage(lead, 1)} title="Next stage"><ChevronRight size={13} /></button>
                          </span>
                          <span className="flex gap-0.5">
                            {stage !== "Rejected" && (
                              <button className="btn-ghost !p-1" title="Convert to Supplier" onClick={() => { setConvertLead(lead); setConvertForm({ category: cats[0]?.name || "General", paymentTerms: "Net 30", country: "", city: "" }); }}>
                                <ArrowRightLeft size={13} />
                              </button>
                            )}
                            <button className="btn-ghost !p-1" onClick={() => setModal({ mode: "edit", form: { ...lead, quotedPrice: lead.quotedPrice ?? "", followUpDate: toInputDate(lead.followUpDate), email: lead.email || "", phone: lead.phone || "", notes: lead.notes || "" } })}><Pencil size={13} /></button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        {...IMPORT_CONFIGS.leads}
        onDone={load}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Lead" : "Edit Lead"} wide>
        {modal && (
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label">Company Name *</label><input className="input" required value={modal.form.companyName} onChange={setF("companyName")} /></div>
            <div><label className="label">Contact Person</label><input className="input" value={modal.form.contact} onChange={setF("contact")} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={modal.form.email} onChange={setF("email")} /></div>
            <div><label className="label">Phone</label><input className="input" value={modal.form.phone} onChange={setF("phone")} /></div>
            <div><label className="label">Product Offered</label><input className="input" value={modal.form.productOffered} onChange={setF("productOffered")} /></div>
            <div><label className="label">Quoted Price (AED)</label><input type="number" step="0.01" className="input" value={modal.form.quotedPrice} onChange={setF("quotedPrice")} /></div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={modal.form.source} onChange={setF("source")}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="input" value={modal.form.status} onChange={setF("status")}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label className="label">Follow-up Date</label><input type="date" className="input" value={modal.form.followUpDate} onChange={setF("followUpDate")} /></div>
            <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={3} value={modal.form.notes} onChange={setF("notes")} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Lead"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!convertLead} onClose={() => setConvertLead(null)} title={`Convert "${convertLead?.companyName}" to Supplier`}>
        {convertLead && (
          <form onSubmit={doConvert} className="space-y-4">
            <p className="text-sm text-slate-500">This creates a new supplier record and marks the lead as Approved.</p>
            <div>
              <label className="label">Category</label>
              <select className="input" value={convertForm.category} onChange={(e) => setConvertForm((f) => ({ ...f, category: e.target.value }))}>
                {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={convertForm.paymentTerms} onChange={(e) => setConvertForm((f) => ({ ...f, paymentTerms: e.target.value }))}>
                {["Net 15", "Net 30", "Net 45", "Net 60", "LC at Sight", "T/T 30 Days"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Country</label><input className="input" value={convertForm.country} onChange={(e) => setConvertForm((f) => ({ ...f, country: e.target.value }))} /></div>
              <div><label className="label">City</label><input className="input" value={convertForm.city} onChange={(e) => setConvertForm((f) => ({ ...f, city: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConvertLead(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? "Converting…" : "Convert to Supplier"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
