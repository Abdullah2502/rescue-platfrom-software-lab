package com.shazan.Nexora.dto.telemetry;

public record PublicStatsResponse(
        long activeEvents,
        long deployedPersonnel,
        String avgResponseTime,
        long totalVolunteers
) {}

