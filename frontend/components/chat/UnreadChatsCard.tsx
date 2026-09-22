"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Globe, ArrowRight, Radio, CheckCircle2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ChatUnreadSummary } from "@/lib/types";

interface UnreadChatsCardProps {
  rolePath: "admin" | "ngo" | "volunteer";
}

export function UnreadChatsCard({ rolePath }: UnreadChatsCardProps) {
  const [summary, setSummary] = useState<ChatUnreadSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSummary() {
    try {
      const data = await api<ChatUnreadSummary>("/api/v1/chat/unread-summary");
      setSummary(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalUnread = summary?.totalUnreadCount ?? 0;
  const globalUnread = summary?.globalUnreadCount ?? 0;
  const unreadEvents = summary?.unreadEvents ?? [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-100 flex items-center gap-2">
              Operational Communications
              {totalUnread > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  {totalUnread} unread
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Caught up
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live broadcast & mission dispatch channels
            </p>
          </div>
        </div>

        <Link
          href={`/${rolePath}/global-chat`}
          className="text-xs font-semibold text-slate-400 hover:text-red-400 transition flex items-center gap-1 font-mono"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading && !summary ? (
        <div className="py-6 text-center text-xs text-slate-500 font-mono">
          Scanning communication frequencies...
        </div>
      ) : totalUnread === 0 ? (
        <div className="py-4 flex items-center gap-3 px-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-200 font-medium">All transmissions acknowledged.</span>
            <p className="text-slate-500 text-[11px]">
              No unread messages across global and mission channels.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Global Chat Unread Item */}
          {globalUnread > 0 && (
            <Link
              href={`/${rolePath}/global-chat`}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 hover:bg-slate-900/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-red-400 transition">
                      Global Incident Broadcast
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {globalUnread} new
                    </span>
                  </div>
                  {summary?.latestGlobalMessage && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      <span className="text-slate-500 font-mono">
                        {summary.latestGlobalSenderName || "User"}:
                      </span>{" "}
                      {summary.latestGlobalMessage}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          )}

          {/* Event Chat Unread Items */}
          {unreadEvents.map((evt) => (
            <Link
              key={evt.eventId}
              href={`/${rolePath}/events/${evt.eventId}/chat`}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 hover:bg-slate-900/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="h-7 w-7 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-red-400 transition truncate">
                      {evt.eventTitle}
                    </span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {evt.unreadCount} new
                    </span>
                  </div>
                  {evt.lastMessage && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      <span className="text-slate-500 font-mono">
                        {evt.lastSenderName || "Member"}:
                      </span>{" "}
                      {evt.lastMessage}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

