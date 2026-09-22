"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HeartHandshake, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Button } from "@/components/ui/button";
import type { DisasterEventResponse } from "@/lib/types";

export default function VolunteerEventChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<DisasterEventResponse | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    api<DisasterEventResponse>(`/api/v1/events/${id}`)
      .then((data) => {
        setEvent(data);
        if (!data.joinedByCurrentVolunteer) {
          setAccessDenied(true);
        }
      })
      .catch((err) => {
        if (err.status === 403 || err.message?.includes("join")) {
          setAccessDenied(true);
        }
      });
  }, [id]);

  if (accessDenied) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-surface border border-red-500/30 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-display font-bold text-ink text-xl">Mission Chat Access Restricted</h2>
        <p className="text-sm text-mist leading-relaxed">
          This operation channel is private to volunteers who have officially joined this disaster response event and the organizing NGO.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
          <Link href={`/volunteer/events/${id}`}>
            <Button variant="primary">View Event Details & Join</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Channels
        </button>

        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <HeartHandshake className="h-3.5 w-3.5" /> Field Volunteer Channel
        </span>
      </div>

      <ChatRoom
        title={`Operation: ${event ? event.title : `Event #${id}`}`}
        subtitle={`Organized by ${event?.organizerName || "Partner NGO"} · Real-time operational field channel`}
        fetchUrl={`/api/v1/chat/events/${id}`}
        sendUrl={`/api/v1/chat/events/${id}`}
        canPin={false}
        currentUserRole="ROLE_VOLUNTEER"
        emptyNotice="No messages in this mission room yet. Greet the team or ask for ground updates!"
      />
    </div>
  );
}

