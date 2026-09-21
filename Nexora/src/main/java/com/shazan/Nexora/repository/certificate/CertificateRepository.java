package com.shazan.Nexora.repository.certificate;

import com.shazan.Nexora.domain.certificate.Certificate;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    boolean existsByEventAndVolunteer(DisasterEvent event, Volunteer volunteer);
    long countByEvent(DisasterEvent event);
    long countByVolunteer(Volunteer volunteer);
    List<Certificate> findAllByVolunteerOrderByIssuedAtDesc(Volunteer volunteer);
    List<Certificate> findAllByOrderByIssuedAtDesc();

    @Modifying
    @Query("DELETE FROM Certificate c WHERE c.event.ngo = :ngo")
    int deleteByEventNgo(@Param("ngo") Ngo ngo);
}
