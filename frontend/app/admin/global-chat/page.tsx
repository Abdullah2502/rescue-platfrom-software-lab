"use client";

import { Globe } from "lucide-react";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { PageHeader } from "@/components/ui/page";

export default function AdminGlobalChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Platform Community Chat"
        description="Public communications channel open to all verified volunteers, partner NGOs, and administrators. As Super Admin, you can pin important notices to the top banner."
      />

      <ChatRoom
        title="Nexora Global Community Stream"
        subtitle="Open forum for national announcements, cross-agency coordination, and volunteer networking."
        fetchUrl="/api/v1/chat/global"
        sendUrl="/api/v1/chat/global"
        pinUrlGenerator={(id) => `/api/v1/chat/global/${id}/pin`}
        canPin={true}
        currentUserRole="ROLE_SUPER_ADMIN"
        emptyNotice="The global stream is empty. Post a platform-wide message to start!"
      />
    </div>
  );
}

