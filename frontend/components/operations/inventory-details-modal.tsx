"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  Boxes, Building2, Calendar, Pencil, X, Save,
  ShieldCheck, Clock, AlertTriangle, ClipboardCheck, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { submitWithOffline } from "@/lib/offline";
import type {
  InventoryItemResponse,
  InventoryCategory,
  ShelterResponse,
  DistributionResponse,
} from "@/lib/types";

const selectClass =
  "h-9 w-full rounded border border-ink-300 bg-surface px-3 text-sm text-ink focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

interface InventoryDetailsModalProps {
  item: InventoryItemResponse | null;
  isOpen: boolean;
  canEdit: boolean;
  shelters?: ShelterResponse[];
  distributions?: DistributionResponse[];
  onClose: () => void;
  onUpdated: () => void;
}

export function InventoryDetailsModal({
  item,
  isOpen,
  canEdit,
  shelters = [],
  distributions = [],
  onClose,
  onUpdated,
}: InventoryDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shelterId: "",
    name: "",
    category: "FOOD" as InventoryCategory,
    quantity: "0",
    unit: "packs",
    reorderLevel: "10",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        shelterId: item.shelterId ? String(item.shelterId) : "",
        name: item.name,
        category: item.category,
        quantity: String(item.quantity),
        unit: item.unit,
        reorderLevel: String(item.reorderLevel),
        expiryDate: item.expiryDate || "",
        notes: item.notes || "",
      });
      setIsEditing(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const linkedDistributions = distributions.filter((d) => d.inventoryItemId === item.id);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);

    const payload = {
      ...form,
      shelterId: form.shelterId ? Number(form.shelterId) : null,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      expiryDate: form.expiryDate || null,
    };

    try {
      const result = await submitWithOffline<InventoryItemResponse>(
        `/api/v1/operations/inventory/${item.id}`,
        { method: "PUT", body: JSON.stringify(payload) },
        `Update inventory: ${form.name}`
      );
      toast(
        result.queued ? "info" : "success",
        result.queued ? "Update queued offline" : "Inventory updated successfully",
        result.queued ? "Changes will sync when connection returns." : undefined
      );
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      toast("error", "Failed to update inventory", err instanceof Error ? err.message : "Please try again.");
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
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 mt-1">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display text-slate-100">{item.name}</h2>
                <CategoryBadge category={item.category} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Managed by <strong className="text-slate-200">{item.ngoName}</strong></span>
                {item.updatedAt && (
                  <>
                    <span>·</span>
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
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
                <Label>Item Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    className={selectClass}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}
                  >
                    {["FOOD", "WATER", "MEDICAL", "HYGIENE", "CLOTHING", "EQUIPMENT", "OTHER"].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Assigned Location / Shelter</Label>
                  <select
                    className={selectClass}
                    value={form.shelterId}
                    onChange={(e) => setForm({ ...form, shelterId: e.target.value })}
                  >
                    <option value="">Central warehouse (Unassigned)</option>
                    {shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Unit of Measure</Label>
                  <Input
                    required
                    placeholder="packs, kg, boxes, liters"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Reorder Threshold</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Storage Notes / Details</Label>
                <Textarea
                  rows={3}
                  placeholder="Batch numbers, refrigeration required, packaging notes..."
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
              {/* Low stock alert */}
              {item.lowStock && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold">Low Stock Alert</h4>
                    <p className="text-xs text-red-300 mt-0.5">
                      Current supply ({item.quantity} {item.unit}) is at or below the minimum reorder threshold ({item.reorderLevel} {item.unit}).
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Available Quantity</span>
                  <strong className={`text-lg font-display ${item.lowStock ? "text-red-400 font-bold" : "text-slate-100"}`}>
                    {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </strong>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Reorder Threshold</span>
                  <strong className="text-lg font-display text-slate-100">
                    {item.reorderLevel} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </strong>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Location</span>
                  <strong className="text-sm font-semibold text-slate-200 truncate block mt-1">
                    {item.shelterName ?? "Central Warehouse"}
                  </strong>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Expiry Date</span>
                  <strong className="text-sm font-semibold text-slate-200 block mt-1">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "Non-perishable"}
                  </strong>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Storage & Batch Notes
                  </h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}

              {/* Linked Distributions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                  Recent Deliveries From This Stock Line ({linkedDistributions.length})
                </h4>
                {linkedDistributions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                    No distributions recorded for this inventory item yet.
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
                            {dist.quantity} {item.unit} to {dist.recipientGroup}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {dist.locationDescription} · {new Date(dist.distributedAt).toLocaleDateString()}
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

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
      {category}
    </span>
  );
}
