"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, LucideIcon, Activity, Shield, User, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, logoutAndGoHome } from "@/lib/auth";
import { api } from "@/lib/api";
import type { ChatUnreadSummary } from "@/lib/types";
import { NotificationBox } from "@/components/ui/notification-box";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
};

export function AppShell({
  brand = "Nexora",
  role,
  nav,
  pageEyebrow,
  pageTitle,
  pageDescription,
  children,
}: {
  brand?: string;
  role: "ROLE_SUPER_ADMIN" | "ROLE_NGO_ADMIN" | "ROLE_VOLUNTEER";
  nav: NavItem[];
  pageEyebrow?: string;
  pageTitle?: string;
  pageDescription?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { principal, clear } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [unread, setUnread] = React.useState<{ global: number; events: number }>({ global: 0, events: 0 });

  React.useEffect(() => {
    let active = true;
    async function fetchUnread() {
      try {
        const res = await api<ChatUnreadSummary>("/api/v1/chat/unread-summary");
        if (active && res) {
          setUnread({
            global: res.globalUnreadCount || 0,
            events: res.eventUnreadCount || 0,
          });
        }
      } catch {
        // Silently keep current state if network/endpoint issues
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const roleLabel =
    role === "ROLE_SUPER_ADMIN" ? "SUPER ADMIN" :
      role === "ROLE_NGO_ADMIN" ? "NGO ADMIN" :
        "VOLUNTEER";

  const RoleIcon =
    role === "ROLE_SUPER_ADMIN" ? Shield :
      role === "ROLE_NGO_ADMIN" ? Building :
        User;

  const enrichedNav = nav.map((item) => {
    let badge = item.badge;
    if (item.href.includes("global-chat")) {
      badge = unread.global;
    } else if (item.href.includes("event-chats")) {
      badge = unread.events;
    }
    return { ...item, badge };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Glass Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-glow-signal">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-100">
                {brand}<span className="text-red-500">.</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold tracking-wider text-red-400">
              <RoleIcon className="h-3.5 w-3.5" />
              <span>{roleLabel}</span>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-2">
            <NotificationBox />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 h-9 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-700 transition"
              >
                <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                  {principal?.name?.substring(0, 1) ?? "U"}
                </div>
                <span className="hidden sm:inline">{principal?.name ?? "Account"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 border border-slate-800 bg-slate-900 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-2xl"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-xs border-b border-slate-800/80">
                    <div className="font-semibold text-slate-200">{principal?.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{principal?.email}</div>
                  </div>
                  <button
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 rounded-lg w-full hover:bg-red-500/10 transition"
                    onClick={() => { clear(); router.push("/login"); }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/95 px-3 py-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {enrichedNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold relative",
                active ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full",
                  active ? "bg-white text-red-600 shadow-sm" : "bg-red-500 text-white"
                )}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-1">
        {/* Left Sidebar Navigation */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 space-y-6 md:block">
          <nav className="space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Navigation
            </div>
            {enrichedNav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-signal font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-[10px] font-mono font-bold rounded-full transition-all",
                        active
                          ? "bg-white text-red-600 shadow-sm"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800/60 space-y-2">
            <button
              onClick={() => logoutAndGoHome()}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 w-full hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Dashboard Area */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {(pageTitle || pageEyebrow) && (
            <div className="space-y-2 border-b border-slate-800 pb-6">
              {pageEyebrow && (
                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">
                  {pageEyebrow}
                </div>
              )}
              {pageTitle && (
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-100">{pageTitle}</h1>
              )}
              {pageDescription && <p className="text-sm text-slate-400 max-w-3xl">{pageDescription}</p>}
            </div>
          )}
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
