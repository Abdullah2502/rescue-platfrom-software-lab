package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.DistributionStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record DistributionRequest(
        Long shelterId,
        @NotNull Long inventoryItemId,
        @NotBlank @Size(max = 180) String recipientGroup,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quantity,
        @NotNull Instant distributedAt,
        @NotBlank @Size(max = 300) String locationDescription,
        @DecimalMin("20.0") @DecimalMax("27.0") BigDecimal latitude,
        @DecimalMin("88.0") @DecimalMax("93.0") BigDecimal longitude,
        @NotNull DistributionStatus status,
        @Size(max = 1000) String notes,
        @Size(max = 80) String clientReference
) {}
