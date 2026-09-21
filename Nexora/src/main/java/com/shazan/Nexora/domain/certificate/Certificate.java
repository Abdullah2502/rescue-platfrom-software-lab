package com.shazan.Nexora.domain.certificate;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "certificates",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"event_id", "volunteer_id"}),
                @UniqueConstraint(columnNames = "certificate_number")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_number", nullable = false, length = 80)
    private String certificateNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private DisasterEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "volunteer_id", nullable = false)
    private Volunteer volunteer;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "issued_by_actor_id", nullable = false)
    private Long issuedByActorId;
}
