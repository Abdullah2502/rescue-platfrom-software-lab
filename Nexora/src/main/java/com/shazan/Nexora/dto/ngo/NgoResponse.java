package com.shazan.Nexora.dto.ngo;

import com.shazan.Nexora.domain.enums.NgoStatus;
import com.shazan.Nexora.dto.location.LocationDto;

import java.time.Instant;

public record NgoResponse(
                Long id,
                String name,
                String email,
                String registrationNo,
                String logoUrl,
                String registrationCertificateUrl,
                String phone,
                String website,
                LocationDto division,
                LocationDto district,
                LocationDto thana,
                NgoStatus status,
                String rejectionReason,
                Instant approvedAt,
                Instant createdAt) {
}
