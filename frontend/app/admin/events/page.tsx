"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Award, CheckCircle, XCircle, Clock, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, SeverityBadge, EventTypeBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { CertificateGenerationResponse, DisasterEventResponse, EventStatus, PageResp } from "@/lib/types";

export default function AdminEventsPage() {
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING">("ALL");

  async function load() {
    try {
      const resp = await api<PageResp<DisasterEventResponse>>("/api/v1/admin/events?page=0&size=100");
      setData(resp);
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(event: DisasterEventResponse, newStatus: EventStatus) {
    setBusy(event.id);
    try {
      await api(`/api/v1/events/${event.id}/status?status=${newStatus}`, { method: "PATCH" });
      await load();
      toast(
        "success",
        `Event ${newStatus === "OPEN" ? "Approved & Published" : "Rejected"}`,
        `The event status is now ${newStatus.toLowerCase()}.`
      );
    } catch (e: any) {
      toast("error", "Could not update status", e.message);
    } finally {
      setBusy(null);
    }
  }

  async function generate(event: DisasterEventResponse) {
    setBusy(event.id);
    try {
      const result = await api<CertificateGenerationResponse>(
        `/api/v1/admin/events/${event.id}/certificates/generate`,
        { method: "POST" }
      );
      toast(
        "success",
        "Certificates generated",
        `${result.generated} new certificate(s) for ${result.participantCount} participant(s).`
      );
    } catch (e: any) {
      toast("error", "Could not generate certificates", e.message);
    } finally {
      setBusy(null);
    }
  }

  const pendingCount = data?.content.filter((e) => e.status === "PENDING_REVIEW").length || 0;
  const filteredEvents = (data?.content || []).filter((e) => {
    if (filter === "PENDING") return e.status === "PENDING_REVIEW";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All disaster events."
        description="Monitor every response effort, review volunteer proposals, create platform events, and issue participation certificates."
        actions={
          <Link href="/admin/events/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create event
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-ink-300 gap-6">
        <button
          onClick={() => setFilter("ALL")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            filter === "ALL"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <CalendarDays className="h-4 w-4" /> All Operations ({data?.content.length || 0})
        </button>

        <button
          onClick={() => setFilter("PENDING")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            filter === "PENDING"
              ? "border-signal text-signal font-semibold"
              : "border-transparent text-mist hover:text-ink"
          }`}
        >
          <Clock className="h-4 w-4" /> Pending Proposals ({pendingCount})
        </button>
      </div>

      {!data || filteredEvents.length === 0 ? (
        <EmptyState
          title={filter === "PENDING" ? "No pending event proposals." : "No events recorded."}
          description={filter === "PENDING" ? "All volunteer event requests have been reviewed." : undefined}
        />
      ) : (
        <div className="border border-ink-300 rounded bg-surface overflow-hidden">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type & Severity</th>
                <th>Organizer / Target</th>
                <th>Timing</th>
                <th>Status</th>
                <th>Volunteers</th>
                <th>Actions & Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="font-medium text-ink max-w-[220px]">
                    <div className="truncate font-semibold">{event.title}</div>
                    <div className="text-[11px] text-mist truncate">
                      {event.divisions?.map((d) => d.name).join(", ") || "Bangladesh"}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <EventTypeBadge type={event.type} />
                      <SeverityBadge severity={event.severity} />
                    </div>
                  </td>
                  <td className="text-xs">
                    <span className="font-medium text-ink block">{event.organizerName}</span>
                    <span className="text-[10px] text-mist capitalize">{event.organizerType?.toLowerCase()}</span>
                  </td>
                  <td className="text-xs font-mono text-mist">
                    {formatDateTime(event.startAt)}
                  </td>
                  <td>
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td className="text-xs font-mono">
                    {event.participantCount}/{event.requiredVolunteers}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {event.status === "PENDING_REVIEW" ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busy === event.id}
                            onClick={() => changeStatus(event, "OPEN")}
                            className="text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === event.id}
                            onClick={() => changeStatus(event, "REJECTED")}
                            className="text-xs flex items-center gap-1 text-signal"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy === event.id || event.participantCount === 0}
                          onClick={() => generate(event)}
                          className="text-xs flex items-center gap-1"
                        >
                          {busy === event.id ? (
                            "Generating…"
                          ) : (
                            <>
                              <Award className="h-3.5 w-3.5" /> Certificate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
