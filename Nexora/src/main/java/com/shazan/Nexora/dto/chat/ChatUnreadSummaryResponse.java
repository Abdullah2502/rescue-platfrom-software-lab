package com.shazan.Nexora.dto.chat;

import java.time.Instant;
import java.util.List;

public record ChatUnreadSummaryResponse(
        long globalUnreadCount,
        String latestGlobalMessage,
        String latestGlobalSenderName,
        Instant latestGlobalAt,
        long eventUnreadCount,
        long totalUnreadCount,
        List<UnreadEventSummary> unreadEvents
) {
    public record UnreadEventSummary(
            Long eventId,
            String eventTitle,
            long unreadCount,
            String lastMessage,
            String lastSenderName,
            Instant lastMessageAt
    ) {}
}

