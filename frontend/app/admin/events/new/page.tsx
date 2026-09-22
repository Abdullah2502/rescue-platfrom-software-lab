"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui/input";
import { LocationCascade } from "@/components/ui/location-cascade";
import { PageHeader, ErrorState } from "@/components/ui/page";
import type { EventType, Severity } from "@/lib/types";

export default function NewAdminEventPage() {
    const router = useRouter();

    // 1. Added ngoId to the form state
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

    // 2. State to store the list of available NGOs
    const [ngos, setNgos] = useState<any[]>([]);

    // 3. Fetch approved NGOs when the page loads
    useEffect(() => {
        // Fetch up to 100 approved NGOs (adjust size as needed)
        api<{ content: any[] }>("/api/v1/admin/ngos?status=APPROVED&size=100")
            .then((res) => {
                // Spring Data PageResponse places the array inside 'content'
                setNgos(res.content || []);
            })
            .catch((err) => console.error("Failed to fetch NGOs:", err));
    }, []);

    const up = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));

    async function submit() {
        setBusy(true);
        try {
            const event = await api<{ id: number }>("/api/v1/admin/events", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    requiredVolunteers: Number(form.requiredVolunteers),
                    // 4. Parse the NGO ID as a number for the backend
                    ngoId: Number(form.ngoId),
                    divisionIds: areas.divisionId ? [areas.divisionId] : [],
                    districtIds: areas.districtId ? [areas.districtId] : [],
                    thanaIds: areas.thanaId ? [areas.thanaId] : [],
                    startAt: new Date(form.startAt).toISOString(),
                    endAt: new Date(form.endAt).toISOString()
                })
            });
            router.push(`/admin/events`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    // Prevent submission if critical fields are missing
    const isFormValid = !busy && form.title && form.startAt && form.endAt && form.ngoId;

    return (
        <div className="max-w-3xl">
            <PageHeader
                title="Create a platform event."
                description="Open a response effort on behalf of Nexora and make it available to volunteers."
            />
            <div className="nx-card space-y-5">
                <div>
                    <Label>Event title</Label>
                    <Input value={form.title} onChange={(e) => up("title", e.target.value)} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label>Assign NGO</Label>
                        <select
                            className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink"
                            value={form.ngoId}
                            onChange={(e) => up("ngoId", e.target.value)}
                        >
                            <option value="" disabled>Select an NGO...</option>
                            {ngos.map((ngo) => (
                                <option key={ngo.id} value={ngo.id}>
                                    {ngo.organizationName || ngo.name || `NGO #${ngo.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Volunteers needed</Label>
                        <Input type="number" min={1} value={form.requiredVolunteers} onChange={(e) => up("requiredVolunteers", e.target.value)} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label>Type</Label>
                        <select className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink" value={form.type} onChange={(e) => up("type", e.target.value)}>
                            {["FLOOD", "CYCLONE", "EARTHQUAKE", "FIRE", "PANDEMIC", "OTHER"].map((v) => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Severity</Label>
                        <select className="h-9 w-full rounded bg-surface border border-ink-300 px-3 text-sm text-ink" value={form.severity} onChange={(e) => up("severity", e.target.value)}>
                            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <Label>Description</Label>
                    <Textarea rows={4} value={form.description} onChange={(e) => up("description", e.target.value)} />
                </div>

                <div>
                    <Label>Area</Label>
                    <LocationCascade value={areas} onChange={setAreas} required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label>Starts</Label>
                        <Input type="datetime-local" value={form.startAt} onChange={(e) => up("startAt", e.target.value)} />
                    </div>
                    <div>
                        <Label>Ends</Label>
                        <Input type="datetime-local" value={form.endAt} onChange={(e) => up("endAt", e.target.value)} />
                    </div>
                </div>

                {error && <ErrorState title="Could not create event" description={error} />}

                <div className="flex justify-end">
                    <Button onClick={submit} disabled={!isFormValid}>
                        {busy ? "Creating…" : "Publish event"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
