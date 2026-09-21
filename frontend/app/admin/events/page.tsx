"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Award } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, SeverityBadge, EventTypeBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { CertificateGenerationResponse, DisasterEventResponse, PageResp } from "@/lib/types";
export default function AdminEventsPage() {
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null); const [busy, setBusy] = useState<number | null>(null);
  async function load() { setData(await api<PageResp<DisasterEventResponse>>("/api/v1/admin/events?page=0&size=50")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function generate(event: DisasterEventResponse) { setBusy(event.id); try { const result = await api<CertificateGenerationResponse>(`/api/v1/admin/events/${event.id}/certificates/generate`, { method: "POST" }); toast("success", "Certificates generated", `${result.generated} new certificate(s) for ${result.participantCount} participant(s).`); } catch (e: any) { toast("error", "Could not generate certificates", e.message); } finally { setBusy(null); } }
  return <div><PageHeader title="All disaster events." description="Monitor every response effort, create platform events, and issue participation certificates from the joined roster." actions={<Link href="/admin/events/new"><Button><Plus className="h-4 w-4" /> Create event</Button></Link>} />{!data || data.content.length === 0 ? <EmptyState title="No events recorded." /> : <div className="border border-ink-300 rounded bg-surface overflow-hidden"><table className="nx-table"><thead><tr><th>Title</th><th>Type</th><th>Organizer</th><th>Start</th><th>Status</th><th>Participants</th><th>Certificates</th></tr></thead><tbody>{data.content.map((event) => <tr key={event.id}><td className="font-medium text-ink">{event.title}</td><td><EventTypeBadge type={event.type} /> <SeverityBadge severity={event.severity} /></td><td className="text-xs">{event.organizerName}</td><td className="text-xs font-mono text-mist">{formatDateTime(event.startAt)}</td><td><EventStatusBadge status={event.status} /></td><td className="text-xs font-mono">{event.participantCount}/{event.requiredVolunteers}</td><td><Button size="sm" variant="secondary" disabled={busy === event.id || event.participantCount === 0} onClick={() => generate(event)}>{busy === event.id ? "Generating…" : <><Award className="h-3.5 w-3.5" /> Generate</>}</Button></td></tr>)}</tbody></table></div>}</div>;
}
