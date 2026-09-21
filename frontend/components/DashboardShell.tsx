"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAndGoHome, useAuth } from "@/lib/auth";

interface Props {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}

export default function DashboardShell({ title, nav, children }: Props) {
  const path = usePathname();
  const principal = useAuth((s) => s.principal);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-5 space-y-6">
        <div>
          <Link href="/" className="font-display text-xl font-bold text-slate-100">
            Nexora<span className="text-red-500">.</span>
          </Link>
          <p className="mt-1 font-mono text-xs text-slate-400 truncate">
            {principal?.name} ({principal?.role})
          </p>
        </div>
        <nav className="space-y-1.5">
          {nav.map((n) => {
            const active = path === n.href || path?.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-red-600 text-white shadow-glow-signal font-bold"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={logoutAndGoHome}
            className="mt-6 w-full rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="font-display text-3xl font-bold text-slate-100">{title}</h1>
        <div>{children}</div>
      </main>
    </div>
  );
}
