"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Button } from "@/components/ui/button";
import type { DisasterEventResponse } from "@/lib/types";

export default function AdminEventChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<DisasterEventResponse | null>(null);

  useEffect(() => {
    api<DisasterEventResponse>(`/api/v1/events/${id}`)
      .then(setEvent)
      .catch(() => {});
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Channels
        </button>

        <span className="text-xs text-signal font-mono flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" /> Super Admin Universal Oversight
        </span>
      </div>

      <ChatRoom
        title={`Operation: ${event ? event.title : `Event #${id}`}`}
        subtitle={`Dedicated operations chat channel · Managed by ${event?.organizerName || "Organizer"}`}
        fetchUrl={`/api/v1/chat/events/${id}`}
        sendUrl={`/api/v1/chat/events/${id}`}
        pinUrlGenerator={(messageId) => `/api/v1/chat/events/${id}/${messageId}/pin`}
        canPin={true}
        currentUserRole="ROLE_SUPER_ADMIN"
        emptyNotice="No messages in this mission room yet. You can broadcast an announcement to all participants."
      />
    </div>
  );
}

