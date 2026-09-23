package com.shazan.Nexora.repository.event;

import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.event.EventParticipation;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventParticipationRepository extends JpaRepository<EventParticipation, Long> {
    Optional<EventParticipation> findByEventAndVolunteer(DisasterEvent event, Volunteer volunteer);

    boolean existsByEventAndVolunteer(DisasterEvent event, Volunteer volunteer);

    long countByEvent(DisasterEvent event);

    long countByVolunteer(Volunteer volunteer);

    List<EventParticipation> findAllByEvent(DisasterEvent event);

    List<EventParticipation> findAllByVolunteerOrderByCreatedAtDesc(Volunteer volunteer);

    @Modifying
    @Query("DELETE FROM EventParticipation p WHERE p.event.ngo = :ngo")
    int deleteByEventNgo(@Param("ngo") Ngo ngo);

    @Query("SELECT COUNT(p) > 0 FROM EventParticipation p WHERE p.volunteer.id = :volunteerId AND p.event.startAt < :endAt AND p.event.endAt > :startAt AND p.event.status NOT IN (com.shazan.Nexora.domain.enums.EventStatus.CLOSED, com.shazan.Nexora.domain.enums.EventStatus.CANCELLED)")
    boolean existsOverlappingParticipation(@Param("volunteerId") Long volunteerId,
            @Param("startAt") java.time.Instant startAt, @Param("endAt") java.time.Instant endAt);

    @Query("SELECT COUNT(DISTINCT p.volunteer.id) FROM EventParticipation p JOIN p.event e JOIN e.divisions d WHERE d.id = :divId AND e.status IN (com.shazan.Nexora.domain.enums.EventStatus.OPEN, com.shazan.Nexora.domain.enums.EventStatus.ONGOING)")
    long countActiveDeployedInDivision(@Param("divId") Long divisionId);
}
