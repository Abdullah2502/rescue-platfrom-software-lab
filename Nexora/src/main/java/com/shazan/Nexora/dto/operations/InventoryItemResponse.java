package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.InventoryCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InventoryItemResponse(
        Long id,
        Long ngoId,
        String ngoName,
        Long shelterId,
        String shelterName,
        String name,
        InventoryCategory category,
        BigDecimal quantity,
        String unit,
        BigDecimal reorderLevel,
        boolean lowStock,
        LocalDate expiryDate,
        String notes,
        Instant updatedAt
) {}
