"use client";

import { useCallback, useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { flushOfflineQueue, offlineQueueEvent, queuedMutations } from "@/lib/offline";

export function OfflineSync() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setOnline(navigator.onLine);
    setPending((await queuedMutations().catch(() => [])).length);
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      const result = await flushOfflineQueue();
      setPending(result.remaining);
      if (result.synced > 0) window.dispatchEvent(new Event("nexora-operations-synced"));
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline = () => { refresh(); sync(); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", refresh);
    window.addEventListener(offlineQueueEvent, refresh);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", refresh);
      window.removeEventListener(offlineQueueEvent, refresh);
    };
  }, [refresh, sync]);

  if (online && pending === 0) return null;

  return (
    <button
      type="button"
      onClick={sync}
      disabled={!online || syncing}
      className="fixed bottom-4 left-4 z-[100] inline-flex h-11 items-center gap-2 rounded-full border border-slate-800 bg-slate-900/95 px-3 text-xs font-semibold text-slate-200 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] backdrop-blur-xl disabled:cursor-default"
      aria-live="polite"
    >
      {online ? <Cloud className="h-4 w-4 text-emerald-500" /> : <CloudOff className="h-4 w-4 text-amber-500" />}
      {!online ? "Working offline" : syncing ? "Syncing…" : `${pending} waiting to sync`}
      {online && pending > 0 && <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />}
    </button>
  );
}
