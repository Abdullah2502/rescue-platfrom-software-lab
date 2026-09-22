package com.shazan.Nexora.dto.chat;

import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.EventType;
import com.shazan.Nexora.domain.enums.Severity;

import java.time.Instant;

public record ChatEventSummaryResponse(
        Long eventId,
        String title,
        EventType type,
        Severity severity,
        EventStatus status,
        String organizerName,
        String organizerType,
        Long participantCount,
        long messageCount,
        Instant startAt,
        Instant endAt
) {}

