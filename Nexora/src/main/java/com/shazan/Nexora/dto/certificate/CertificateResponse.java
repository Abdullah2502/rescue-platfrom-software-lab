package com.shazan.Nexora.dto.certificate;

import com.shazan.Nexora.domain.enums.EventType;

import java.time.Instant;

public record CertificateResponse(
        Long id,
        String certificateNumber,
        Long eventId,
        String eventTitle,
        EventType eventType,
        Long volunteerId,
        String volunteerName,
        String organizerName,
        Instant eventStartAt,
        Instant eventEndAt,
        Instant issuedAt
) {}
