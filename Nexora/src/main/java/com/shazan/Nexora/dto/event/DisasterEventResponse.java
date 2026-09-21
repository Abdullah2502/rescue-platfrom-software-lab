package com.shazan.Nexora.dto.event;

import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.EventType;
import com.shazan.Nexora.domain.enums.Severity;
import com.shazan.Nexora.dto.location.LocationDto;

import java.time.Instant;
import java.util.List;

public record DisasterEventResponse(
        Long id,
        String title,
        EventType type,
        Severity severity,
        String description,
        List<LocationDto> divisions,
        List<LocationDto> districts,
        List<LocationDto> thanas,
        Instant startAt,
        Instant endAt,
        Integer requiredVolunteers,
        EventStatus status,
        Long organizerId,
        String organizerName,
        String organizerType,
        Long participantCount,
        boolean joinedByCurrentVolunteer,
        Instant createdAt
) {}
