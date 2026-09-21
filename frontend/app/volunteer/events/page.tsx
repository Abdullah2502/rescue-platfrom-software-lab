"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse, PageResp } from "@/lib/types";

export default function VolunteerEventsPage() {
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  async function load() { setData(await api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/events?page=0&size=50")); }
  useEffect(() => { load().catch(() => {}); }, []);
  async function toggle(event: DisasterEventResponse) {
    setBusy(event.id);
    try { await api(`/api/v1/volunteer/events/${event.id}/join`, { method: event.joinedByCurrentVolunteer ? "DELETE" : "POST" }); await load(); toast("success", event.joinedByCurrentVolunteer ? "You left the event" : "You joined the event", event.joinedByCurrentVolunteer ? "Your commitment was withdrawn." : "The organizer can now see your participation count."); }
    catch (error: any) { toast("error", "Could not update participation", error.message); }
    finally { setBusy(null); }
  }
  return <div><PageHeader title="Find an event." description="Every open response effort in Nexora is visible here. Join directly when you can help, and withdraw any time." actions={<Link href="/volunteer/events/new"><Button><Plus className="h-4 w-4" /> Create event</Button></Link>} />
    {!data || data.content.length === 0 ? <EmptyState icon={<CalendarDays className="h-10 w-10 mx-auto" />} title="No events available." description="Check back soon or create a response event for your community." action={<Link href="/volunteer/events/new"><Button>Create event</Button></Link>} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.content.map((event) => <article key={event.id} className="nx-card space-y-4 flex flex-col"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5"><EventTypeBadge type={event.type} /><SeverityBadge severity={event.severity} /></div><EventStatusBadge status={event.status} /></div><div><Link href={`/volunteer/events/${event.id}`} className="font-display text-xl text-ink hover:text-signal">{event.title}</Link><p className="mt-1 text-sm text-mist line-clamp-2">{event.description || "Community response event"}</p></div><div className="space-y-2 text-xs text-mist"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-signal" />{event.divisions.map((d) => d.name).join(", ") || "Bangladesh"}</div><div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-signal" />{formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}</div><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-signal" />{event.participantCount} joined · {event.requiredVolunteers} needed</div></div><div className="mt-auto flex items-center justify-between gap-3"><span className="text-xs text-mist">By {event.organizerName}</span><Button size="sm" variant={event.joinedByCurrentVolunteer ? "secondary" : "primary"} disabled={busy === event.id || event.status === "CLOSED" || event.status === "CANCELLED"} onClick={() => toggle(event)}>{busy === event.id ? "Saving…" : event.joinedByCurrentVolunteer ? "Withdraw" : "Join event"}</Button></div></article>)}</div>}
  </div>;
}
