package com.shazan.Nexora.dto.volunteer;

import com.shazan.Nexora.domain.enums.Gender;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.dto.location.LocationDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record VolunteerResponse(
        Long id,
        String name,
        String email,
        String phone,
        String nid,
        LocalDate dateOfBirth,
        Gender gender,
        LocationDto division,
        LocationDto district,
        LocationDto thana,
        List<String> skills,
        VolunteerStatus status,
        Instant createdAt,
        String profession,
        List<String> certificateDocuments
) {}
