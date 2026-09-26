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
  FileText,
  HeartHandshake,
  MessagesSquare
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, EventTypeBadge, SeverityBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { EventFiltersBar, filterAndSortEvents, initialEventFilters, type EventFilterState } from "@/components/ui/event-filters";
import { EventDetailsModal } from "@/components/events/event-details-modal";
import type { DisasterEventResponse, PageResp } from "@/lib/types";

function VolunteerEventsContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialTab = initialTabParam === "requests" ? "requests" : initialTabParam === "joined" ? "joined" : "events";

  const [tab, setTab] = useState<"events" | "joined" | "requests">(initialTab);
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [joinedData, setJoinedData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [requestsData, setRequestsData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [filters, setFilters] = useState<EventFilterState>(initialEventFilters);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEventResponse | null>(null);

  async function loadEvents() {
    try {
      const resp = await api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/events?page=0&size=50");
      setData(resp);
    } catch {
      setData(null);
    }
  }

  async function loadJoinedEvents() {
    try {
      const resp = await api<PageResp<DisasterEventResponse>>("/api/v1/volunteer/joined-events?page=0&size=50");
      setJoinedData(resp);
    } catch {
      setJoinedData(null);
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
    await Promise.all([loadEvents(), loadJoinedEvents(), loadRequests()]);
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
      await Promise.all([loadEvents(), loadJoinedEvents()]);
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

  const rawEvents = tab === "events"
    ? (data?.content || [])
    : tab === "joined"
      ? (joinedData?.content || [])
      : (requestsData?.content || []);
  const displayedEvents = filterAndSortEvents(rawEvents, filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disaster Response Events"
        description="Browse active disaster response operations across the country, track your joined deployments, or submit an event proposal for coordinated relief."
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
          onClick={() => { setTab("events"); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "events"
            ? "border-signal text-signal font-semibold"
            : "border-transparent text-mist hover:text-ink"
            }`}
        >
          <CalendarDays className="h-4 w-4" /> Open Operations ({data?.totalElements ?? 0})
        </button>

        <button
          onClick={() => { setTab("joined"); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "joined"
            ? "border-signal text-signal font-semibold"
            : "border-transparent text-mist hover:text-ink"
            }`}
        >
          <HeartHandshake className="h-4 w-4" /> My Joined Operations ({joinedData?.totalElements ?? 0})
        </button>

        <button
          onClick={() => { setTab("requests"); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "requests"
            ? "border-signal text-signal font-semibold"
            : "border-transparent text-mist hover:text-ink"
            }`}
        >
          <Send className="h-4 w-4" /> My Event Requests ({requestsData?.totalElements ?? 0})
        </button>
      </div>

      {/* Filter and Sorting Control Bar */}
      <EventFiltersBar
        filters={filters}
        onChange={setFilters}
        totalResults={displayedEvents.length}
        statusOptions={
          tab === "events"
            ? [
              { value: "ALL", label: "All Statuses" },
              { value: "OPEN", label: "Open" },
              { value: "ONGOING", label: "Ongoing" },
              { value: "CLOSED", label: "Closed" },
            ]
            : [
              { value: "ALL", label: "All Statuses" },
              { value: "PENDING_REVIEW", label: "Under Review" },
              { value: "OPEN", label: "Approved / Open" },
              { value: "REJECTED", label: "Rejected" },
            ]
        }
      />

      {loading ? (
        <div className="p-12 text-center text-sm text-mist">Loading operations telemetry...</div>
      ) : tab === "events" ? (
        /* Open Events View */
        displayedEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10 mx-auto text-mist" />}
            title={rawEvents.length === 0 ? "No Active Events Right Now" : "No Matching Events Found"}
            description={
              rawEvents.length === 0
                ? "There are currently no open disaster operations requiring volunteers. You can propose a new event for review."
                : "No operations matched your search or filter criteria. Try resetting the filters."
            }
            action={
              rawEvents.length === 0 ? (
                <Link href="/volunteer/events/new">
                  <Button>Request an Event</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedEvents.map((event) => (
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
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedEvent(event)}
                    className="text-xs"
                  >
                    Details
                  </Button>
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
      ) : tab === "joined" ? (
        /* My Joined Operations View */
        displayedEvents.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="h-10 w-10 mx-auto text-mist" />}
            title={rawEvents.length === 0 ? "You Have Not Joined Any Operations" : "No Matching Operations Found"}
            description={
              rawEvents.length === 0
                ? "Browse available disaster relief operations and join a mission to make an impact."
                : "No joined events matched your search or filter criteria. Try resetting the filters."
            }
            action={
              rawEvents.length === 0 ? (
                <Button onClick={() => setTab("events")}>Browse Open Operations</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedEvents.map((event) => (
              <article key={event.id} className="nx-card space-y-4 flex flex-col justify-between border-emerald-500/30 bg-emerald-500/[0.02]">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <EventTypeBadge type={event.type} />
                      <SeverityBadge severity={event.severity} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <EventStatusBadge status={event.status} />
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Joined
                      </span>
                    </div>
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

                <div className="mt-auto pt-3 border-t border-ink-300/50 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedEvent(event)}
                      className="text-xs"
                    >
                      Details
                    </Button>
                    <Link href={`/volunteer/events/${event.id}/chat`}>
                      <Button size="sm" variant="secondary" className="text-xs flex items-center gap-1">
                        <MessagesSquare className="h-3.5 w-3.5 text-signal" /> Chat
                      </Button>
                    </Link>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === event.id || event.status === "CLOSED" || event.status === "CANCELLED"}
                    onClick={() => toggle(event)}
                    className="text-xs text-signal hover:text-signal-dark shrink-0"
                  >
                    {busy === event.id ? "Saving…" : "Withdraw"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* My Event Requests View */
        displayedEvents.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 mx-auto text-mist" />}
            title={rawEvents.length === 0 ? "No Event Requests Submitted" : "No Matching Requests Found"}
            description={
              rawEvents.length === 0
                ? "You have not submitted any event proposals yet. Propose an event to the Super Admin or a verified partner NGO."
                : "No event requests matched your search or filter criteria. Try resetting the filters."
            }
            action={
              rawEvents.length === 0 ? (
                <Link href="/volunteer/events/new">
                  <Button>Request an Event</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedEvents.map((req) => (
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
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedEvent(req)}
                      className="text-xs"
                    >
                      Details
                    </Button>
                    {req.status === "OPEN" ? (
                      <Link href={`/volunteer/events/${req.id}`}>
                        <Button size="sm" variant="secondary" className="text-xs">
                          View Live Event
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-mist italic">
                        {req.status === "PENDING_REVIEW"
                          ? "Awaiting review"
                          : "Closed"}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          canEdit={false}
          isSuperAdmin={false}
        />
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
