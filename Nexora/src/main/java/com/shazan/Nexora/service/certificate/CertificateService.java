package com.shazan.Nexora.service.certificate;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.certificate.Certificate;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.certificate.CertificateGenerationResponse;
import com.shazan.Nexora.dto.certificate.CertificateResponse;
import com.shazan.Nexora.repository.certificate.CertificateRepository;
import com.shazan.Nexora.repository.event.DisasterEventRepository;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EventParticipationRepository participationRepository;
    private final DisasterEventRepository eventRepository;
    private final VolunteerRepository volunteerRepository;

    @Transactional
    public CertificateGenerationResponse generateForEvent(Long eventId) {
        DisasterEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("EVENT_NOT_FOUND", "Event not found"));
        var participants = participationRepository.findAllByEvent(event);
        int generated = 0;
        int skipped = 0;
        Instant now = Instant.now();
        Long adminId = CurrentUser.require().id();
        int year = event.getEndAt().atZone(ZoneOffset.UTC).getYear();

        for (var participation : participants) {
            Volunteer volunteer = participation.getVolunteer();
            if (certificateRepository.existsByEventAndVolunteer(event, volunteer)) {
                skipped++;
                continue;
            }
            String number = "NXR-%d-%06d-%06d".formatted(year, event.getId(), volunteer.getId());
            certificateRepository.save(Certificate.builder()
                    .certificateNumber(number)
                    .event(event)
                    .volunteer(volunteer)
                    .issuedAt(now)
                    .issuedByActorId(adminId)
                    .build());
            generated++;
        }
        return new CertificateGenerationResponse(
                event.getId(), event.getTitle(), generated, skipped, participants.size());
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listAll() {
        return certificateRepository.findAllByOrderByIssuedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listForCurrentVolunteer() {
        Volunteer volunteer = volunteerRepository.findById(CurrentUser.require().id())
                .orElseThrow(() -> ApiException.notFound("VOLUNTEER_NOT_FOUND", "Volunteer not found"));
        return certificateRepository.findAllByVolunteerOrderByIssuedAtDesc(volunteer)
                .stream().map(this::toResponse).toList();
    }

    private CertificateResponse toResponse(Certificate certificate) {
        DisasterEvent event = certificate.getEvent();
        String organizer = event.getNgo() != null ? event.getNgo().getName()
                : event.getCreatedByVolunteer() != null ? event.getCreatedByVolunteer().getName()
                : event.getCreatedByAdmin() != null ? event.getCreatedByAdmin().getName()
                : "Nexora";
        return new CertificateResponse(
                certificate.getId(), certificate.getCertificateNumber(),
                event.getId(), event.getTitle(), event.getType(),
                certificate.getVolunteer().getId(), certificate.getVolunteer().getName(),
                organizer, event.getStartAt(), event.getEndAt(), certificate.getIssuedAt());
    }
}
