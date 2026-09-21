package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.InventoryCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryItemRequest(
        Long shelterId,
        @NotBlank @Size(max = 160) String name,
        @NotNull InventoryCategory category,
        @NotNull @DecimalMin("0.0") BigDecimal quantity,
        @NotBlank @Size(max = 40) String unit,
        @NotNull @DecimalMin("0.0") BigDecimal reorderLevel,
        LocalDate expiryDate,
        @Size(max = 1000) String notes,
        @Size(max = 80) String clientReference
) {}
