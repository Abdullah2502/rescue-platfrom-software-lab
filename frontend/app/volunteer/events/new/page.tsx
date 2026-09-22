"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Building2, 
  ShieldAlert, 
  Send, 
  Info, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Sparkles 
} from "lucide-react";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { PageHeader, ErrorState } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import type { EventType, Severity, NgoResponse, PageResp } from "@/lib/types";

function VolunteerEventRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialNgoId = searchParams.get("ngoId");
  const initialNgoName = searchParams.get("ngoName");

  const [targetType, setTargetType] = useState<"ADMIN" | "NGO">(initialNgoId ? "NGO" : "ADMIN");
  const [selectedNgoId, setSelectedNgoId] = useState<string>(initialNgoId || "");
  const [ngos, setNgos] = useState<NgoResponse[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "FLOOD" as EventType,
    severity: "MEDIUM" as Severity,
    description: "",
    startAt: "",
    endAt: "",
    requiredVolunteers: 10,
  });

  const [areas, setAreas] = useState<{ divisionId?: number; districtId?: number; thanaId?: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const up = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    setLoadingNgos(true);
    api<PageResp<NgoResponse>>("/api/v1/volunteer/ngos?page=0&size=100")
      .then((resp) => {
        setNgos(resp.content || []);
        if (initialNgoId && !selectedNgoId) {
          setSelectedNgoId(initialNgoId);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingNgos(false));
  }, [initialNgoId]);

  async function submit() {
    if (targetType === "NGO" && !selectedNgoId) {
      setError("Please select the target NGO to review your event request.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        requiredVolunteers: Number(form.requiredVolunteers),
        divisionIds: areas.divisionId ? [areas.divisionId] : [],
        districtIds: areas.districtId ? [areas.districtId] : [],
        thanaIds: areas.thanaId ? [areas.thanaId] : [],
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        ngoId: targetType === "NGO" ? Number(selectedNgoId) : null,
      };

      await api<{ id: number }>("/api/v1/volunteer/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const recipientName = targetType === "NGO"
        ? (ngos.find((n) => String(n.id) === selectedNgoId)?.name || "the selected NGO")
        : "Super Admin";

      toast(
        "success",
        "Event Request Submitted",
        `Your event proposal has been submitted to ${recipientName} for review. Once approved, it will be published.`
      );

      router.push("/volunteer/events?tab=requests");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Request a Disaster Response Event"
        description="Submit an event proposal for ground relief or rescue operations. All volunteer-submitted events are reviewed and approved by authorities before publication."
      />

      {/* Informational Guidance Alert */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-100">Review & Approval Policy</p>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            To prevent duplicates and maintain platform coordination, volunteers cannot publish live events directly. 
            Your proposal will be reviewed by the <strong>Super Admin</strong> or the <strong>assigned partner NGO</strong>. 
            Once approved, it will go live for all volunteers to join.
          </p>
        </div>
      </div>

      <div className="nx-card space-y-6">
        {/* Step 1: Review Authority */}
        <div className="space-y-3 pb-5 border-b border-ink-300">
          <Label className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-signal" /> Submit Request To
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                targetType === "ADMIN"
                  ? "bg-signal/10 border-signal text-ink ring-1 ring-signal"
                  : "bg-surface-raised border-ink-300 text-mist hover:border-ink-300/80"
              }`}
            >
              <input
                type="radio"
                name="targetType"
                checked={targetType === "ADMIN"}
                onChange={() => setTargetType("ADMIN")}
                className="mt-1"
              />
              <div>
                <span className="font-semibold block text-ink text-sm">Super Admin</span>
                <span className="text-xs text-mist block mt-0.5">
                  National disaster coordination & platform oversight.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                targetType === "NGO"
                  ? "bg-signal/10 border-signal text-ink ring-1 ring-signal"
                  : "bg-surface-raised border-ink-300 text-mist hover:border-ink-300/80"
              }`}
            >
              <input
                type="radio"
                name="targetType"
                checked={targetType === "NGO"}
                onChange={() => setTargetType("NGO")}
                className="mt-1"
              />
              <div>
                <span className="font-semibold block text-ink text-sm">Registered NGO</span>
                <span className="text-xs text-mist block mt-0.5">
                  Direct local coordination with a verified relief organization.
                </span>
              </div>
            </label>
          </div>

          {targetType === "NGO" && (
            <div className="pt-2 animate-in fade-in duration-200">
              <Label className="text-xs text-mist">Select Organization</Label>
              <select
                className="h-10 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink focus:outline-none focus:border-signal mt-1"
                value={selectedNgoId}
                onChange={(e) => setSelectedNgoId(e.target.value)}
              >
                <option value="">-- Choose a Verified Partner NGO --</option>
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name} ({[ngo.district?.name, ngo.division?.name].filter(Boolean).join(", ") || "Bangladesh"})
                  </option>
                ))}
              </select>
              {initialNgoName && (
                <span className="text-xs text-signal block mt-1">
                  Selected via directory: <strong>{initialNgoName}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Event Core Information */}
        <div className="space-y-4">
          <div>
            <Label>Event Title</Label>
            <Input
              value={form.title}
              onChange={(e) => up("title", e.target.value)}
              placeholder="e.g. Flash Flood Emergency Relief in Sunamganj"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Disaster Type</Label>
              <select
                className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink"
                value={form.type}
                onChange={(e) => up("type", e.target.value)}
              >
                {["FLOOD", "CYCLONE", "EARTHQUAKE", "FIRE", "PANDEMIC", "OTHER"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Severity Level</Label>
              <select
                className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink"
                value={form.severity}
                onChange={(e) => up("severity", e.target.value)}
              >
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Volunteers Needed</Label>
              <Input
                type="number"
                min={1}
                value={form.requiredVolunteers}
                onChange={(e) => up("requiredVolunteers", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Operation Description & Objectives</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => up("description", e.target.value)}
              placeholder="Detail the ground reality: affected population, relief items required, staging locations, and volunteer tasks..."
            />
          </div>

          <div>
            <Label>Target Location Hierarchy</Label>
            <LocationCascade value={areas} onChange={setAreas} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Proposed Start Time</Label>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => up("startAt", e.target.value)}
              />
            </div>
            <div>
              <Label>Proposed End Time</Label>
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => up("endAt", e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <ErrorState title="Could not submit request" description={error} />}

        <div className="flex items-center justify-between pt-4 border-t border-ink-300">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={
              busy ||
              !form.title.trim() ||
              !form.startAt ||
              !form.endAt ||
              !areas.divisionId ||
              (targetType === "NGO" && !selectedNgoId)
            }
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" /> {busy ? "Submitting Proposal…" : "Submit Event Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewVolunteerEventPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-mist">Loading event proposal form...</div>}>
      <VolunteerEventRequestForm />
    </Suspense>
  );
}
