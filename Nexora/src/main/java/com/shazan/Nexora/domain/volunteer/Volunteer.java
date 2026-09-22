package com.shazan.Nexora.domain.volunteer;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.Gender;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "volunteers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Volunteer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash; // null until volunteer sets a password (added by NGO)

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 30)
    private String nid;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "division_id")
    private Division division;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thana_id")
    private Thana thana;

    @Column(length = 100)
    private String profession;

    @ElementCollection
    @CollectionTable(name = "volunteer_skills",
            joinColumns = @JoinColumn(name = "volunteer_id"))
    @Column(name = "skill", length = 60)
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "volunteer_certificate_documents",
            joinColumns = @JoinColumn(name = "volunteer_id"))
    @Column(name = "document_url", length = 1000)
    @Builder.Default
    private List<String> certificateDocuments = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VolunteerStatus status;

    @Column(name = "must_set_password", nullable = false)
    @Builder.Default
    private boolean mustSetPassword = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruited_by_ngo_id")
    private com.shazan.Nexora.domain.ngo.Ngo recruitedByNgo;

    @PrePersist
    private void prePersist() {
        if (status == null) {
            // Volunteers added directly by an NGO start ACTIVE — they've been
            // vetted by a trusted org. Self-registered volunteers must wait
            // for Super Admin approval, so AuthService.registerVolunteer
            // explicitly sets PENDING_VERIFICATION before save.
            status = (recruitedByNgo != null) ? VolunteerStatus.ACTIVE : VolunteerStatus.PENDING_VERIFICATION;
        }
    }
}
