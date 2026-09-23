"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, SeverityBadge, EventTypeBadge } from "@/components/ui/badge";
import { PageHeader, StatCard, EmptyState, SectionTitle } from "@/components/ui/page";
import { UnreadChatsCard } from "@/components/chat/UnreadChatsCard";
import { formatDateTime } from "@/lib/utils";
import type { DisasterEventResponse, NgoResponse, PageResp } from "@/lib/types";

export default function NgoDashboard() {
  const [profile, setProfile] = useState<NgoResponse | null>(null);
  const [events, setEvents] = useState<PageResp<DisasterEventResponse> | null>(null);

  useEffect(() => {
    api<NgoResponse>("/api/v1/ngo/profile").then(setProfile).catch(() => {});
    api<PageResp<DisasterEventResponse>>("/api/v1/ngo/events?page=0&size=20").then(setEvents).catch(() => {});
  }, []);

  const open = events?.content.filter((e) => e.status === "OPEN").length ?? 0;
  const ongoing = events?.content.filter((e) => e.status === "ONGOING").length ?? 0;
  const closed = events?.content.filter((e) => e.status === "CLOSED").length ?? 0;
  const totalAccepted = events?.content.reduce((s, e) => s + (e.participantCount ?? 0), 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="NGO dashboard"
        title={profile ? profile.name : "Your operations"}
        description={
          profile
            ? `Operating in ${[profile.thana?.name, profile.district?.name, profile.division?.name].filter(Boolean).join(", ")}.`
            : undefined
        }
        actions={
          <Link href="/ngo/events/new">
            <Button><Plus className="h-4 w-4" /> New event</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open events"     value={open}    />
        <StatCard label="Ongoing"         value={ongoing} />
        <StatCard label="Closed"          value={closed}  />
        <StatCard label="Volunteers committed" value={totalAccepted} hint="Across all events" />
      </div>

      <div className="mt-8">
        <UnreadChatsCard rolePath="ngo" />
      </div>

      <div className="mt-6 bg-surface p-6 rounded-2xl border border-ink-300 hover:border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group shadow-sm transition">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-paper-200 dark:bg-slate-800/80 border border-ink-300 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Predictive Demand Forecasting
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                AI Telemetry
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-ink group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Territorial Resource & Volunteer Demand Models
            </h3>
            <p className="text-sm text-mist max-w-2xl leading-relaxed">
              Synthesizing historical disasters, real-time Open-Meteo weather feeds, and volunteer deficit ratios. Your registered operational division is prioritized.
            </p>
          </div>
        </div>
        <Link
          href="/ngo/forecast"
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-ink-300 hover:border-amber-500 px-4 py-2.5 font-mono text-xs font-bold text-ink hover:text-amber-700 dark:hover:text-amber-400 transition shrink-0 self-start sm:self-center shadow-xs"
        >
          <span>Open Forecast Center</span>
          <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </Link>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle eyebrow="Recent activity" title="Your events" />
          <Link href="/ngo/events" className="text-sm text-signal hover:underline flex items-center gap-1">
            All events <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {events?.content.length === 0 ? (
          <EmptyState
            title="No events yet."
            description="Open your first disaster event so volunteers can join directly."
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
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {events?.content.map((e) => (
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
                    <td className="text-xs">
                      <span className="font-mono">
                        {e.participantCount}/{e.requiredVolunteers}
                      </span>
                      <span className="text-mist"> · volunteers joined</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
