"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, SeverityBadge, EventTypeBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { EventFiltersBar, filterAndSortEvents, initialEventFilters, type EventFilterState } from "@/components/ui/event-filters";
import type { DisasterEventResponse, EventStatus, PageResp, NgoResponse } from "@/lib/types";

export default function NgoEventsPage() {
  const [profile, setProfile] = useState<NgoResponse | null>(null);
  const [myEvents, setMyEvents] = useState<DisasterEventResponse[]>([]);
  const [allEvents, setAllEvents] = useState<DisasterEventResponse[]>([]);
  const [scope, setScope] = useState<"MY" | "ALL">("MY");
  const [filters, setFilters] = useState<EventFilterState>(initialEventFilters);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [prof, myResp, allResp] = await Promise.all([
        api<NgoResponse>("/api/v1/ngo/profile").catch(() => null),
        api<PageResp<DisasterEventResponse>>("/api/v1/ngo/events?page=0&size=100&all=false").catch(() => null),
        api<PageResp<DisasterEventResponse>>("/api/v1/ngo/events?page=0&size=100&all=true").catch(() => null),
      ]);
      if (prof) setProfile(prof);
      setMyEvents(myResp?.content || []);
      setAllEvents(allResp?.content || []);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function changeStatus(id: number, s: EventStatus) {
    try {
      await api(`/api/v1/events/${id}/status?status=${s}`, { method: "PATCH" });
      toast("success", `Event status updated to ${s.toLowerCase()}.`);
      await loadData();
    } catch (ex: any) {
      toast("error", "Could not update status", ex.message);
    }
  }

  const activeEvents = scope === "MY" ? myEvents : allEvents;
  const displayedEvents = filterAndSortEvents(activeEvents, filters);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OPERATIONS & DISPATCH"
        title="Disaster Events & Operations."
        description="Monitor disaster response missions across Bangladesh. Switch between your organization's managed events and national operations conducted by partner NGOs."
        actions={
          <Link href="/ngo/events/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create event
            </Button>
          </Link>
        }
      />

      {/* Scope Switcher Tabs */}
      <div className="flex border-b border-ink-300 gap-6">
        <button
          onClick={() => setScope("MY")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            scope === "MY"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>My Organization&apos;s Events</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
            scope === "MY" 
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30" 
              : "bg-surface border border-ink-300 text-mist"
          }`}>
            {myEvents.length}
          </span>
        </button>

        <button
          onClick={() => setScope("ALL")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            scope === "ALL"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>All National Events</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
            scope === "ALL" 
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30" 
              : "bg-surface border border-ink-300 text-mist"
          }`}>
            {allEvents.length}
          </span>
        </button>
      </div>

      <EventFiltersBar
        filters={filters}
        onChange={setFilters}
        totalResults={displayedEvents.length}
        statusOptions={[
          { value: "ALL", label: "All Statuses" },
          { value: "OPEN", label: "Open" },
          { value: "ONGOING", label: "Ongoing" },
          { value: "PENDING_REVIEW", label: "Pending Review" },
          { value: "CLOSED", label: "Closed" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "REJECTED", label: "Rejected" },
        ]}
      />

      {loading && activeEvents.length === 0 ? (
        <div className="py-16 text-center text-sm font-mono text-mist">
          Loading operations data…
        </div>
      ) : displayedEvents.length === 0 ? (
        <EmptyState
          title={
            activeEvents.length === 0
              ? scope === "MY"
                ? "No events opened by your organization yet."
                : "No disaster events registered on the platform."
              : "No matching events found."
          }
          description={
            activeEvents.length === 0
              ? scope === "MY"
                ? "Create your first disaster event so volunteers can mobilize and join directly."
                : "There are currently no active operations in this directory."
              : "Try adjusting your search criteria, territory, or status filter."
          }
          action={
            activeEvents.length === 0 && scope === "MY" ? (
              <Link href="/ngo/events/new">
                <Button>Create event</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="border border-ink-300 rounded bg-surface overflow-hidden shadow-xs">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                {scope === "ALL" && <th>Organizer</th>}
                <th>Start</th>
                <th>End</th>
                <th>Roster</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedEvents.map((e) => {
                const isMyEvent = profile && e.organizerId === profile.id;
                return (
                  <tr key={e.id} className={isMyEvent ? "bg-amber-500/[0.02]" : undefined}>
                    <td>
                      <div className="flex flex-col">
                        <Link href={`/ngo/events/${e.id}`} className="font-medium text-ink hover:text-signal transition-colors">
                          {e.title}
                        </Link>
                        {e.divisions && e.divisions.length > 0 && (
                          <span className="text-[11px] text-mist font-mono">
                            {e.divisions.map((d) => d.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><EventTypeBadge type={e.type} /></td>
                    <td><SeverityBadge severity={e.severity} /></td>
                    <td><EventStatusBadge status={e.status} /></td>
                    {scope === "ALL" && (
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-ink font-medium">
                            {e.organizerName || "Nexora Platform"}
                          </span>
                          {isMyEvent && (
                            <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider">
                              Your NGO
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="text-xs font-mono text-mist">{formatDateTime(e.startAt)}</td>
                    <td className="text-xs font-mono text-mist">{formatDateTime(e.endAt)}</td>
                    <td className="text-xs">
                      <div className="font-mono text-ink font-semibold">
                        {e.participantCount}/{e.requiredVolunteers}
                      </div>
                      <div className="text-mist text-[11px]">volunteers joined</div>
                    </td>
                    <td className="text-right space-x-1 whitespace-nowrap">
                      {isMyEvent ? (
                        <>
                          <Link href={`/ngo/events/${e.id}`}>
                            <Button variant="secondary" size="sm">Manage</Button>
                          </Link>
                          {e.status === "PENDING_REVIEW" && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => changeStatus(e.id, "OPEN")}>Approve</Button>
                              <Button variant="ghost" size="sm" onClick={() => changeStatus(e.id, "REJECTED")}>Reject</Button>
                            </>
                          )}
                          {e.status === "OPEN" && (
                            <Button variant="ghost" size="sm" onClick={() => changeStatus(e.id, "ONGOING")}>Start</Button>
                          )}
                          {e.status === "ONGOING" && (
                            <Button variant="ghost" size="sm" onClick={() => changeStatus(e.id, "CLOSED")}>Finish</Button>
                          )}
                        </>
                      ) : (
                        <Link href={`/ngo/events/${e.id}`}>
                          <Button variant="secondary" size="sm">View Details</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
