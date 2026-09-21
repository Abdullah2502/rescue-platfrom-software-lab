"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { DisasterEventResponse } from "@/lib/types";

type Row = {
  id: number | string;
  at: string;
  type: string;
  location: string;
  title: string;
  status: "open" | "ongoing" | "closed";
  needed?: number;
  accepted?: number;
};

const FALLBACK: Row[] = [
  { id: "f1", at: "23:14", type: "FLOOD", location: "Cox's Bazar", title: "Flash flood emergency deployment", status: "open", needed: 412, accepted: 287 },
  { id: "f2", at: "22:51", type: "CYCLONE", location: "Khulna & Satkhira", title: "Coastal cyclone warning & evac roster", status: "ongoing", needed: 180, accepted: 96 },
  { id: "f3", at: "21:08", type: "FIRE", location: "Dhaka · Mirpur", title: "Industrial fire rescue assistance", status: "closed", needed: 60, accepted: 60 },
  { id: "f4", at: "19:42", type: "EARTHQUAKE", location: "Sylhet Region", title: "Rapid structural audit & medical team", status: "closed", needed: 40, accepted: 40 },
  { id: "f5", at: "17:30", type: "PANDEMIC", location: "Rangpur", title: "Field medical camp & relief distribution", status: "open", needed: 220, accepted: 134 },
];

function fromEvents(events: DisasterEventResponse[]): Row[] {
  if (!events?.length) return FALLBACK;
  return events.slice(0, 8).map((e) => ({
    id: e.id,
    at: e.createdAt ? new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—",
    type: e.type,
    location: e.divisions?.[0]?.name || "Bangladesh",
    title: e.title,
    status: e.status === "ONGOING" ? "ongoing" : e.status === "CLOSED" ? "closed" : "open",
    needed: e.requiredVolunteers,
    accepted: e.participantCount,
  }));
}

export function IncidentTicker({
  events,
  label = "LIVE DISASTER FEED",
  className,
}: {
  events?: DisasterEventResponse[];
  label?: string;
  className?: string;
}) {
  const rows = React.useMemo(() => fromEvents(events ?? []), [events]);
  const loop = [...rows, ...rows];

  return (
    <section
      aria-label={label}
      className={cn(
        "relative border-y border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-100 overflow-hidden shadow-inner",
        className
      )}
    >
      {/* Left rail label */}
      <div className="absolute inset-y-0 left-0 z-20 flex items-center gap-3 px-5 bg-gradient-to-r from-slate-950 via-slate-950 to-slate-950/90 border-r border-slate-800 shadow-xl">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-glow-signal" />
        </span>
        <span className="font-mono text-xs font-bold tracking-wider text-red-500 uppercase flex items-center gap-1.5">
          {label}
        </span>
      </div>

      {/* Ticker track */}
      <div className="pl-48 py-3.5 overflow-hidden">
        <div className="flex w-max gap-8 animate-ticker motion-reduce:animate-none">
          {loop.map((r, i) => {
            const isCritical = r.status === "open";
            return (
              <div
                key={`${r.id}-${i}`}
                className="flex items-center gap-3 whitespace-nowrap bg-slate-900/60 border border-slate-800/60 px-3.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm hover:border-slate-700 transition"
              >
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider",
                    isCritical
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : r.status === "ongoing"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}
                >
                  {r.type}
                </span>

                <span className="font-mono text-slate-400 text-[11px]">{r.at}</span>
                <span className="text-slate-500">·</span>
                <span className="font-semibold text-slate-200">{r.location}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">{r.title}</span>

                {r.needed != null && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {r.accepted ?? 0}/{r.needed} Vol.
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
