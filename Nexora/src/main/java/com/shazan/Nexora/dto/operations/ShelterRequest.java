package com.shazan.Nexora.dto.operations;

import com.shazan.Nexora.domain.enums.ShelterStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ShelterRequest(
        @NotBlank @Size(max = 180) String name,
        @NotBlank @Size(max = 400) String address,
        @NotNull @DecimalMin("20.0") @DecimalMax("27.0") BigDecimal latitude,
        @NotNull @DecimalMin("88.0") @DecimalMax("93.0") BigDecimal longitude,
        @NotNull @Min(1) Integer capacity,
        @NotNull @Min(0) Integer currentOccupancy,
        @NotBlank @Size(max = 120) String contactName,
        @NotBlank @Size(max = 30) String contactPhone,
        @NotNull ShelterStatus status,
        @Size(max = 1000) String notes,
        @Size(max = 80) String clientReference
) {}
