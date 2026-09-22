"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatCard, PageHeader, EmptyState } from "@/components/ui/page";
import { UnreadChatsCard } from "@/components/chat/UnreadChatsCard";
import type { CertificateResponse, DisasterEventResponse, PageResp, VolunteerResponse } from "@/lib/types";

export default function VolunteerDashboard() {
  const [me, setMe] = useState<VolunteerResponse | null>(null);
  const [events, setEvents] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  useEffect(() => {
    api<VolunteerResponse>("/api/v1/volunteer/dashboard").then(setMe).catch(() => {});
    api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/events?page=0&size=20").then(setEvents).catch(() => {});
    api<CertificateResponse[]>("/api/v1/volunteer/certificates").then(setCertificates).catch(() => {});
  }, []);
  const joined = events?.content.filter((event) => event.joinedByCurrentVolunteer) ?? [];
  const open = events?.content.filter((event) => event.status === "OPEN" || event.status === "ONGOING") ?? [];
  const area = [me?.thana?.name, me?.district?.name, me?.division?.name].filter(Boolean).join(", ");
  return <div>
    <PageHeader title={me ? `Hello, ${me.name.split(" ")[0]}.` : "Welcome back."} description={me ? `Based in ${area || "Bangladesh"}. Find an event, join directly, and keep your participation record in one place.` : undefined} actions={<Link href="/volunteer/events/new"><Button><Plus className="h-4 w-4" /> Create event</Button></Link>} />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Open events" value={open.length} hint="Ready to join" /><StatCard label="My commitments" value={joined.length} hint="Events you joined" /><StatCard label="Certificates" value={certificates.length} hint="Issued by admin" /><StatCard label="People mobilized" value={joined.reduce((sum, e) => sum + e.participantCount, 0)} hint="Across your events" /></div>
    
    <div className="mt-8">
      <UnreadChatsCard rolePath="volunteer" />
    </div>

    {me && <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="nx-card-flat"><div className="eyebrow mb-2">Your location</div><div className="flex items-center gap-2 font-display text-lg text-ink"><MapPin className="h-4 w-4 text-signal" />{area || "Not set"}</div><p className="mt-1 text-xs text-mist">Keep your area current so event details stay relevant.</p></div><div className="nx-card-flat"><div className="eyebrow mb-2">Your skills</div>{me.skills.length > 0 ? <div className="flex flex-wrap gap-1.5">{me.skills.map((skill) => <span key={skill} className="nx-badge nx-badge-ink">{skill}</span>)}</div> : <p className="text-sm text-mist">Add skills from your profile to show what you can help with.</p>}</div></div>}
    <div className="mt-10 flex items-center justify-between mb-4"><div><div className="eyebrow">Your response history</div><h2 className="font-display text-display-md text-ink">Events you joined</h2></div><Link href="/volunteer/events" className="text-sm text-signal hover:underline">Browse events</Link></div>
    {joined.length === 0 ? <EmptyState icon={<CalendarDays className="h-10 w-10 mx-auto" />} title="No event commitments yet." description="Browse open events and join the response effort directly." action={<Link href="/volunteer/events"><Button>Find an event</Button></Link>} /> : <ul className="divide-y divide-ink-300 border border-ink-300 rounded bg-surface">{joined.slice(0, 5).map((event) => <li key={event.id} className="px-4 py-3 flex items-center justify-between gap-4"><div><div className="font-medium text-sm text-ink">{event.title}</div><div className="text-xs text-mist">{event.organizerName} · {event.participantCount}/{event.requiredVolunteers} joined</div></div><Link href={`/volunteer/events/${event.id}`} className="text-sm text-signal hover:underline">Open</Link></li>)}</ul>}
  </div>;
}
