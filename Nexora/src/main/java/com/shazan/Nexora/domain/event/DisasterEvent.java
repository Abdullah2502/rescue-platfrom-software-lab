package com.shazan.Nexora.domain.event;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.EventType;
import com.shazan.Nexora.domain.enums.Severity;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.admin.SuperAdmin;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "disaster_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisasterEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ngo_id")
    private Ngo ngo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_volunteer_id")
    private Volunteer createdByVolunteer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id")
    private SuperAdmin createdByAdmin;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany
    @JoinTable(
            name = "event_divisions",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "division_id"))
    @Builder.Default
    private Set<Division> divisions = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "event_districts",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "district_id"))
    @Builder.Default
    private Set<District> districts = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "event_thanas",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "thana_id"))
    @Builder.Default
    private Set<Thana> thanas = new HashSet<>();

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(name = "required_volunteers", nullable = false)
    private Integer requiredVolunteers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    @PrePersist
    private void prePersist() {
        if (status == null) status = EventStatus.OPEN;
    }
}
