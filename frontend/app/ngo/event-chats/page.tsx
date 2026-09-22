"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Calendar, Users, MessageCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { ChatEventSummaryResponse } from "@/lib/types";

export default function NgoEventChatsPage() {
  const [events, setEvents] = useState<ChatEventSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ChatEventSummaryResponse[]>("/api/v1/chat/events")
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGO Operational Mission Channels"
        description="Private mission chat rooms for your active disaster response operations. Coordinate directly with your registered volunteers and pin operational directives."
      />

      {loading ? (
        <div className="p-12 text-center text-sm text-mist">Loading active mission channels...</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="h-10 w-10 mx-auto text-mist" />}
          title="No Operational Channels Found"
          description="Create a disaster event to initialize its private volunteer operations channel."
          action={
            <Link href="/ngo/events/new">
              <Button>Create Event</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((ev) => (
            <article
              key={ev.eventId}
              className="nx-card flex flex-col justify-between hover:border-signal/50 transition-colors space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <EventTypeBadge type={ev.type} />
                    <SeverityBadge severity={ev.severity} />
                  </div>
                  <EventStatusBadge status={ev.status} />
                </div>

                <div>
                  <h3 className="font-display font-semibold text-ink text-base line-clamp-1">
                    {ev.title}
                  </h3>
                  <span className="text-xs text-mist block mt-0.5">
                    Status: <strong className="text-ink">{ev.status}</strong>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-mist pt-2 border-t border-ink-300/40">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-signal" /> Joined Volunteers
                    </span>
                    <span className="font-mono text-ink font-semibold">{ev.participantCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-signal" /> Messages
                    </span>
                    <span className="font-mono text-ink font-semibold">{ev.messageCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-mist">
                      <Calendar className="h-3 w-3" /> Timing
                    </span>
                    <span className="font-mono text-mist">{formatDateTime(ev.startAt)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ink-300/50">
                <Link href={`/ngo/events/${ev.eventId}/chat`}>
                  <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2 text-xs">
                    <MessagesSquare className="h-3.5 w-3.5" /> Open Mission Chat <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

