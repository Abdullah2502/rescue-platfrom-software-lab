"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users, MessagesSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse } from "@/lib/types";

export default function VolunteerEventDetailPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [event, setEvent] = useState<DisasterEventResponse | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api<DisasterEventResponse>(`/api/v1/events/${id}`).then(setEvent).catch(() => { }); }, [id]);
  async function toggle() { if (!event) return; setBusy(true); try { const next = await api<DisasterEventResponse>(`/api/v1/volunteer/events/${event.id}/join`, { method: event.joinedByCurrentVolunteer ? "DELETE" : "POST" }); setEvent(next); toast("success", event.joinedByCurrentVolunteer ? "Participation withdrawn" : "Event joined"); } catch (e: any) { toast("error", "Could not update participation", e.message); } finally { setBusy(false); } }
  if (!event) return <div className="text-sm text-mist">Loading event…</div>;
  return <div><button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-sm text-mist hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to events</button><PageHeader title={event.title} description={event.description || "Community response event."} actions={<div className="flex items-center gap-2">{event.joinedByCurrentVolunteer && <Link href={`/volunteer/events/${event.id}/chat`}><Button variant="secondary" className="flex items-center gap-2"><MessagesSquare className="h-4 w-4 text-signal" /> Operations Chat</Button></Link>}<Button onClick={toggle} disabled={busy || event.status === "CLOSED" || event.status === "CANCELLED"}>{busy ? "Saving…" : event.joinedByCurrentVolunteer ? "Withdraw" : "Join event"}</Button></div>} /><div className="flex flex-wrap gap-2 mb-6"><EventStatusBadge status={event.status} /><EventTypeBadge type={event.type} /><SeverityBadge severity={event.severity} /></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"><StatCard label="People joined" value={event.participantCount} hint={`${event.requiredVolunteers} needed`} /><StatCard label="Organizer" value={event.organizerName} hint={event.organizerType} /><StatCard label="Your status" value={event.joinedByCurrentVolunteer ? "Joined" : "Not joined"} hint="You can withdraw any time" /></div><div className="nx-card space-y-4 text-sm text-mist mb-6"><div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-signal" />{event.divisions.map((d) => d.name).join(", ") || "Bangladesh"}</div><div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-signal" />{formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}</div><div className="flex items-center gap-3"><Users className="h-4 w-4 text-signal" />{event.participantCount} volunteers have joined this response.</div></div>
    {event.organizerEmail || event.organizerPhone || event.organizerWebsite ? (
      <div className="nx-card space-y-4 text-sm text-mist">
        <h3 className="font-bold text-ink">Organizer Contact Information</h3>
        {event.organizerEmail && <div className="flex items-center gap-3">Email: {event.organizerEmail}</div>}
        {event.organizerPhone && <div className="flex items-center gap-3">Phone: {event.organizerPhone}</div>}
        {event.organizerWebsite && <div className="flex items-center gap-3">Website: <a href={event.organizerWebsite} target="_blank" rel="noreferrer" className="text-signal hover:underline">{event.organizerWebsite}</a></div>}
      </div>
    ) : null}
  </div>;
}
