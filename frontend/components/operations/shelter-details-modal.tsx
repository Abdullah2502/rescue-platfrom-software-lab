"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  Building2, MapPin, Phone, User, Users,
  Pencil, X, Save, ShieldCheck, Clock, ExternalLink,
  Boxes, ClipboardCheck, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { submitWithOffline } from "@/lib/offline";
import type {
  ShelterResponse,
  ShelterStatus,
  InventoryItemResponse,
  DistributionResponse,
} from "@/lib/types";

const selectClass =
  "h-9 w-full rounded border border-ink-300 bg-surface px-3 text-sm text-ink focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

interface ShelterDetailsModalProps {
  shelter: ShelterResponse | null;
  isOpen: boolean;
  canEdit: boolean;
  inventory?: InventoryItemResponse[];
  distributions?: DistributionResponse[];
  onClose: () => void;
  onUpdated: () => void;
}

export function ShelterDetailsModal({
  shelter,
  isOpen,
  canEdit,
  inventory = [],
  distributions = [],
  onClose,
  onUpdated,
}: ShelterDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "23.685",
    longitude: "90.3563",
    capacity: "100",
    currentOccupancy: "0",
    contactName: "",
    contactPhone: "",
    status: "OPEN" as ShelterStatus,
    notes: "",
  });

  useEffect(() => {
    if (shelter) {
      setForm({
        name: shelter.name,
        address: shelter.address,
        latitude: String(shelter.latitude),
        longitude: String(shelter.longitude),
        capacity: String(shelter.capacity),
        currentOccupancy: String(shelter.currentOccupancy),
        contactName: shelter.contactName,
        contactPhone: shelter.contactPhone,
        status: shelter.status,
        notes: shelter.notes || "",
      });
      setIsEditing(false);
    }
  }, [shelter]);

  if (!isOpen || !shelter) return null;

  const linkedInventory = inventory.filter((i) => i.shelterId === shelter.id);
  const linkedDistributions = distributions.filter((d) => d.shelterId === shelter.id);
  const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
  const occupancyPercent = Math.min(
    100,
    Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100)
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shelter) return;
    setSaving(true);

    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      capacity: Number(form.capacity),
      currentOccupancy: Number(form.currentOccupancy),
    };

    try {
      const result = await submitWithOffline<ShelterResponse>(
        `/api/v1/operations/shelters/${shelter.id}`,
        { method: "PUT", body: JSON.stringify(payload) },
        `Update shelter: ${form.name}`
      );
      toast(
        result.queued ? "info" : "success",
        result.queued ? "Update queued offline" : "Shelter updated successfully",
        result.queued ? "Changes will sync when connection returns." : undefined
      );
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      toast("error", "Failed to update shelter", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-6 bg-slate-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mt-1">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display text-slate-100">{shelter.name}</h2>
                <StatusBadge status={shelter.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Managed by <strong className="text-slate-200">{shelter.ngoName}</strong></span>
                {shelter.updatedAt && (
                  <>
                    <span>·</span>
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>Updated {new Date(shelter.updatedAt).toLocaleDateString()}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !isEditing && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Shelter Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Full Address</Label>
                <Textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    required
                    type="number"
                    step="0.0000001"
                    min="20"
                    max="27"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    required
                    type="number"
                    step="0.0000001"
                    min="88"
                    max="93"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total Capacity (Persons)</Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Current Occupancy</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    max={form.capacity}
                    value={form.currentOccupancy}
                    onChange={(e) => setForm({ ...form, currentOccupancy: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    required
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Operational Status</Label>
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ShelterStatus })}
                >
                  <option value="OPEN">Open (Accepting evacuees)</option>
                  <option value="FULL">Full (At capacity)</option>
                  <option value="CLOSED">Closed (Inactive)</option>
                </select>
              </div>

              <div>
                <Label>Field Notes / Facilities</Label>
                <Textarea
                  rows={3}
                  placeholder="Water sources, electricity, medical availability..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Capacity Banner */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">Live Occupancy</span>
                  <span>{occupancyPercent}% filled</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyPercent >= 90
                        ? "bg-red-500"
                        : occupancyPercent >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Capacity</span>
                    <strong className="text-base text-slate-100 font-display">{shelter.capacity}</strong>
                  </div>
                  <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Occupied</span>
                    <strong className="text-base text-slate-100 font-display">{shelter.currentOccupancy}</strong>
                  </div>
                  <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Available Beds</span>
                    <strong className={`text-base font-display ${availableBeds === 0 ? "text-red-400 font-bold" : "text-emerald-400"}`}>
                      {availableBeds}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Location & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <span>Location</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{shelter.address}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {shelter.latitude.toFixed(5)}, {shelter.longitude.toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${shelter.latitude},${shelter.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium pt-1"
                  >
                    Open in Google Maps
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span>Site Coordinator</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{shelter.contactName}</p>
                  <a
                    href={`tel:${shelter.contactPhone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {shelter.contactPhone}
                  </a>
                </div>
              </div>

              {/* Notes */}
              {shelter.notes && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Field Notes & Facilities
                  </h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {shelter.notes}
                  </p>
                </div>
              )}

              {/* Linked Inventory */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-400" />
                  Relief Supplies Stored Here ({linkedInventory.length})
                </h4>
                {linkedInventory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                    No dedicated inventory line is currently assigned to this shelter.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {linkedInventory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.category}</p>
                        </div>
                        <span className={`text-xs font-bold ${item.lowStock ? "text-red-400" : "text-emerald-400"}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Distributions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                  Recent Distributions Dispatched Here ({linkedDistributions.length})
                </h4>
                {linkedDistributions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                    No aid delivery records are linked to this shelter yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {linkedDistributions.slice(0, 5).map((dist) => (
                      <div
                        key={dist.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {dist.quantity} {dist.unit} · {dist.inventoryItemName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            For {dist.recipientGroup} · {new Date(dist.distributedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            dist.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : dist.status === "CANCELLED"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {dist.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGood = status === "OPEN";
  const isFull = status === "FULL";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isGood
          ? "bg-emerald-500/10 text-emerald-400"
          : isFull
          ? "bg-amber-500/10 text-amber-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {status}
    </span>
  );
}
