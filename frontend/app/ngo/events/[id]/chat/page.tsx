"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { ChatRoom } from "@/components/chat/ChatRoom";
import type { DisasterEventResponse } from "@/lib/types";

export default function NgoEventChatRoomPage() {
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
          <ArrowLeft className="h-4 w-4" /> Back to Operations
        </button>

        <span className="text-xs text-sky-400 font-mono flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> NGO Mission Command
        </span>
      </div>

      <ChatRoom
        title={`Operation: ${event ? event.title : `Event #${id}`}`}
        subtitle="Private field communication room for registered mission volunteers and NGO coordinators."
        fetchUrl={`/api/v1/chat/events/${id}`}
        sendUrl={`/api/v1/chat/events/${id}`}
        pinUrlGenerator={(messageId) => `/api/v1/chat/events/${id}/${messageId}/pin`}
        canPin={true}
        currentUserRole="ROLE_NGO_ADMIN"
        emptyNotice="No messages in this mission room yet. Broadcast deployment instructions or coordinates to your volunteers."
      />
    </div>
  );
}

