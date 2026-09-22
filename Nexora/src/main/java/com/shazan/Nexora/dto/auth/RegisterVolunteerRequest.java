package com.shazan.Nexora.dto.auth;

import com.shazan.Nexora.domain.enums.Gender;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record RegisterVolunteerRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(regexp = "^(\\+880|0)1[3-9]\\d{8}$", message = "Invalid Bangladesh phone") String phone,
        String nid,
        LocalDate dateOfBirth,
        @NotNull Gender gender,
        Long divisionId,
        Long districtId,
        Long thanaId,
        String skills,
        String profession,
        List<String> certificateDocuments
) {}
