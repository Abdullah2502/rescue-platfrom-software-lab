"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPath } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Input, Label } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/page";
import type { AuthResponse } from "@/lib/types";
import { ArrowRight, ShieldCheck, Activity, Radio } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState<string>("");

  // Live Dhaka clock — a small operational detail that earns the "command bridge" feel
  useEffect(() => {
    const tick = () => {
      try {
        const fmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setClock(fmt.format(new Date()));
      } catch {
        setClock("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data);
      router.push(dashboardPath(data.principal.role));
    } catch (ex: any) {
      setError(ex.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Background grid — operational chart feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Ambient glows — signal red + relief green, kept restrained */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-red-600/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 h-[380px] w-[380px] rounded-full bg-emerald-600/10 blur-[140px]"
      />

      {/* Top status bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_18px_-2px_rgba(239,68,68,0.6)] transition-transform group-hover:scale-105">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-100">
              Nexora<span className="text-red-500">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5 font-mono uppercase tracking-wider text-[11px] text-slate-400">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Operational
            </span>
            <span className="text-slate-700">·</span>
            <span>Asia/Dhaka</span>
            <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-slate-200">
              {clock || "—"} UTC+6
            </span>
          </div>

          <Link
            href="/"
            className="font-mono uppercase tracking-wider text-[11px] text-slate-400 transition hover:text-slate-100"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Two-panel command bridge */}
      <div className="relative z-10 container grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-12 items-stretch gap-0 py-10 lg:py-0">
        {/* LEFT — tactical briefing panel */}
        <section className="relative lg:col-span-7 flex flex-col justify-between py-8 lg:py-16 lg:pr-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-red-400">
              <Radio className="h-3 w-3" />
              Bangladesh Disaster Response Coordination
            </div>

            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-slate-100">
              Command
              <br />
              <span className="text-red-500">
                bridge
              </span>
              <span className="text-red-500">.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-slate-400 leading-relaxed">
              Sign in to dispatch volunteers, open incidents, and monitor
              live coordination across 8 Divisions, 64 Districts, and 495+ Thanas.
            </p>
          </div>

          {/* Tactical map / telemetry block */}
          <div className="mt-10 lg:mt-12">
            <TacticalMap />
          </div>

          {/* Live stats row */}
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
            <Metric value="02" label="Active events" hint="Live" pulse />
            <Metric value="1,284" label="Deployed" hint="YTD" />
            <Metric value="8m 22s" label="Avg response" hint="Median" />
            <Metric value="12,430" label="Volunteers" hint="Network" />
          </dl>
        </section>

        {/* RIGHT — login control panel */}
        <section className="relative lg:col-span-5 flex items-center py-8 lg:py-16">
          {/* Vertical hairline divider on lg+ */}
          <span
            aria-hidden
            className="absolute left-0 top-12 bottom-12 hidden w-px bg-gradient-to-b from-transparent via-red-500/30 to-transparent lg:block"
          />

          <div className="w-full lg:pl-12">
            <div className="mb-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Authenticate
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Session v1
              </span>
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Sign in to your
              <br />
              operations console.
            </h2>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@nexora.bd"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="font-mono text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-md border-slate-700/80 bg-slate-900/60 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              {error && (
                <ErrorState title="Sign-in failed" description={error} />
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="group h-12 w-full rounded-md text-sm font-semibold uppercase tracking-wider shadow-[0_0_28px_-6px_rgba(239,68,68,0.6)] transition-all hover:shadow-[0_0_32px_-4px_rgba(239,68,68,0.8)]"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Signing in…" : "Sign in"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </Button>

              <div className="relative my-4 flex items-center">
                <span className="h-px flex-1 bg-slate-800" />
                <span className="px-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/register/volunteer"
                  className="group flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-500/40 hover:bg-slate-900/80"
                >
                  <span>
                    <span className="block font-semibold text-slate-100">Volunteer</span>
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      Register
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
                </Link>
                <Link
                  href="/register/ngo"
                  className="group flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-200 transition hover:border-red-500/40 hover:bg-slate-900/80"
                >
                  <span>
                    <span className="block font-semibold text-slate-100">NGO</span>
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      Register
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-red-400" />
                </Link>
              </div>
            </form>

            <p className="mt-8 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              All access is logged · Compliance: BD-DR-2024
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ----------------------------------------------------------------------------
 * Tactical map — stylized Bangladesh with division nodes and a live pulse
 * -------------------------------------------------------------------------- */

function TacticalMap() {
  // Approximate positions of 8 divisions on a 600x340 svg canvas
  const divisions = [
    { id: "DHK", label: "Dhaka", x: 305, y: 175, status: "alert" },
    { id: "CTG", label: "Chattogram", x: 420, y: 270, status: "ok" },
    { id: "RAJ", label: "Rajshahi", x: 200, y: 130, status: "ok" },
    { id: "KHL", label: "Khulna", x: 230, y: 240, status: "alert" },
    { id: "BAR", label: "Barishal", x: 295, y: 280, status: "ok" },
    { id: "SYL", label: "Sylhet", x: 415, y: 105, status: "ok" },
    { id: "RNP", label: "Rangpur", x: 250, y: 55, status: "ok" },
    { id: "MYM", label: "Mymensingh", x: 340, y: 110, status: "ok" },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          Tactical view · National grid
        </div>
        <span className="rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          BD-NET · 8 div
        </span>
      </div>

      {/* SVG map */}
      <div className="relative mt-4">
        <svg
          viewBox="0 0 600 340"
          className="h-auto w-full"
          role="img"
          aria-label="Stylized map of Bangladesh with division nodes"
        >
          <defs>
            <radialGradient id="nodeOk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nodeAlert" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stylized country outline (deliberately simplified) */}
          <path
            d="M250,40 C320,30 410,55 460,90 C510,125 520,170 490,215 C460,260 400,310 320,315 C240,320 180,290 160,250 C140,210 150,170 170,130 C190,90 210,55 250,40 Z"
            fill="rgba(15,23,42,0.6)"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="1"
          />

          {/* Inner administrative grid lines */}
          <g stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" fill="none">
            <path d="M180,90 L420,90" />
            <path d="M160,160 L480,160" />
            <path d="M170,230 L470,230" />
            <path d="M280,50 L300,310" />
            <path d="M380,55 L420,290" />
          </g>

          {/* Connection lines between division nodes */}
          <g
            stroke="rgba(239,68,68,0.25)"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            fill="none"
          >
            <path d="M305,175 L420,270" />
            <path d="M305,175 L230,240" />
            <path d="M305,175 L200,130" />
            <path d="M305,175 L415,105" />
            <path d="M305,175 L340,110" />
            <path d="M305,175 L295,280" />
            <path d="M305,175 L250,55" />
          </g>

          {/* Division nodes */}
          {divisions.map((d) => (
            <g key={d.id} transform={`translate(${d.x},${d.y})`}>
              <circle
                r="14"
                fill={d.status === "alert" ? "url(#nodeAlert)" : "url(#nodeOk)"}
              />
              <circle
                r="4"
                fill={d.status === "alert" ? "#EF4444" : "#10B981"}
                stroke="#06090F"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="-10"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="8"
                fill="#94A3B8"
                letterSpacing="0.08em"
              >
                {d.id}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Standing
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Incident active
          </span>
          <span className="ml-auto text-slate-500">
            Updated · {new Date().toLocaleDateString("en-GB")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Metric — small live stat
 * -------------------------------------------------------------------------- */

function Metric({
  value,
  label,
  hint,
  pulse,
}: {
  value: string;
  label: string;
  hint?: string;
  pulse?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
        {pulse && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
        )}
        {label}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
        {value}
      </div>
      {hint && (
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {hint}
        </div>
      )}
    </div>
  );
}
