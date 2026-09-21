import Link from "next/link";
import { ArrowRight, Users, Megaphone, ShieldCheck, Activity, MapPin, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { IncidentTicker } from "@/components/ui/incident-ticker";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-glow-signal group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-100">
              Nexora<span className="text-red-500">.</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Link
              href="/register/volunteer"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition"
            >
              Volunteer
            </Link>
            <Link
              href="/register/ngo"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition"
            >
              NGO Partner
            </Link>
            <Link
              href="/login"
              className="ml-3 nx-btn-primary text-xs tracking-wider uppercase px-5 py-2.5 shadow-glow-signal"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 border-b border-slate-800/60">
        {/* Background Gradient Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-red-500/30 text-xs font-mono font-medium text-red-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              BANGLADESH DISASTER RESPONSE COORDINATION NETWORK
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-100 leading-[1.05]">
              When the emergency <span className="text-red-500">signal</span> sounds, deploy with speed & precision.
            </h1>

            <p className="max-w-2xl text-lg text-slate-400 leading-relaxed font-sans">
              Nexora links non-governmental organizations and frontline volunteers across Bangladesh. Open a response event, let volunteers join directly, and keep participation records across every Division, District, and Thana.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link href="/register/volunteer" className="nx-btn-primary h-12 px-7 text-sm gap-3 shadow-glow-signal">
                Register as a Volunteer <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register/ngo" className="nx-btn-secondary h-12 px-7 text-sm gap-2">
                Register NGO Organization
              </Link>
            </div>
          </div>

          {/* Operational Metrics Panel */}
          <aside className="lg:col-span-4">
            <div className="glass-card p-7 rounded-2xl space-y-6 relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-semibold uppercase tracking-wider">
                  <MapPin className="h-4 w-4" /> Operational Footprint
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">BD NETWORK</span>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <MetricBlock value="8" label="Divisions" hint="Nationwide" />
                <MetricBlock value="64" label="Districts" hint="All territories" />
                <MetricBlock value="495+" label="Thanas" hint="Upazila level" />
                <MetricBlock value="24/7" label="Dispatch" hint="Live coordination" />
              </dl>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Layer Active
                </span>
                <span className="font-mono text-[11px] text-slate-500">Asia/Dhaka UTC+6</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Signature Element: Live Ticker */}
      <IncidentTicker />

      {/* Modern Workflow Section */}
      <section className="container py-24">
        <div className="space-y-3 mb-16 text-center max-w-3xl mx-auto">
          <div className="eyebrow inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> SYSTEM ARCHITECTURE
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-100">
            Three core roles. Unified operational platform.
          </h2>
          <p className="text-slate-400 text-base">
            Engineered specifically for disaster management dynamics in Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RoleCard
            badge="VOLUNTEERS"
            title="Find an event and join directly."
            body="Keep your location and skills current, browse every open response effort, join when you can help, and withdraw whenever plans change."
            icon={<Users className="h-6 w-6 text-emerald-400" />}
            accent="emerald"
          />
          <RoleCard
            badge="NGO PARTNERS"
            title="Open events and watch participation."
            body="Import volunteer lists, create emergency events, and see the live number of volunteers who joined without sending invitations."
            icon={<Megaphone className="h-6 w-6 text-red-500" />}
            accent="red"
          />
          <RoleCard
            badge="SUPER ADMIN"
            title="Govern entity lifecycle & territory data."
            body="Review NGO verification requests, audit system health, and oversee location administrative hierarchies nationwide."
            icon={<ShieldCheck className="h-6 w-6 text-amber-400" />}
            accent="amber"
          />
        </div>
      </section>

      {/* Self-join and certificate showcase */}
      <section className="border-y border-slate-800 bg-slate-900/40 relative">
        <div className="container py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="eyebrow flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> DISPATCH WORKFLOW
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-100 leading-snug">
              A join button turns intent into a coordinated response.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              When an incident command creates an event, every volunteer can see the brief, join directly, and withdraw any time. Afterward, admins can issue a verifiable certificate to everyone who joined.
            </p>
            <div className="inline-flex items-center gap-2 font-mono text-xs bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-slate-300">
              <span className="text-amber-400">OPEN EVENT</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400 font-bold">JOINED</span>
              <span className="text-slate-600">→</span>
              <span className="text-red-400 font-bold">CERTIFIED</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-semibold text-slate-100">Live Incident Dispatch Monitor</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: DIS-2026-BD-8092</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  ACTIVE EVENT
                </span>
              </div>

              <div className="space-y-4">
                <InvitationRow name="Rahim Ahmed" area="Khulna · Bagerhat" status="JOINED" time="2 mins ago" />
                <InvitationRow name="Nasrin Sultana" area="Khulna · Mongla" status="JOINED" time="5 mins ago" />
                <InvitationRow name="Tariq Hasan" area="Khulna · Dacope" status="CERTIFIED" time="7 mins ago" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 font-bold text-xs">
              N
            </div>
            <span className="font-display font-bold text-slate-100 text-base">Nexora Disaster Platform</span>
          </div>

          <p className="text-xs text-slate-500">
            Dedicated emergency volunteer coordination network for Bangladesh.
          </p>

          <div className="flex items-center gap-6 text-xs font-medium">
            <Link href="/login" className="hover:text-slate-100 transition">Sign In</Link>
            <Link href="/register/volunteer" className="hover:text-slate-100 transition">Volunteer Portal</Link>
            <Link href="/register/ngo" className="hover:text-slate-100 transition">NGO Portal</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MetricBlock({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
      <div className="font-display text-3xl font-bold text-slate-100 tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-slate-200">{label}</div>
      <div className="text-[11px] text-slate-500 font-mono">{hint}</div>
    </div>
  );
}

function RoleCard({
  badge,
  title,
  body,
  icon,
  accent,
}: {
  badge: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: "emerald" | "red" | "amber";
}) {
  return (
    <div className="glass-card p-8 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 group">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-400 tracking-wider bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
            {badge}
          </span>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </div>
        <h3 className="font-display text-xl font-bold text-slate-100 leading-snug group-hover:text-red-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}

function InvitationRow({ name, area, status, time }: { name: string; area: string; status: string; time: string }) {
  const isAccepted = status === "ACCEPTED";
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
      <div className="space-y-0.5">
        <div className="font-semibold text-slate-200">{name}</div>
        <div className="text-slate-400 font-mono text-[11px]">{area}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-slate-500">{time}</span>
        <span
          className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border ${
            isAccepted
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
