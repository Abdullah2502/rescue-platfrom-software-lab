package com.shazan.Nexora.dto.certificate;

public record CertificateGenerationResponse(
        Long eventId,
        String eventTitle,
        int generated,
        int alreadyIssued,
        int participantCount
) {}
