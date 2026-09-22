"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { api, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { NotificationResponse, PageResp } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export function NotificationBox() {
  const principal = useAuth((s) => s.principal);
  const token = useAuth((s) => s.accessToken);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!principal) return;

    // Initial fetch
    api<PageResp<NotificationResponse>>("/api/v1/notifications?size=50")
      .then((res) => {
        setNotifications(res.content);
        setUnreadCount(res.content.filter((n) => !n.isRead).length);
      })
      .catch(() => { });

    // SSE connection
    if (token) {
      const es = new EventSource(apiUrl("/api/v1/notifications/stream?token=" + token));
      es.addEventListener("notification", (e) => {
        try {
          const newNotif = JSON.parse(e.data) as NotificationResponse;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast("info", newNotif.title, newNotif.message);
        } catch (err) {
          console.error("Error parsing notification", err);
        }
      });
      return () => es.close();
    }
  }, [principal, token]);

  async function markAsRead(id: number) {
    try {
      await api(`/api/v1/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) { }
  }

  async function markAllAsRead() {
    try {
      await api(`/api/v1/notifications/read-all`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { }
  }

  if (!principal) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-xl border border-transparent bg-transparent hover:bg-slate-800/50 p-2 text-slate-400 hover:text-slate-100 transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-glow-signal">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/90">
            <h4 className="font-semibold text-slate-100 text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition"
              >
                <CheckCircle2 className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors cursor-pointer ${n.isRead ? "opacity-70 hover:bg-slate-800/20" : "bg-slate-800/30 hover:bg-slate-800/50"
                      }`}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h5 className={`text-xs ${!n.isRead ? "font-semibold text-slate-200" : "font-medium text-slate-300"}`}>
                        {n.title}
                      </h5>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1 shadow-glow-signal" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {n.createdAt ? formatDateTime(n.createdAt) : "Just now"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
