import * as React from "react";
import { cn } from "@/lib/utils";
import type { NgoStatus, EventStatus, VolunteerStatus, Severity, EventType } from "@/lib/types";

const base = "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border whitespace-nowrap";

type Tone = "signal" | "ink" | "relief" | "warning" | "muted" | "outline";

const tones: Record<Tone, string> = {
  signal: "bg-red-500/15 text-red-300 border-red-500/30",
  ink: "bg-slate-800 text-slate-200 border-slate-700",
  relief: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  muted: "bg-slate-800/60 text-slate-400 border-slate-700",
  outline: "bg-transparent text-slate-400 border-slate-700",
};

export function Badge({
  tone = "ink",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn(base, tones[tone], className)} {...props} />;
}

/* Status-mapping helpers — derived from the backend enums. */
export function NgoStatusBadge({ status }: { status: NgoStatus }) {
  if (status === "APPROVED") return <Badge tone="relief">Approved</Badge>;
  if (status === "PENDING") return <Badge tone="warning">Pending review</Badge>;
  return <Badge tone="signal">Rejected</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  switch (status) {
    case "DRAFT":     return <Badge tone="outline">Draft</Badge>;
    case "OPEN":      return <Badge tone="signal">Open</Badge>;
    case "ONGOING":   return <Badge tone="warning">Ongoing</Badge>;
    case "CLOSED":    return <Badge tone="muted">Closed</Badge>;
    case "CANCELLED": return <Badge tone="muted">Cancelled</Badge>;
  }
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, Tone> = {
    LOW: "muted",
    MEDIUM: "warning",
    HIGH: "signal",
    CRITICAL: "signal",
  };
  return <Badge tone={map[severity]}>{severity.toLowerCase()}</Badge>;
}

export function EventTypeBadge({ type }: { type: EventType }) {
  return <Badge tone="outline">{type.toLowerCase()}</Badge>;
}

export function VolunteerStatusBadge({ status }: { status: VolunteerStatus }) {
  switch (status) {
    case "ACTIVE": return <Badge tone="relief">Active</Badge>;
    case "PENDING_VERIFICATION": return <Badge tone="warning">Pending verification</Badge>;
    case "INACTIVE": return <Badge tone="muted">Inactive</Badge>;
  }
}
