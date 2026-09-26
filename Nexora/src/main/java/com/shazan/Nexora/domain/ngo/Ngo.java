package com.shazan.Nexora.domain.ngo;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.NgoStatus;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "ngos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ngo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "registration_no", nullable = false, unique = true, length = 100)
    private String registrationNo;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "registration_certificate_url", length = 1000)
    private String registrationCertificateUrl;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 200)
    private String website;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "division_id", nullable = false)
    private Division division;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thana_id")
    private Thana thana;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NgoStatus status;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    @PrePersist
    private void prePersist() {
        if (status == null)
            status = NgoStatus.PENDING;
    }
}
