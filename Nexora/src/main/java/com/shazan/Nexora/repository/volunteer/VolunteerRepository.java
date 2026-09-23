package com.shazan.Nexora.repository.volunteer;

import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
    Optional<Volunteer> findByEmail(String email);
    Optional<Volunteer> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    long countByStatus(VolunteerStatus status);

    /**
     * Filtered volunteer search. We split into two queries to avoid a
     * PostgreSQL bind-type issue: when `:q` is NULL, Hibernate's generated
     * SQL still tries to bind a parameter for the `lower(...)` predicate,
     * and the driver infers the type as `bytea`, which `lower()` does not
     * accept. Splitting on null keeps the parameter typed properly.
     */
    @Query("""
           SELECT v FROM Volunteer v
           WHERE (:divisionId IS NULL OR v.division.id = :divisionId)
             AND (:districtId IS NULL OR v.district.id = :districtId)
             AND (:thanaId IS NULL OR v.thana.id = :thanaId)
             AND (:status IS NULL OR v.status = :status)
           """)
    Page<Volunteer> search(@Param("divisionId") Long divisionId,
                           @Param("districtId") Long districtId,
                           @Param("thanaId") Long thanaId,
                           @Param("status") VolunteerStatus status,
                           Pageable pageable);

    @Query("""
           SELECT v FROM Volunteer v
           WHERE (:divisionId IS NULL OR v.division.id = :divisionId)
             AND (:districtId IS NULL OR v.district.id = :districtId)
             AND (:thanaId IS NULL OR v.thana.id = :thanaId)
             AND (:status IS NULL OR v.status = :status)
             AND (LOWER(v.name) LIKE LOWER(CONCAT('%', :q, '%'))
                  OR LOWER(v.email) LIKE LOWER(CONCAT('%', :q, '%')))
           """)
    Page<Volunteer> searchByText(@Param("divisionId") Long divisionId,
                                 @Param("districtId") Long districtId,
                                 @Param("thanaId") Long thanaId,
                                 @Param("status") VolunteerStatus status,
                                 @Param("q") String q,
                                 Pageable pageable);

    @Query("""
           SELECT DISTINCT v FROM Volunteer v
           LEFT JOIN v.skills s
           WHERE v.division.id IN :divisionIds
             AND v.status = com.shazan.Nexora.domain.enums.VolunteerStatus.ACTIVE
             AND LOWER(s) = LOWER(:skill)
           """)
    List<Volunteer> findRecommendedForDivisions(@Param("divisionIds") List<Long> divisionIds,
                                                @Param("skill") String skill);

    long countByDivisionIdAndStatus(Long divisionId, VolunteerStatus status);

    List<Volunteer> findAllByDivisionIdAndStatus(Long divisionId, VolunteerStatus status);

    /** Used by the super-admin "delete NGO" guard. */
    long countByRecruitedByNgo(Ngo ngo);

    /**
     * Unset {@code recruited_by_ngo_id} on every volunteer that was added by
     * this NGO. Called from the super-admin NGO delete flow after the NGO's
     * own events/invitations have been deleted, so the FK constraint doesn't
     * block the {@code ngos} row removal.
     */
    @Modifying
    @Query("UPDATE Volunteer v SET v.recruitedByNgo = NULL WHERE v.recruitedByNgo = :ngo")
    int clearRecruitedBy(@Param("ngo") Ngo ngo);
}
