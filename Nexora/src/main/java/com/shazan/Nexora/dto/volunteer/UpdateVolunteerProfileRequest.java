package com.shazan.Nexora.dto.volunteer;

import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.util.List;

public record UpdateVolunteerProfileRequest(
        @Pattern(regexp = "^(\\+880|0)1[3-9]\\d{8}$") String phone,
        String nid,
        LocalDate dateOfBirth,
        List<String> skills,
        Long divisionId,
        Long districtId,
        Long thanaId,
        String profession,
        List<String> certificateDocuments
) {}
