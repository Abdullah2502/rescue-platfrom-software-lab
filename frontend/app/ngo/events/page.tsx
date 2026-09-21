"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, SeverityBadge, EventTypeBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { DisasterEventResponse, EventStatus, PageResp } from "@/lib/types";

export default function NgoEventsPage() {
  const [data, setData] = useState<PageResp<DisasterEventResponse> | null>(null);
  useEffect(() => { api<PageResp<DisasterEventResponse>>("/api/v1/ngo/events?page=0&size=50").then(setData).catch(() => {}); }, []);

  async function changeStatus(id: number, s: EventStatus) {
    try {
      await api(`/api/v1/events/${id}/status?status=${s}`, { method: "PATCH" });
      const d = await api<PageResp<DisasterEventResponse>>("/api/v1/ngo/events?page=0&size=50");
      setData(d);
      toast("info", `Event ${s.toLowerCase()}.`);
    } catch (ex: any) {
      toast("error", "Could not update status", ex.message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Disaster events."
        description="Every event you've opened. Volunteers join directly; you only need the live participant count."
        actions={
          <Link href="/ngo/events/new">
            <Button><Plus className="h-4 w-4" /> New event</Button>
          </Link>
        }
      />

      {!data || data.content.length === 0 ? (
        <EmptyState
          title="No events yet."
          description="Create a disaster event to start recruiting volunteers."
          action={
            <Link href="/ngo/events/new">
              <Button>Create event</Button>
            </Link>
          }
        />
      ) : (
        <div className="border border-ink-300 rounded bg-surface overflow-hidden">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Roster</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/ngo/events/${e.id}`} className="font-medium text-ink hover:text-signal">
                      {e.title}
                    </Link>
                  </td>
                  <td><EventTypeBadge type={e.type} /></td>
                  <td><SeverityBadge severity={e.severity} /></td>
                  <td><EventStatusBadge status={e.status} /></td>
                  <td className="text-xs font-mono text-mist">{formatDateTime(e.startAt)}</td>
                  <td className="text-xs font-mono text-mist">{formatDateTime(e.endAt)}</td>
                  <td className="text-xs">
                    <div className="font-mono">{e.participantCount}/{e.requiredVolunteers}</div>
                    <div className="text-mist">volunteers joined</div>
                  </td>
                  <td className="space-x-1">
                    <Link href={`/ngo/events/${e.id}`}>
                      <Button variant="secondary" size="sm">Manage</Button>
                    </Link>
                    {e.status === "OPEN"    && <Button variant="ghost" size="sm" onClick={() => changeStatus(e.id, "ONGOING")}>Start</Button>}
                    {e.status === "ONGOING" && <Button variant="ghost" size="sm" onClick={() => changeStatus(e.id, "CLOSED")}>Close</Button>}
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
