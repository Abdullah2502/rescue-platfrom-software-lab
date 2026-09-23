"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Megaphone, MapPin, Activity, RefreshCw, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { StatCard, PageHeader, ErrorState } from "@/components/ui/page";
import { UnreadChatsCard } from "@/components/chat/UnreadChatsCard";

type Stats = {
  ngosPending: number;
  ngosApproved: number;
  ngosRejected: number;
  volunteersTotal: number;
  volunteersPending: number;
  volunteersActive: number;
  eventsActive: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Record<string, number>>("/api/v1/admin/stats");
      setStats({
        ngosPending: data.ngosPending ?? 0,
        ngosApproved: data.ngosApproved ?? 0,
        ngosRejected: data.ngosRejected ?? 0,
        volunteersTotal: data.volunteersTotal ?? 0,
        volunteersPending: data.volunteersPending ?? 0,
        volunteersActive: data.volunteersActive ?? 0,
        eventsActive: data.eventsActive ?? 0,
      });
    } catch (ex: any) {
      setError(ex?.message || "Could not load platform stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="SUPER ADMIN COMMAND CENTER"
        title="Platform telemetry & national overview."
        description="Real-time disaster coordination, volunteer registrations, and NGO approval status."
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-300 transition hover:border-red-500/40 hover:text-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      {error && (
        <ErrorState
          title="Could not load stats"
          description={error}
          action={
            <button
              onClick={load}
              className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-red-300 hover:bg-red-900/60"
            >
              Try again
            </button>
          }
        />
      )}

      {loading && !stats && !error && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3 font-mono text-sm">
          <Activity className="h-5 w-5 text-red-500 animate-spin" />
          <span>Loading command center telemetry…</span>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <StatCard label="NGOs Pending" value={stats.ngosPending} hint="Requires review" />
            <StatCard label="NGOs Approved" value={stats.ngosApproved} hint="Active partners" />
            <StatCard label="NGOs Rejected" value={stats.ngosRejected} hint="Declined applications" />
            <StatCard label="Volunteers Pending" value={stats.volunteersPending} hint="Awaiting approval" />
            <StatCard label="Volunteers Active" value={stats.volunteersActive} hint={`of ${stats.volunteersTotal} total`} />
            <StatCard label="Active Events" value={stats.eventsActive} hint="Live disaster dispatches" />
          </div>

          <UnreadChatsCard rolePath="admin" />

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink tracking-tight">Administrative Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <QuickAction
                href="/admin/ngos"
                icon={<ShieldCheck className="h-6 w-6 text-red-500" />}
                title="Review NGO Approvals"
                body="Inspect incoming organizational registrations, verify credentials, and grant dispatch rights."
              />
              <QuickAction
                href="/admin/events"
                icon={<Megaphone className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />}
                title="Monitor Active Events"
                body="Track real-time disaster events, participant counts, and certificate issuance."
              />
              <QuickAction
                href="/admin/volunteers"
                icon={<Users className="h-6 w-6 text-amber-500 dark:text-amber-400" />}
                title="Approve & Manage Volunteers"
                body="Review pending volunteer applications, then filter the directory by Division, District, Thana, skill tag, or phone number."
              />
              <QuickAction
                href="/admin/forecast"
                icon={<TrendingUp className="h-6 w-6 text-rose-500 dark:text-rose-400" />}
                title="Predictive Demand Forecasting"
                body="Analyze historical disaster frequencies, live Open-Meteo weather feeds, and volunteer deficit ratios to forecast relief bottlenecks."
              />
              <QuickAction
                href="/admin/locations"
                icon={<MapPin className="h-6 w-6 text-cyan-400" />}
                title="Manage Territorial Hierarchy"
                body="Maintain Bangladesh divisions, districts, and thanas administrative database."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="glass-card p-6 rounded-2xl flex items-start gap-5 hover:border-red-500/40 border border-ink-300 transition group shadow-sm">
      <div className="p-3 rounded-xl bg-surface border border-ink-300 group-hover:scale-110 transition-transform shrink-0 shadow-xs">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {title}
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-signal" />
        </h3>
        <p className="text-sm text-mist leading-relaxed">{body}</p>
      </div>
    </Link>
  );
}
