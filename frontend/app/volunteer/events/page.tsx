"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  CalendarDays, 
  MapPin, 
  Plus, 
  Users, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse, PageResp } from "@/lib/types";

function VolunteerEventsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "requests" ? "requests" : "events";

  const [tab, setTab] = useState<"events" | "requests">(initialTab);
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [requestsData, setRequestsData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  async function loadEvents() {
    try {
      const resp = await api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/events?page=0&size=50");
      setData(resp);
    } catch {
      setData(null);
    }
  }

  async function loadRequests() {
    try {
      const resp = await api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/event-requests?page=0&size=50");
      setRequestsData(resp);
    } catch {
      setRequestsData(null);
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadEvents(), loadRequests()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function toggle(event: DisasterEventResponse) {
    setBusy(event.id);
    try {
      await api(`/api/v1/volunteer/events/${event.id}/join`, {
        method: event.joinedByCurrentVolunteer ? "DELETE" : "POST",
      });
      await loadEvents();
      toast(
        "success",
        event.joinedByCurrentVolunteer ? "You left the event" : "You joined the event",
        event.joinedByCurrentVolunteer
          ? "Your commitment was withdrawn."
          : "The organizer can now see your participation in the roster."
      );
    } catch (error: any) {
      toast("error", "Could not update participation", error.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster Response Events"
        description="Browse active disaster response operations across the country or submit an event proposal for coordinated relief."
        actions={
          <Link href="/volunteer/events/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Request an Event
            </Button>
          </Link>
        }
      />

      {/* Segmented View Tabs */}
      <div className="flex border-b border-ink-300 gap-6">
        <button
          onClick={() => setTab("events")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "events"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <CalendarDays className="h-4 w-4" /> Open Operations ({data?.totalElements ?? 0})
        </button>

        <button
          onClick={() => setTab("requests")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === "requests"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <Send className="h-4 w-4" /> My Event Requests ({requestsData?.totalElements ?? 0})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-mist">Loading operations telemetry...</div>
      ) : tab === "events" ? (
        /* Open Events View */
        !data || data.content.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10 mx-auto text-mist" />}
            title="No Active Events Right Now"
            description="There are currently no open disaster operations requiring volunteers. You can propose a new event for review."
            action={
              <Link href="/volunteer/events/new">
                <Button>Request an Event</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.content.map((event) => (
              <article key={event.id} className="nx-card space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <EventTypeBadge type={event.type} />
                      <SeverityBadge severity={event.severity} />
                    </div>
                    <EventStatusBadge status={event.status} />
                  </div>

                  <div>
                    <Link
                      href={`/volunteer/events/${event.id}`}
                      className="font-display text-lg font-semibold text-ink hover:text-signal transition-colors line-clamp-1"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-1 text-sm text-mist line-clamp-2">
                      {event.description || "Community response operation"}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-mist pt-1 border-t border-ink-300/40">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span className="truncate">
                        {event.divisions.map((d) => d.name).join(", ") || "Bangladesh"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span className="truncate">
                        {formatDateTime(event.startAt)} → {formatDateTime(event.endAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span>
                        {event.participantCount} joined · {event.requiredVolunteers} needed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-ink-300/50 flex items-center justify-between gap-3">
                  <span className="text-xs text-mist truncate">By {event.organizerName}</span>
                  <Button
                    size="sm"
                    variant={event.joinedByCurrentVolunteer ? "secondary" : "primary"}
                    disabled={busy === event.id || event.status === "CLOSED" || event.status === "CANCELLED"}
                    onClick={() => toggle(event)}
                    className="shrink-0"
                  >
                    {busy === event.id
                      ? "Saving…"
                      : event.joinedByCurrentVolunteer
                      ? "Withdraw"
                      : "Join event"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* My Event Requests View */
        !requestsData || requestsData.content.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 mx-auto text-mist" />}
            title="No Event Requests Submitted"
            description="You have not submitted any event proposals yet. Propose an event to the Super Admin or a verified partner NGO."
            action={
              <Link href="/volunteer/events/new">
                <Button>Request an Event</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {requestsData.content.map((req) => (
              <article key={req.id} className="nx-card space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <EventTypeBadge type={req.type} />
                      <SeverityBadge severity={req.severity} />
                    </div>
                    <EventStatusBadge status={req.status} />
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink line-clamp-1">
                      {req.title}
                    </h3>
                    <p className="mt-1 text-sm text-mist line-clamp-2">
                      {req.description || "Proposal description pending review."}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-mist pt-1 border-t border-ink-300/40">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span className="truncate">
                        Target: <strong>{req.organizerName || "Super Admin (Platform)"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span className="truncate">
                        {req.divisions.map((d) => d.name).join(", ") || "Bangladesh"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-signal shrink-0" />
                      <span className="truncate">
                        Submitted: {req.createdAt ? formatDateTime(req.createdAt) : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-ink-300/50 flex items-center justify-between gap-3 text-xs">
                  <span className="text-mist">
                    Status:{" "}
                    <strong className={req.status === "OPEN" ? "text-relief" : req.status === "REJECTED" ? "text-signal" : "text-amber-300"}>
                      {req.status === "PENDING_REVIEW" ? "Under Review" : req.status}
                    </strong>
                  </span>

                  {req.status === "OPEN" ? (
                    <Link href={`/volunteer/events/${req.id}`}>
                      <Button size="sm" variant="secondary" className="text-xs">
                        View Live Event
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-mist italic">
                      {req.status === "PENDING_REVIEW"
                        ? "Awaiting authority review"
                        : "Closed / Rejected"}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function VolunteerEventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-mist">Loading events...</div>}>
      <VolunteerEventsContent />
    </Suspense>
  );
}
