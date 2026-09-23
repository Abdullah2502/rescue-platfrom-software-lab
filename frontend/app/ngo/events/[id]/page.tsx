"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users, MessagesSquare, Building2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { PageHeader, StatCard } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse, EventStatus, NgoResponse } from "@/lib/types";

export default function NgoEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<DisasterEventResponse | null>(null);
  const [profile, setProfile] = useState<NgoResponse | null>(null);

  useEffect(() => {
    Promise.all([
      api<DisasterEventResponse>(`/api/v1/events/${id}`).catch(() => null),
      api<NgoResponse>("/api/v1/ngo/profile").catch(() => null),
    ]).then(([ev, prof]) => {
      if (ev) setEvent(ev);
      if (prof) setProfile(prof);
    });
  }, [id]);

  async function status(value: EventStatus) {
    try {
      const next = await api<DisasterEventResponse>(`/api/v1/events/${id}/status?status=${value}`, {
        method: "PATCH",
      });
      setEvent(next);
      toast("success", `Event ${value.toLowerCase()}.`);
    } catch (e: any) {
      toast("error", "Could not update event", e.message);
    }
  }

  if (!event) {
    return (
      <div className="py-20 text-center text-sm font-mono text-mist">
        Loading event details…
      </div>
    );
  }

  const isMyEvent = profile && event.organizerId === profile.id;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-mist hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </button>

      <PageHeader
        eyebrow={isMyEvent ? "YOUR MANAGED OPERATION" : "PARTNER OPERATION"}
        title={event.title}
        description={event.description || "Disaster response event."}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/ngo/events/${event.id}/chat`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-signal" /> Mission Chat
              </Button>
            </Link>

            {isMyEvent && (
              <>
                {event.status === "PENDING_REVIEW" && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => status("OPEN")}>
                      Approve & Publish
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => status("REJECTED")}>
                      Reject
                    </Button>
                  </>
                )}
                {event.status === "OPEN" && (
                  <Button onClick={() => status("ONGOING")}>Start event</Button>
                )}
                {event.status === "ONGOING" && (
                  <Button variant="secondary" onClick={() => status("CLOSED")}>Close event</Button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <EventStatusBadge status={event.status} />
        <EventTypeBadge type={event.type} />
        <SeverityBadge severity={event.severity} />
        {isMyEvent ? (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Managed by your organization
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-surface border border-ink-300 text-mist px-2 py-0.5 text-xs font-medium">
            <Building2 className="h-3.5 w-3.5" /> Organized by {event.organizerName || "Partner Organization"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Volunteers joined"
          value={event.participantCount}
          hint={`${event.requiredVolunteers} responders needed`}
        />
        <StatCard
          label="Event Owner"
          value={event.organizerName || "Nexora"}
          hint={isMyEvent ? "Your organization" : "External agency / partner"}
        />
        <StatCard
          label="Starts At"
          value={formatDateTime(event.startAt)}
          hint={`Ends ${formatDateTime(event.endAt)}`}
        />
      </div>

      <div className="rounded-xl border border-ink-300 bg-surface p-6 space-y-4 text-sm text-mist shadow-xs">
        <div className="flex items-center gap-3 text-ink">
          <MapPin className="h-4 w-4 text-signal shrink-0" />
          <span>
            {event.divisions && event.divisions.length > 0
              ? event.divisions.map((d) => d.name).join(", ")
              : "National Coverage"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-signal shrink-0" />
          <span>
            {formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-signal shrink-0" />
          <span>
            Volunteers join and mobilize from their personal responder dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}
