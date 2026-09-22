"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Send, 
  Pin, 
  ShieldAlert, 
  Building2, 
  HeartHandshake, 
  Sparkles, 
  Clock, 
  X,
  MessageCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import type { ChatMessageResponse, Role } from "@/lib/types";

interface ChatRoomProps {
  title: string;
  subtitle: string;
  fetchUrl: string;
  sendUrl: string;
  pinUrlGenerator?: (messageId: number) => string;
  canPin: boolean;
  currentUserRole?: Role;
  emptyNotice?: string;
}

export function ChatRoom({
  title,
  subtitle,
  fetchUrl,
  sendUrl,
  pinUrlGenerator,
  canPin,
  currentUserRole,
  emptyNotice = "No messages yet. Start the conversation!",
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinBusy, setPinBusy] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  async function markAsRead(latestId: number) {
    if (!latestId) return;
    try {
      if (fetchUrl.includes("/chat/global")) {
        await api("/api/v1/chat/global/read", {
          method: "POST",
          body: JSON.stringify({ lastMessageId: latestId }),
        });
      } else if (fetchUrl.includes("/chat/events/")) {
        const parts = fetchUrl.split("/chat/events/");
        if (parts[1]) {
          const eventId = parts[1].split("/")[0].split("?")[0];
          if (eventId) {
            await api(`/api/v1/chat/events/${eventId}/read`, {
              method: "POST",
              body: JSON.stringify({ lastMessageId: latestId }),
            });
          }
        }
      }
    } catch {
      // Silent failure for read receipt
    }
  }

  async function loadMessages() {
    try {
      const data = await api<ChatMessageResponse[]>(fetchUrl);
      setMessages(data || []);
      if (data && data.length > 0) {
        const maxId = Math.max(...data.map((m) => m.id));
        markAsRead(maxId);
      }
    } catch {
      // Keep existing on intermittent failure
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
        setTimeout(scrollToBottom, 100);
      }
    }
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  // Active polling every 3 seconds
  useEffect(() => {
    isInitialLoad.current = true;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchUrl]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const sent = await api<ChatMessageResponse>(sendUrl, {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      setInput("");
      setMessages((prev) => [...prev, sent]);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      toast("error", "Could not send message", err.message);
    } finally {
      setSending(false);
    }
  }

  async function togglePin(msg: ChatMessageResponse) {
    if (!pinUrlGenerator) return;
    setPinBusy(msg.id);
    try {
      const updated = await api<ChatMessageResponse>(pinUrlGenerator(msg.id), {
        method: "PATCH",
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? updated : m))
      );
      toast(
        "success",
        updated.pinned ? "Message Pinned" : "Message Unpinned",
        updated.pinned
          ? "This message is now featured at the top of the chat."
          : "Message removed from pinned announcements."
      );
    } catch (err: any) {
      toast("error", "Pin update failed", err.message);
    } finally {
      setPinBusy(null);
    }
  }

  function renderRoleBadge(role: Role) {
    if (role === "ROLE_SUPER_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-red-500/15 text-red-300 border border-red-500/30">
          <ShieldAlert className="h-3 w-3" /> Admin
        </span>
      );
    }
    if (role === "ROLE_NGO_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <Building2 className="h-3 w-3" /> NGO Officer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <HeartHandshake className="h-3 w-3" /> Volunteer
      </span>
    );
  }

  const pinnedMessages = messages.filter((m) => m.pinned);
  const normalMessages = messages.filter((m) => !m.pinned);

  return (
    <div className="nx-card p-0 flex flex-col h-[calc(100vh-14rem)] min-h-[500px] border border-ink-300 overflow-hidden rounded-xl bg-surface shadow-xl">
      {/* Chat Room Header */}
      <div className="px-6 py-4 border-b border-ink-300 bg-surface-raised flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-ink text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-signal" />
            {title}
          </h2>
          <p className="text-xs text-mist mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-mist">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Channel</span>
        </div>
      </div>

      {/* Pinned Messages Banner (if any) */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <Pin className="h-3.5 w-3.5" /> Pinned Announcements ({pinnedMessages.length})
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {pinnedMessages.map((pm) => (
              <div
                key={pm.id}
                className="bg-surface/80 rounded-lg p-3 border border-amber-500/30 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{pm.senderName}</span>
                    {renderRoleBadge(pm.senderRole)}
                    <span className="text-[10px] text-mist">{formatDateTime(pm.createdAt)}</span>
                  </div>
                  <p className="text-ink font-medium whitespace-pre-wrap">{pm.message}</p>
                  {pm.pinnedBy && (
                    <span className="text-[10px] text-amber-300/80 block">
                      📌 Pinned by {pm.pinnedBy}
                    </span>
                  )}
                </div>

                {canPin && pinUrlGenerator && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pinBusy === pm.id}
                    onClick={() => togglePin(pm)}
                    className="text-mist hover:text-red-400 h-7 px-2 shrink-0"
                    title="Unpin message"
                  >
                    <X className="h-3.5 w-3.5" /> Unpin
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface/50"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-mist">
            Connecting to room stream...
          </div>
        ) : normalMessages.length === 0 && pinnedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-mist space-y-2">
            <MessageCircle className="h-10 w-10 text-mist/40" />
            <p className="text-sm font-medium">{emptyNotice}</p>
          </div>
        ) : (
          normalMessages.map((msg) => (
            <div
              key={msg.id}
              className="group flex items-start gap-3 text-sm hover:bg-surface-raised/40 p-2 rounded-lg transition-colors"
            >
              {/* Avatar circle */}
              <div className="h-9 w-9 rounded-full bg-surface-raised border border-ink-300 flex items-center justify-center text-xs font-bold text-ink shrink-0">
                {msg.senderName.substring(0, 2).toUpperCase()}
              </div>

              {/* Message Body */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink text-sm">{msg.senderName}</span>
                  {renderRoleBadge(msg.senderRole)}
                  <span className="text-xs text-mist font-mono">
                    {formatDateTime(msg.createdAt)}
                  </span>

                  {/* Pin action button on hover */}
                  {canPin && pinUrlGenerator && (
                    <button
                      onClick={() => togglePin(msg)}
                      disabled={pinBusy === msg.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-mist hover:text-amber-400 flex items-center gap-1 text-xs"
                      title="Pin message to room header"
                    >
                      <Pin className="h-3.5 w-3.5" /> Pin
                    </button>
                  )}
                </div>

                <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Composer */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-ink-300 bg-surface-raised flex items-center gap-3"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type your message here (press Enter to send)..."
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="w-full h-11 rounded-lg bg-surface border border-ink-300 px-4 text-sm text-ink placeholder:text-mist focus:outline-none focus:border-signal"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={sending || !input.trim()}
          className="flex items-center gap-2 h-11 px-5 shrink-0"
        >
          <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}

