"use client";

import { ChatRoom } from "@/components/chat/ChatRoom";
import { PageHeader } from "@/components/ui/page";

export default function VolunteerGlobalChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Platform Community Chat"
        description="Connect with volunteers, NGOs, and platform leadership across Bangladesh in real time."
      />

      <ChatRoom
        title="Nexora Global Community Stream"
        subtitle="Open forum for national announcements, cross-agency coordination, and volunteer networking."
        fetchUrl="/api/v1/chat/global"
        sendUrl="/api/v1/chat/global"
        canPin={false}
        currentUserRole="ROLE_VOLUNTEER"
        emptyNotice="The global stream is empty. Share an update or ask a question to get started!"
      />
    </div>
  );
}

