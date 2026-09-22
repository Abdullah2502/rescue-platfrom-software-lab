"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Calendar, Users, MessageCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { ChatEventSummaryResponse } from "@/lib/types";

export default function AdminEventChatsPage() {
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
        title="Event Operations Chat Directory"
        description="Every disaster event has an isolated operational chat room. As Super Admin, you have universal platform access to inspect, communicate, and pin notices across all mission channels."
      />

      {loading ? (
        <div className="p-12 text-center text-sm text-mist">Loading active operational channels...</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="h-10 w-10 mx-auto text-mist" />}
          title="No Event Chat Rooms Available"
          description="Create a disaster event to automatically initialize its operational chat room."
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
                    Organizer: <strong>{ev.organizerName}</strong> ({ev.organizerType})
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-mist pt-2 border-t border-ink-300/40">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-signal" /> Joined Roster
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
                      <Calendar className="h-3 w-3" /> Scheduled
                    </span>
                    <span className="font-mono text-mist">{formatDateTime(ev.startAt)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ink-300/50">
                <Link href={`/admin/events/${ev.eventId}/chat`}>
                  <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2 text-xs">
                    <MessagesSquare className="h-3.5 w-3.5" /> Enter Operations Room <ArrowRight className="h-3.5 w-3.5" />
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

