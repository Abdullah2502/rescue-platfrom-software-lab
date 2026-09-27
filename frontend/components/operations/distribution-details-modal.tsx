"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  ClipboardCheck, Building2, MapPin, Calendar, Pencil, X, Save,
  ShieldCheck, Clock, ExternalLink, CheckCircle2, AlertTriangle, Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { submitWithOffline } from "@/lib/offline";
import type {
  DistributionResponse,
  DistributionStatus,
  InventoryItemResponse,
  ShelterResponse,
} from "@/lib/types";

const selectClass =
  "h-9 w-full rounded border border-ink-300 bg-surface px-3 text-sm text-ink focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

interface DistributionDetailsModalProps {
  distribution: DistributionResponse | null;
  isOpen: boolean;
  canEdit: boolean;
  inventory?: InventoryItemResponse[];
  shelters?: ShelterResponse[];
  onClose: () => void;
  onUpdated: () => void;
}

export function DistributionDetailsModal({
  distribution,
  isOpen,
  canEdit,
  inventory = [],
  shelters = [],
  onClose,
  onUpdated,
}: DistributionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shelterId: "",
    inventoryItemId: "",
    recipientGroup: "",
    quantity: "1",
    distributedAt: new Date().toISOString().slice(0, 16),
    locationDescription: "",
    latitude: "",
    longitude: "",
    status: "PLANNED" as DistributionStatus,
    notes: "",
  });

  useEffect(() => {
    if (distribution) {
      setForm({
        shelterId: distribution.shelterId ? String(distribution.shelterId) : "",
        inventoryItemId: String(distribution.inventoryItemId),
        recipientGroup: distribution.recipientGroup,
        quantity: String(distribution.quantity),
        distributedAt: distribution.distributedAt
          ? new Date(distribution.distributedAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        locationDescription: distribution.locationDescription,
        latitude: distribution.latitude ? String(distribution.latitude) : "",
        longitude: distribution.longitude ? String(distribution.longitude) : "",
        status: distribution.status,
        notes: distribution.notes || "",
      });
      setIsEditing(false);
    }
  }, [distribution]);

  if (!isOpen || !distribution) return null;

  async function handleStatusChange(status: DistributionStatus) {
    if (!distribution) return;
    try {
      const result = await submitWithOffline<DistributionResponse>(
        `/api/v1/operations/distributions/${distribution.id}/status?status=${status}`,
        { method: "PATCH" },
        `Set distribution ${distribution.id} to ${status.toLowerCase()}`
      );
      toast(
        result.queued ? "info" : "success",
        result.queued ? "Status change queued offline" : "Distribution status updated"
      );
      onUpdated();
    } catch (err) {
      toast("error", "Failed to update status", err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!distribution) return;
    setSaving(true);

    const payload = {
      ...form,
      shelterId: form.shelterId ? Number(form.shelterId) : null,
      inventoryItemId: Number(form.inventoryItemId),
      quantity: Number(form.quantity),
      distributedAt: new Date(form.distributedAt).toISOString(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    try {
      const result = await submitWithOffline<DistributionResponse>(
        `/api/v1/operations/distributions/${distribution.id}`,
        { method: "PUT", body: JSON.stringify(payload) },
        `Update distribution for ${form.recipientGroup}`
      );
      toast(
        result.queued ? "info" : "success",
        result.queued ? "Update queued offline" : "Distribution updated successfully",
        result.queued ? "Changes will sync when connection returns." : undefined
      );
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      toast("error", "Failed to update distribution", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const recordDate = distribution.createdAt
    ? new Date(distribution.createdAt).toLocaleDateString()
    : new Date(distribution.distributedAt).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-6 bg-slate-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mt-1">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display text-slate-100">
                  {distribution.quantity} {distribution.unit} · {distribution.inventoryItemName}
                </h2>
                <StatusBadge status={distribution.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Dispatched by <strong className="text-slate-200">{distribution.ngoName}</strong></span>
                <span>·</span>
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Recorded {recordDate}</span>
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
                <Label>Inventory Supply</Label>
                <select
                  required
                  className={selectClass}
                  value={form.inventoryItemId}
                  onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}
                >
                  <option value="">Select stock line</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.quantity} {inv.unit} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Recipient Group</Label>
                <Input
                  required
                  placeholder="e.g. Ward 6 flood victims, 50 families"
                  value={form.recipientGroup}
                  onChange={(e) => setForm({ ...form, recipientGroup: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Distributed Quantity</Label>
                  <Input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Delivery Status</Label>
                  <select
                    className={selectClass}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as DistributionStatus })}
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scheduled Date & Time</Label>
                  <Input
                    required
                    type="datetime-local"
                    value={form.distributedAt}
                    onChange={(e) => setForm({ ...form, distributedAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Linked Shelter (Optional)</Label>
                  <select
                    className={selectClass}
                    value={form.shelterId}
                    onChange={(e) => setForm({ ...form, shelterId: e.target.value })}
                  >
                    <option value="">Not linked to a shelter</option>
                    {shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Delivery Location Description</Label>
                <Input
                  required
                  placeholder="Field clinic, union parishad building, roadside relief camp"
                  value={form.locationDescription}
                  onChange={(e) => setForm({ ...form, locationDescription: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude (Optional)</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Longitude (Optional)</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Operational Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Verification method, signature lists, recipient feedback..."
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
              {/* Quick status actions for authorized editors */}
              {canEdit && distribution.status !== "CANCELLED" && (
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold block">Delivery Status: {distribution.status}</span>
                    <span className="text-slate-400">Quickly update status of this dispatch:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {distribution.status === "PLANNED" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange("COMPLETED")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark Completed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusChange("CANCELLED")}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8"
                    >
                      Cancel Delivery
                    </Button>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Quantity Dispatched</span>
                  <strong className="text-lg font-display text-emerald-400">
                    {distribution.quantity} <span className="text-xs font-normal text-slate-400">{distribution.unit}</span>
                  </strong>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Recipient Target</span>
                  <strong className="text-sm font-semibold text-slate-200 block truncate mt-1">
                    {distribution.recipientGroup}
                  </strong>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 sm:col-span-1 col-span-2">
                  <span className="text-[11px] text-slate-400 block font-medium">Date & Time</span>
                  <strong className="text-sm font-semibold text-slate-200 block mt-1">
                    {new Date(distribution.distributedAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Location details */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <MapPin className="h-4 w-4 text-rose-400" />
                  <span>Distribution Location</span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{distribution.locationDescription}</p>
                {distribution.shelterName && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Associated Shelter: <strong className="text-slate-200">{distribution.shelterName}</strong></span>
                  </p>
                )}
                {distribution.latitude && distribution.longitude && (
                  <div className="pt-1">
                    <p className="text-xs text-slate-400 font-mono">
                      {distribution.latitude.toFixed(5)}, {distribution.longitude.toFixed(5)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${distribution.latitude},${distribution.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium pt-1"
                    >
                      Open location in Google Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {distribution.notes && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Operational Field Notes
                  </h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {distribution.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGood = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isGood
          ? "bg-emerald-500/10 text-emerald-400"
          : isCancelled
          ? "bg-red-500/10 text-red-400"
          : "bg-amber-500/10 text-amber-400"
      }`}
    >
      {status}
    </span>
  );
}
