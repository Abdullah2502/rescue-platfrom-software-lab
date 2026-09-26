package com.shazan.Nexora.dto.auth;

import jakarta.validation.constraints.*;

public record RegisterNgoRequest(
        @NotBlank(message = "NGO name is required") @Size(max = 150) String name,
        @NotBlank(message = "Email is required") @Email(message = "Invalid email address") @Size(max = 150) String email,
        @NotBlank(message = "Password is required") @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String password,
        @NotBlank(message = "Registration number is required") @Size(max = 100) String registrationNo,
        @NotBlank(message = "Phone number is required") @Pattern(regexp = "^(\\+880|0)1[3-9]\\d{8}$", message = "Phone must be a valid Bangladesh mobile number (e.g. 01712345678 or +8801712345678)") String phone,
        String website,
        String logoUrl,
        @NotBlank(message = "Registration certificate is required") String registrationCertificateUrl,
        @NotNull(message = "Division is required") Long divisionId,
        @NotNull(message = "District is required") Long districtId,
        @NotNull(message = "Thana is required") Long thanaId) {
}
