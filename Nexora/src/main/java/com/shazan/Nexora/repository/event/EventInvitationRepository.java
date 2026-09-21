package com.shazan.Nexora.repository.event;

import com.shazan.Nexora.domain.enums.InvitationStatus;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.event.EventInvitation;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventInvitationRepository extends JpaRepository<EventInvitation, Long> {
    List<EventInvitation> findAllByVolunteer(Volunteer volunteer);
    List<EventInvitation> findAllByEvent(DisasterEvent event);
    Optional<EventInvitation> findByEventAndVolunteer(DisasterEvent event, Volunteer volunteer);
    boolean existsByEventAndVolunteer(DisasterEvent event, Volunteer volunteer);
    long countByEventAndStatus(DisasterEvent event, InvitationStatus status);

    /** Used by the super-admin "delete volunteer" guard. */
    long countByVolunteer(Volunteer volunteer);

    /** Used by the super-admin "delete NGO" guard. */
    long countByNgo(Ngo ngo);

    /**
     * Bulk-delete invitations by NGO. Called from the super-admin delete flow
     * after the dependent-events check has passed. We delete at the DB level
     * so we don't have to materialize every row into the persistence context.
     */
    @Modifying
    @Query("DELETE FROM EventInvitation i WHERE i.ngo = :ngo")
    int deleteByNgo(@Param("ngo") Ngo ngo);
}
