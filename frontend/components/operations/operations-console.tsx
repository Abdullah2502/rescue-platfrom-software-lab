"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, Building2, ClipboardCheck, MapPinned, Pencil, RefreshCw, Save } from "lucide-react";
import { api } from "@/lib/api";
import { submitWithOffline } from "@/lib/offline";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import type {
  DistributionResponse,
  DistributionStatus,
  InventoryCategory,
  InventoryItemResponse,
  OperationsSummaryResponse,
  ShelterResponse,
  ShelterStatus,
} from "@/lib/types";

const OperationsMap = dynamic(
  () => import("./operations-map").then((module) => module.OperationsMap),
  { ssr: false, loading: () => <div className="h-[520px] animate-pulse rounded-2xl bg-slate-900" /> },
);

type Tab = "shelters" | "inventory" | "distributions" | "map";
const selectClass = "h-9 w-full rounded border border-ink-300 bg-surface px-3 text-sm text-ink focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

const emptyShelter = {
  name: "", address: "", latitude: "23.685", longitude: "90.3563", capacity: "100",
  currentOccupancy: "0", contactName: "", contactPhone: "", status: "OPEN" as ShelterStatus, notes: "",
};
const emptyInventory = {
  shelterId: "", name: "", category: "FOOD" as InventoryCategory, quantity: "0", unit: "packs",
  reorderLevel: "10", expiryDate: "", notes: "",
};
const emptyDistribution = {
  shelterId: "", inventoryItemId: "", recipientGroup: "", quantity: "1",
  distributedAt: new Date().toISOString().slice(0, 16), locationDescription: "", latitude: "", longitude: "",
  status: "COMPLETED" as DistributionStatus, notes: "",
};

export function OperationsConsole({ role }: { role: "ngo" | "volunteer" | "admin" }) {
  const canManage = role === "ngo";
  const [tab, setTab] = useState<Tab>("shelters");
  const [summary, setSummary] = useState<OperationsSummaryResponse | null>(null);
  const [shelters, setShelters] = useState<ShelterResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [distributions, setDistributions] = useState<DistributionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shelterForm, setShelterForm] = useState(emptyShelter);
  const [inventoryForm, setInventoryForm] = useState(emptyInventory);
  const [distributionForm, setDistributionForm] = useState(emptyDistribution);
  const [editingShelter, setEditingShelter] = useState<number | null>(null);
  const [editingInventory, setEditingInventory] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, shelterData, inventoryData, distributionData] = await Promise.all([
        api<OperationsSummaryResponse>("/api/v1/operations/summary"),
        api<ShelterResponse[]>("/api/v1/operations/shelters"),
        api<InventoryItemResponse[]>("/api/v1/operations/inventory"),
        api<DistributionResponse[]>("/api/v1/operations/distributions"),
      ]);
      setSummary(summaryData);
      setShelters(shelterData);
      setInventory(inventoryData);
      setDistributions(distributionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operational data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refreshTimer = window.setInterval(load, 30_000);
    window.addEventListener("nexora-operations-synced", load);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("nexora-operations-synced", load);
    };
  }, [load]);

  const availableInventory = useMemo(() => inventory.filter((item) => item.quantity > 0), [inventory]);

  async function saveShelter(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...shelterForm,
      latitude: Number(shelterForm.latitude), longitude: Number(shelterForm.longitude),
      capacity: Number(shelterForm.capacity), currentOccupancy: Number(shelterForm.currentOccupancy),
      clientReference: editingShelter ? undefined : crypto.randomUUID(),
    };
    try {
      const result = await submitWithOffline<ShelterResponse>(
        editingShelter ? `/api/v1/operations/shelters/${editingShelter}` : "/api/v1/operations/shelters",
        { method: editingShelter ? "PUT" : "POST", body: JSON.stringify(payload) },
        `${editingShelter ? "Update" : "Create"} shelter: ${shelterForm.name}`,
      );
      toast(result.queued ? "info" : "success", result.queued ? "Shelter saved offline" : "Shelter saved", result.queued ? "It will sync automatically when the connection returns." : undefined);
      setShelterForm(emptyShelter); setEditingShelter(null);
      if (!result.queued) await load();
    } catch (err) { toast("error", "Shelter was not saved", message(err)); }
    finally { setSaving(false); }
  }

  async function saveInventory(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...inventoryForm,
      shelterId: inventoryForm.shelterId ? Number(inventoryForm.shelterId) : null,
      quantity: Number(inventoryForm.quantity), reorderLevel: Number(inventoryForm.reorderLevel),
      expiryDate: inventoryForm.expiryDate || null,
      clientReference: editingInventory ? undefined : crypto.randomUUID(),
    };
    try {
      const result = await submitWithOffline<InventoryItemResponse>(
        editingInventory ? `/api/v1/operations/inventory/${editingInventory}` : "/api/v1/operations/inventory",
        { method: editingInventory ? "PUT" : "POST", body: JSON.stringify(payload) },
        `${editingInventory ? "Update" : "Add"} inventory: ${inventoryForm.name}`,
      );
      toast(result.queued ? "info" : "success", result.queued ? "Inventory saved offline" : "Inventory saved", result.queued ? "It will sync automatically when the connection returns." : undefined);
      setInventoryForm(emptyInventory); setEditingInventory(null);
      if (!result.queued) await load();
    } catch (err) { toast("error", "Inventory was not saved", message(err)); }
    finally { setSaving(false); }
  }

  async function saveDistribution(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...distributionForm,
      shelterId: distributionForm.shelterId ? Number(distributionForm.shelterId) : null,
      inventoryItemId: Number(distributionForm.inventoryItemId), quantity: Number(distributionForm.quantity),
      distributedAt: new Date(distributionForm.distributedAt).toISOString(),
      latitude: distributionForm.latitude ? Number(distributionForm.latitude) : null,
      longitude: distributionForm.longitude ? Number(distributionForm.longitude) : null,
      clientReference: crypto.randomUUID(),
    };
    try {
      const result = await submitWithOffline<DistributionResponse>(
        "/api/v1/operations/distributions", { method: "POST", body: JSON.stringify(payload) },
        `Record distribution for ${distributionForm.recipientGroup}`,
      );
      toast(result.queued ? "info" : "success", result.queued ? "Distribution saved offline" : "Distribution recorded", result.queued ? "It will sync automatically when the connection returns." : undefined);
      setDistributionForm(emptyDistribution);
      if (!result.queued) await load();
    } catch (err) { toast("error", "Distribution was not saved", message(err)); }
    finally { setSaving(false); }
  }

  async function changeDistributionStatus(id: number, status: DistributionStatus) {
    try {
      const result = await submitWithOffline<DistributionResponse>(
        `/api/v1/operations/distributions/${id}/status?status=${status}`,
        { method: "PATCH" }, `Set distribution ${id} to ${status.toLowerCase()}`,
      );
      toast(result.queued ? "info" : "success", result.queued ? "Status change queued" : "Distribution updated");
      if (!result.queued) await load();
    } catch (err) { toast("error", "Status was not changed", message(err)); }
  }

  function editShelter(item: ShelterResponse) {
    setEditingShelter(item.id);
    setShelterForm({ name: item.name, address: item.address, latitude: String(item.latitude), longitude: String(item.longitude),
      capacity: String(item.capacity), currentOccupancy: String(item.currentOccupancy), contactName: item.contactName,
      contactPhone: item.contactPhone, status: item.status, notes: item.notes ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editInventory(item: InventoryItemResponse) {
    setEditingInventory(item.id);
    setInventoryForm({ shelterId: item.shelterId ? String(item.shelterId) : "", name: item.name, category: item.category,
      quantity: String(item.quantity), unit: item.unit, reorderLevel: String(item.reorderLevel),
      expiryDate: item.expiryDate ?? "", notes: item.notes ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <PageHeader
        title="Field operations"
        description={role === "ngo" ? "Manage shelter capacity, relief stock, and every distribution from one operational record. Changes can be captured offline." : "See active shelters, relief availability, and recent distributions across the response network."}
        actions={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open shelters" value={summary?.openShelters ?? "—"} />
        <StatCard label="Available beds" value={summary?.availableBeds ?? "—"} />
        <StatCard label="Stock lines" value={summary?.inventoryItems ?? "—"} />
        <StatCard label="Low stock" value={summary?.lowStockItems ?? "—"} />
        <StatCard label="Completed deliveries" value={summary?.completedDistributions ?? "—"} />
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-800" role="tablist" aria-label="Field operations sections">
        <TabButton active={tab === "shelters"} onClick={() => setTab("shelters")} icon={<Building2 className="h-4 w-4" />} label="Shelters" count={shelters.length} />
        <TabButton active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Boxes className="h-4 w-4" />} label="Inventory" count={inventory.length} />
        <TabButton active={tab === "distributions"} onClick={() => setTab("distributions")} icon={<ClipboardCheck className="h-4 w-4" />} label="Distributions" count={distributions.length} />
        <TabButton active={tab === "map"} onClick={() => setTab("map")} icon={<MapPinned className="h-4 w-4" />} label="Map" />
      </div>

      {error && <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error} <button onClick={load} className="ml-2 font-semibold underline">Try again</button></div>}

      <div className="mt-6">
        {tab === "shelters" && <div className={`grid gap-6 ${canManage ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
          {canManage && <OperationForm title={editingShelter ? "Update shelter" : "Add emergency shelter"} description="Record precise coordinates so responders can navigate to it.">
            <form onSubmit={saveShelter} className="space-y-4">
              <Field label="Shelter name"><Input required value={shelterForm.name} onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })} /></Field>
              <Field label="Address"><Textarea required rows={2} value={shelterForm.address} onChange={(e) => setShelterForm({ ...shelterForm, address: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Latitude"><Input required type="number" step="0.0000001" min="20" max="27" value={shelterForm.latitude} onChange={(e) => setShelterForm({ ...shelterForm, latitude: e.target.value })} /></Field><Field label="Longitude"><Input required type="number" step="0.0000001" min="88" max="93" value={shelterForm.longitude} onChange={(e) => setShelterForm({ ...shelterForm, longitude: e.target.value })} /></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Capacity"><Input required type="number" min="1" value={shelterForm.capacity} onChange={(e) => setShelterForm({ ...shelterForm, capacity: e.target.value })} /></Field><Field label="Occupied"><Input required type="number" min="0" max={shelterForm.capacity} value={shelterForm.currentOccupancy} onChange={(e) => setShelterForm({ ...shelterForm, currentOccupancy: e.target.value })} /></Field></div>
              <Field label="Contact name"><Input required value={shelterForm.contactName} onChange={(e) => setShelterForm({ ...shelterForm, contactName: e.target.value })} /></Field>
              <Field label="Contact phone"><Input required value={shelterForm.contactPhone} onChange={(e) => setShelterForm({ ...shelterForm, contactPhone: e.target.value })} /></Field>
              <Field label="Status"><select className={selectClass} value={shelterForm.status} onChange={(e) => setShelterForm({ ...shelterForm, status: e.target.value as ShelterStatus })}><option value="OPEN">Open</option><option value="FULL">Full</option><option value="CLOSED">Closed</option></select></Field>
              <Field label="Notes"><Textarea rows={2} value={shelterForm.notes} onChange={(e) => setShelterForm({ ...shelterForm, notes: e.target.value })} /></Field>
              <div className="flex gap-2"><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : editingShelter ? "Update shelter" : "Save shelter"}</Button>{editingShelter && <Button type="button" variant="ghost" onClick={() => { setEditingShelter(null); setShelterForm(emptyShelter); }}>Cancel</Button>}</div>
            </form>
          </OperationForm>}
          <ShelterList shelters={shelters} canManage={canManage} onEdit={editShelter} loading={loading} />
        </div>}

        {tab === "inventory" && <div className={`grid gap-6 ${canManage ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
          {canManage && <OperationForm title={editingInventory ? "Update stock line" : "Add inventory"} description="Set a reorder level to surface shortages before stock runs out.">
            <form onSubmit={saveInventory} className="space-y-4">
              <Field label="Item name"><Input required value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} /></Field>
              <Field label="Category"><select className={selectClass} value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value as InventoryCategory })}>{["FOOD","WATER","MEDICAL","HYGIENE","CLOTHING","EQUIPMENT","OTHER"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></Field>
              <Field label="Shelter"><select className={selectClass} value={inventoryForm.shelterId} onChange={(e) => setInventoryForm({ ...inventoryForm, shelterId: e.target.value })}><option value="">Central warehouse</option>{shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Quantity"><Input required type="number" min="0" step="0.01" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} /></Field><Field label="Unit"><Input required value={inventoryForm.unit} onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })} /></Field></div>
              <Field label="Low-stock threshold"><Input required type="number" min="0" step="0.01" value={inventoryForm.reorderLevel} onChange={(e) => setInventoryForm({ ...inventoryForm, reorderLevel: e.target.value })} /></Field>
              <Field label="Expiry date"><Input type="date" value={inventoryForm.expiryDate} onChange={(e) => setInventoryForm({ ...inventoryForm, expiryDate: e.target.value })} /></Field>
              <Field label="Notes"><Textarea rows={2} value={inventoryForm.notes} onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })} /></Field>
              <div className="flex gap-2"><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : editingInventory ? "Update inventory" : "Add inventory"}</Button>{editingInventory && <Button type="button" variant="ghost" onClick={() => { setEditingInventory(null); setInventoryForm(emptyInventory); }}>Cancel</Button>}</div>
            </form>
          </OperationForm>}
          <InventoryList inventory={inventory} canManage={canManage} onEdit={editInventory} loading={loading} />
        </div>}

        {tab === "distributions" && <div className={`grid gap-6 ${canManage ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
          {canManage && <OperationForm title="Record a distribution" description="Completed records deduct the quantity from inventory automatically.">
            <form onSubmit={saveDistribution} className="space-y-4">
              <Field label="Inventory item"><select required className={selectClass} value={distributionForm.inventoryItemId} onChange={(e) => setDistributionForm({ ...distributionForm, inventoryItemId: e.target.value })}><option value="">Select stock</option>{availableInventory.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity} {item.unit}</option>)}</select></Field>
              <Field label="Recipient group"><Input required placeholder="Families at Ward 6" value={distributionForm.recipientGroup} onChange={(e) => setDistributionForm({ ...distributionForm, recipientGroup: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Quantity"><Input required type="number" min="0.01" step="0.01" value={distributionForm.quantity} onChange={(e) => setDistributionForm({ ...distributionForm, quantity: e.target.value })} /></Field><Field label="Status"><select className={selectClass} value={distributionForm.status} onChange={(e) => setDistributionForm({ ...distributionForm, status: e.target.value as DistributionStatus })}><option value="PLANNED">Planned</option><option value="COMPLETED">Completed</option></select></Field></div>
              <Field label="Date and time"><Input required type="datetime-local" value={distributionForm.distributedAt} onChange={(e) => setDistributionForm({ ...distributionForm, distributedAt: e.target.value })} /></Field>
              <Field label="Location"><Input required placeholder="Union council field office" value={distributionForm.locationDescription} onChange={(e) => setDistributionForm({ ...distributionForm, locationDescription: e.target.value })} /></Field>
              <Field label="Shelter"><select className={selectClass} value={distributionForm.shelterId} onChange={(e) => { const shelter = shelters.find((s) => s.id === Number(e.target.value)); setDistributionForm({ ...distributionForm, shelterId: e.target.value, latitude: shelter ? String(shelter.latitude) : distributionForm.latitude, longitude: shelter ? String(shelter.longitude) : distributionForm.longitude }); }}><option value="">Not linked to a shelter</option>{shelters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Latitude"><Input type="number" step="0.0000001" value={distributionForm.latitude} onChange={(e) => setDistributionForm({ ...distributionForm, latitude: e.target.value })} /></Field><Field label="Longitude"><Input type="number" step="0.0000001" value={distributionForm.longitude} onChange={(e) => setDistributionForm({ ...distributionForm, longitude: e.target.value })} /></Field></div>
              <Field label="Notes"><Textarea rows={2} value={distributionForm.notes} onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })} /></Field>
              <Button type="submit" disabled={saving || availableInventory.length === 0}><ClipboardCheck className="h-4 w-4" />{saving ? "Saving…" : "Record distribution"}</Button>
            </form>
          </OperationForm>}
          <DistributionList distributions={distributions} canManage={canManage} onStatus={changeDistributionStatus} loading={loading} />
        </div>}

        {tab === "map" && <OperationsMap shelters={shelters} distributions={distributions} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition ${active ? "text-slate-100 shadow-[inset_0_-2px_0_#ef4444]" : "text-slate-400 hover:text-slate-100"}`}>{icon}{label}{count != null && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] tabular-nums">{count}</span>}</button>;
}

function OperationForm({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="h-fit rounded-2xl bg-slate-900 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]"><h2 className="font-display text-xl font-bold text-slate-100">{title}</h2><p className="mt-1 mb-5 text-sm leading-relaxed text-slate-400">{description}</p>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label>{label}</Label>{children}</div>; }

function ShelterList({ shelters, canManage, onEdit, loading }: { shelters: ShelterResponse[]; canManage: boolean; onEdit: (item: ShelterResponse) => void; loading: boolean }) {
  if (!loading && shelters.length === 0) return <EmptyState title="No shelters recorded" description={canManage ? "Add the first emergency shelter and publish its live capacity." : "No emergency shelters are currently listed."} />;
  return <div className="space-y-3">{shelters.map((item) => { const available = Math.max(0, item.capacity - item.currentOccupancy); return <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-display text-lg font-bold text-slate-100">{item.name}</h3><Status status={item.status} /></div><p className="mt-1 text-sm text-slate-400">{item.address}</p><p className="mt-1 text-xs text-slate-500">Managed by {item.ngoName} · {item.contactName} · {item.contactPhone}</p></div>{canManage && <Button size="sm" variant="ghost" onClick={() => onEdit(item)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>}</div><div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4 text-sm"><Metric label="Capacity" value={item.capacity} /><Metric label="Occupied" value={item.currentOccupancy} /><Metric label="Available" value={available} emphasis={available === 0} /></div></article>; })}</div>;
}

function InventoryList({ inventory, canManage, onEdit, loading }: { inventory: InventoryItemResponse[]; canManage: boolean; onEdit: (item: InventoryItemResponse) => void; loading: boolean }) {
  if (!loading && inventory.length === 0) return <EmptyState title="No inventory recorded" description={canManage ? "Add relief supplies and set low-stock thresholds." : "No relief inventory is currently visible."} />;
  return <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900"><table className="nx-table"><thead><tr><th>Item</th><th>Location</th><th>Available</th><th>Threshold</th><th>Expiry</th>{canManage && <th />}</tr></thead><tbody>{inventory.map((item) => <tr key={item.id}><td><div className="font-semibold text-slate-100">{item.name}</div><div className="text-xs text-slate-500">{titleCase(item.category)} · {item.ngoName}</div></td><td>{item.shelterName ?? "Central warehouse"}</td><td><span className={item.lowStock ? "font-semibold text-red-400" : "text-slate-200"}>{item.quantity} {item.unit}</span>{item.lowStock && <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">Reorder now</div>}</td><td>{item.reorderLevel} {item.unit}</td><td>{item.expiryDate ?? "—"}</td>{canManage && <td><Button size="sm" variant="ghost" onClick={() => onEdit(item)}><Pencil className="h-3.5 w-3.5" /> Edit</Button></td>}</tr>)}</tbody></table></div>;
}

function DistributionList({ distributions, canManage, onStatus, loading }: { distributions: DistributionResponse[]; canManage: boolean; onStatus: (id: number, status: DistributionStatus) => void; loading: boolean }) {
  if (!loading && distributions.length === 0) return <EmptyState title="No distributions recorded" description={canManage ? "Record a planned or completed aid delivery." : "No aid distributions are currently listed."} />;
  return <div className="space-y-3">{distributions.map((item) => <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-display text-lg font-bold text-slate-100">{item.inventoryItemName}</h3><Status status={item.status} /></div><p className="mt-1 text-sm text-slate-300">{item.quantity} {item.unit} for {item.recipientGroup}</p><p className="mt-1 text-xs text-slate-500">{item.ngoName} · {item.locationDescription} · {new Date(item.distributedAt).toLocaleString()}</p></div>{canManage && item.status !== "CANCELLED" && <div className="flex gap-2">{item.status === "PLANNED" && <Button size="sm" onClick={() => onStatus(item.id, "COMPLETED")}>Mark completed</Button>}<Button size="sm" variant="ghost" onClick={() => onStatus(item.id, "CANCELLED")}>Cancel</Button></div>}</div>{item.notes && <p className="mt-4 border-t border-slate-800 pt-3 text-sm text-slate-400">{item.notes}</p>}</article>)}</div>;
}

function Status({ status }: { status: string }) { const danger = status === "FULL" || status === "CANCELLED" || status === "CLOSED"; const good = status === "OPEN" || status === "COMPLETED"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${good ? "bg-emerald-500/10 text-emerald-400" : danger ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{titleCase(status)}</span>; }
function Metric({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) { return <div><div className="text-xs text-slate-500">{label}</div><div className={`mt-1 font-display text-xl font-bold tabular-nums ${emphasis ? "text-red-400" : "text-slate-100"}`}>{value}</div></div>; }
function titleCase(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function message(error: unknown) { return error instanceof Error ? error.message : "Please try again."; }
