package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.DistributionStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record DistributionResponse(
        Long id,
        Long ngoId,
        String ngoName,
        Long shelterId,
        String shelterName,
        Long inventoryItemId,
        String inventoryItemName,
        String unit,
        String recipientGroup,
        BigDecimal quantity,
        Instant distributedAt,
        String locationDescription,
        BigDecimal latitude,
        BigDecimal longitude,
        DistributionStatus status,
        String notes,
        Instant createdAt
) {}
