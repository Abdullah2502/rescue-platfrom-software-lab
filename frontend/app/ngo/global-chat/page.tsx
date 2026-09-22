"use client";

import { ChatRoom } from "@/components/chat/ChatRoom";
import { PageHeader } from "@/components/ui/page";

export default function NgoGlobalChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Platform Community Chat"
        description="Public communications channel open to all verified volunteers, partner NGOs, and administrators."
      />

      <ChatRoom
        title="Nexora Global Community Stream"
        subtitle="Open forum for national announcements, cross-agency coordination, and volunteer networking."
        fetchUrl="/api/v1/chat/global"
        sendUrl="/api/v1/chat/global"
        canPin={false}
        currentUserRole="ROLE_NGO_ADMIN"
        emptyNotice="The global stream is empty. Post a message to greet the community!"
      />
    </div>
  );
}

