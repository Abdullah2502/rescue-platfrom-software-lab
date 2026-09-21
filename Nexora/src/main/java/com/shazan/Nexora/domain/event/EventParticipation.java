package com.shazan.Nexora.domain.event;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_participations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "volunteer_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private DisasterEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "volunteer_id", nullable = false)
    private Volunteer volunteer;
}
