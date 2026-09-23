package com.shazan.Nexora.dto.forecast;

import com.shazan.Nexora.domain.enums.EventType;

public record DisasterTypeRisk(
        EventType eventType,
        String eventTypeName,
        double riskScore,               // 0.0 to 1.0
        String riskLevel,               // LOW, MODERATE, HIGH, CRITICAL
        int historicalEventCount,
        double avgSeverity,             // 1.0 to 4.0
        double seasonalMultiplier,       // e.g. 0.8 to 1.8
        double weatherMultiplier,        // live weather impact
        double volunteerGapRatio,        // deficit ratio
        int predictedVolunteersNeeded,
        String summaryReason
) {}

