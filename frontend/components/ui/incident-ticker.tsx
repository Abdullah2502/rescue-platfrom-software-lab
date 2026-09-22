"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Activity } from "lucide-react";
import { api } from "@/lib/api";

export function IncidentTicker() {
  const [tickerEvents, setTickerEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the 5 most recent active events for the ticker
    api<{ content: any[] }>("/api/v1/events?size=5&sort=createdAt,desc")
      .then((res) => {
        // Filter only open/ongoing events just in case, though the backend already handles this
        setTickerEvents(res.content || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-red-500 text-white overflow-hidden flex items-center h-10 border-y border-red-600">
      <div className="bg-red-950 px-4 h-full flex items-center justify-center z-10 shrink-0 border-r border-red-500/50 gap-2">
        <Activity className="h-4 w-4 text-red-500 animate-pulse" />
        <span className="font-mono text-[10px] font-bold tracking-widest text-red-500">
          LIVE FEED
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center">
        {loading ? (
          <div className="text-xs font-mono px-4 text-red-200">
            Establishing connection to dispatch network...
          </div>
        ) : tickerEvents.length === 0 ? (
          <div className="text-xs font-mono px-4 text-red-200">
            No active emergency dispatches currently logged on the network.
          </div>
        ) : (
          <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-4">
            {/* We duplicate the map so the CSS marquee effect scrolls infinitely and seamlessly */}
            {[...tickerEvents, ...tickerEvents].map((event, i) => (
              <span key={`${event.id}-${i}`} className="flex items-center gap-2 text-xs font-mono">
                <AlertTriangle className="h-3.5 w-3.5 text-red-200" />
                <span className="font-bold">{event.title}</span>
                <span className="text-red-200 opacity-80">
                  | Severity: {event.severity} | Volunteers Required: {event.requiredVolunteers}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}