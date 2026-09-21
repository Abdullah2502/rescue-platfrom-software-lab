package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.ShelterStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record ShelterResponse(
        Long id,
        Long ngoId,
        String ngoName,
        String name,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer capacity,
        Integer currentOccupancy,
        String contactName,
        String contactPhone,
        ShelterStatus status,
        String notes,
        Instant updatedAt
) {}
