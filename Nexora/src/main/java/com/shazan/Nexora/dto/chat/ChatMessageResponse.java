package com.shazan.Nexora.dto.chat;

import com.shazan.Nexora.domain.enums.Role;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        Long eventId,
        String eventTitle,
        Long senderId,
        Role senderRole,
        String senderName,
        String senderEmail,
        String message,
        boolean pinned,
        String pinnedBy,
        Instant pinnedAt,
        Instant createdAt
) {}

