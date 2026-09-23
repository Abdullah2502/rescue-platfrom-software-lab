package com.shazan.Nexora.repository.event;

import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DisasterEventRepository extends JpaRepository<DisasterEvent, Long> {
    Page<DisasterEvent> findAllByNgo(Ngo ngo, Pageable pageable);
    Page<DisasterEvent> findAllByNgoAndStatus(Ngo ngo, EventStatus status, Pageable pageable);
    Page<DisasterEvent> findAllByCreatedByVolunteer(Volunteer volunteer, Pageable pageable);
    Page<DisasterEvent> findAllByStatusIn(List<EventStatus> statuses, Pageable pageable);
    long countByCreatedByVolunteer(Volunteer volunteer);
    Page<DisasterEvent> findAll(Pageable pageable);
    List<DisasterEvent> findAllByStatus(EventStatus status);
    Page<DisasterEvent> findAllByStatus(EventStatus status, Pageable pageable);
    long countByNgo(Ngo ngo);
    long countByStatus(EventStatus status);
    long countByStatusIn(List<EventStatus> statuses);

    /**
     * Bulk-delete every event owned by an NGO. The {@code @Modifying}
     * query runs as a single DELETE statement, so we don't have to
     * materialize each row. The {@code event_divisions} / {@code event_districts}
     * / {@code event_thanas} join rows are removed automatically because
     * those tables have FKs with {@code ON DELETE CASCADE} on the event side.
     */
    @Query("SELECT e FROM DisasterEvent e JOIN e.divisions d WHERE d.id = :divId")
    List<DisasterEvent> findAllByDivisionId(@Param("divId") Long divisionId);

    @Query("SELECT COUNT(e) FROM DisasterEvent e JOIN e.divisions d WHERE d.id = :divId AND e.status IN :statuses")
    long countByDivisionIdAndStatusIn(@Param("divId") Long divisionId, @Param("statuses") List<EventStatus> statuses);

    @Modifying
    @Query("DELETE FROM DisasterEvent e WHERE e.ngo = :ngo")
    int deleteByNgo(@Param("ngo") Ngo ngo);
}
