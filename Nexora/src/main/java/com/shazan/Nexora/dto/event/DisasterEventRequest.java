package com.shazan.Nexora.dto.event;

import com.shazan.Nexora.domain.enums.EventType;
import com.shazan.Nexora.domain.enums.Severity;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public record DisasterEventRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull EventType type,
        @NotNull Severity severity,
        String description,
        @NotEmpty List<Long> divisionIds,
        List<Long> districtIds,
        List<Long> thanaIds,
        @NotNull Instant startAt,
        @NotNull Instant endAt,
        @NotNull @Min(1) Integer requiredVolunteers,
        @NotNull Long ngoId
) {}
