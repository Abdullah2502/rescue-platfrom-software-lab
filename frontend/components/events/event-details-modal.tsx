"use client";

import { useState, useEffect } from "react";
import {
  X,
  Edit,
  Save,
  AlertCircle,
  CalendarDays,
  MapPin,
  Users,
  Building2,
  Mail,
  Phone,
  Globe,
  ArrowLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse, EventType, Severity, NgoResponse } from "@/lib/types";

interface EventDetailsModalProps {
  event: DisasterEventResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedEvent: DisasterEventResponse) => void;
  canEdit?: boolean;
  isSuperAdmin?: boolean;
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onSuccess,
  canEdit = false,
  isSuperAdmin = false,
}: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<DisasterEventResponse | null>(event);

  const [form, setForm] = useState({
    title: "",
    type: "FLOOD" as EventType,
    severity: "MEDIUM" as Severity,
    description: "",
    startAt: "",
    endAt: "",
    requiredVolunteers: 10,
    ngoId: "",
  });

  const [areas, setAreas] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ngos, setNgos] = useState<NgoResponse[]>([]);

  useEffect(() => {
    if (!isOpen || !event) {
      setIsEditing(false);
      return;
    }

    setCurrentEvent(event);
    setIsEditing(false);
    setError(null);

    // Convert ISO dates to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatForInput = (isoString?: string) => {
      if (!isoString) return "";
      const d = new Date(isoString);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setForm({
      title: event.title || "",
      type: event.type || "FLOOD",
      severity: event.severity || "MEDIUM",
      description: event.description || "",
      startAt: formatForInput(event.startAt),
      endAt: formatForInput(event.endAt),
      requiredVolunteers: event.requiredVolunteers || 10,
      ngoId: event.organizerId ? String(event.organizerId) : "",
    });

    setAreas({
      divisionId: event.divisions?.[0]?.id,
      districtId: event.districts?.[0]?.id,
      thanaId: event.thanas?.[0]?.id,
    });

    if (isSuperAdmin) {
      api<{ content: NgoResponse[] }>("/api/v1/admin/ngos?status=APPROVED&size=100")
        .then((res) => setNgos(res.content || []))
        .catch(() => { });
    }
  }, [isOpen, event, isSuperAdmin]);

  if (!isOpen || !currentEvent) return null;

  const up = (key: string, value: any) => setForm((curr) => ({ ...curr, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEvent) return;
    setBusy(true);
    setError(null);

    try {
      const updated = await api<DisasterEventResponse>(`/api/v1/events/${currentEvent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          severity: form.severity,
          description: form.description,
          requiredVolunteers: Number(form.requiredVolunteers),
          ngoId: form.ngoId ? Number(form.ngoId) : null,
          divisionIds: areas.divisionId ? [areas.divisionId] : [],
          districtIds: areas.districtId ? [areas.districtId] : [],
          thanaIds: areas.thanaId ? [areas.thanaId] : [],
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        }),
      });

      toast("success", "Event updated", `"${updated.title}" has been updated successfully.`);
      setCurrentEvent(updated);
      setIsEditing(false);
      onSuccess?.(updated);
    } catch (ex: any) {
      setError(ex.message || "Could not update event");
    } finally {
      setBusy(false);
    }
  }

  const isFormValid = !busy && form.title && form.startAt && form.endAt && areas.divisionId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto text-slate-100">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition mr-1"
                title="Back to details"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold font-display text-slate-100">
                {isEditing ? "Edit Disaster Event" : currentEvent.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing
                  ? "Update operational parameters, schedule, or locations."
                  : "Comprehensive operational overview and telemetry."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && canEdit && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* VIEW DETAILS MODE */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={currentEvent.status} />
              <EventTypeBadge type={currentEvent.type} />
              <SeverityBadge severity={currentEvent.severity} />
            </div>

            {/* Description */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Mission Description
              </h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {currentEvent.description || "No specific operational briefing provided for this event."}
              </p>
            </div>

            {/* Grid of Key Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  <span>Deployment Location</span>
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {currentEvent.divisions?.map((d) => d.name).join(", ") || "Nationwide / Bangladesh"}
                </div>
                {((currentEvent.districts && currentEvent.districts.length > 0) ||
                  (currentEvent.thanas && currentEvent.thanas.length > 0)) && (
                    <div className="text-xs text-slate-400">
                      {[
                        currentEvent.districts?.map((d) => d.name).join(", "),
                        currentEvent.thanas?.map((t) => t.name).join(", ")
                      ].filter(Boolean).join(" • ")}
                    </div>
                  )}
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  <CalendarDays className="h-3.5 w-3.5 text-red-500" />
                  <span>Schedule & Timing</span>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500">Starts:</span> {formatDateTime(currentEvent.startAt)}
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500">Ends:</span> {formatDateTime(currentEvent.endAt)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  <Users className="h-3.5 w-3.5 text-red-500" />
                  <span>Volunteers Roster</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-100">
                  {currentEvent.participantCount} <span className="text-xs font-normal text-slate-400">/ {currentEvent.requiredVolunteers} needed</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  <Building2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Assigned Authority / NGO</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {currentEvent.organizerName || "Super Admin (Platform)"}
                </div>
                <div className="text-xs text-slate-400 capitalize">
                  {currentEvent.organizerType?.toLowerCase()}
                </div>
              </div>
            </div>

            {/* Contact Details (if available) */}
            {(currentEvent.organizerEmail || currentEvent.organizerPhone || currentEvent.organizerWebsite) && (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Authority Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentEvent.organizerEmail && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{currentEvent.organizerEmail}</span>
                    </div>
                  )}
                  {currentEvent.organizerPhone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{currentEvent.organizerPhone}</span>
                    </div>
                  )}
                  {currentEvent.organizerWebsite && (
                    <div className="flex items-center gap-2 text-slate-300 col-span-full">
                      <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <a
                        href={currentEvent.organizerWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:underline truncate"
                      >
                        {currentEvent.organizerWebsite}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* EDIT MODE (Only accessible if canEdit is true) */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input value={form.title} onChange={(e) => up("title", e.target.value)} required />
            </div>

            {isSuperAdmin && (
              <div>
                <Label>Assigned NGO</Label>
                <select
                  className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink focus:border-signal focus:outline-none"
                  value={form.ngoId}
                  onChange={(e) => up("ngoId", e.target.value)}
                >
                  <option value="" disabled>Select an NGO...</option>
                  {ngos.map((ngo) => (
                    <option key={ngo.id} value={ngo.id}>
                      {ngo.name || `NGO #${ngo.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Event Type</Label>
                <select
                  className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink focus:border-signal focus:outline-none"
                  value={form.type}
                  onChange={(e) => up("type", e.target.value)}
                >
                  {["FLOOD", "CYCLONE", "EARTHQUAKE", "FIRE", "PANDEMIC", "OTHER"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Severity</Label>
                <select
                  className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink focus:border-signal focus:outline-none"
                  value={form.severity}
                  onChange={(e) => up("severity", e.target.value)}
                >
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Volunteers Needed</Label>
              <Input
                type="number"
                min={1}
                value={form.requiredVolunteers}
                onChange={(e) => up("requiredVolunteers", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => up("description", e.target.value)}
              />
            </div>

            <div>
              <Label>Location</Label>
              <LocationCascade value={areas} onChange={setAreas} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Starts At</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => up("startAt", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Ends At</Label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => up("endAt", e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!isFormValid || busy} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {busy ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
