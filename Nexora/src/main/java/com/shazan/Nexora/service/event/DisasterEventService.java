package com.shazan.Nexora.service.event;

import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.admin.SuperAdmin;
import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.event.EventParticipation;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Thana;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.event.DisasterEventRequest;
import com.shazan.Nexora.dto.event.DisasterEventResponse;
import com.shazan.Nexora.dto.location.LocationDto;
import com.shazan.Nexora.repository.admin.SuperAdminRepository;
import com.shazan.Nexora.repository.event.DisasterEventRepository;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.location.DistrictRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.location.ThanaRepository;
import com.shazan.Nexora.repository.ngo.NgoRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.CurrentUser;
import com.shazan.Nexora.service.ngo.NgoService;
import com.shazan.Nexora.service.certificate.CertificateService;
import com.shazan.Nexora.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DisasterEventService {

    private final DisasterEventRepository eventRepository;
    private final EventParticipationRepository participationRepository;
    private final VolunteerRepository volunteerRepository;
    private final SuperAdminRepository adminRepository;
    private final DivisionRepository divisionRepository;
    private final DistrictRepository districtRepository;
    private final ThanaRepository thanaRepository;
    private final NgoRepository ngoRepository;
    private final NgoService ngoService;
    private final CertificateService certificateService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<DisasterEventResponse> listForCurrentNgo(int page, int size) {
        Ngo ngo = ngoService.currentNgo();
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.from(eventRepository.findAllByNgo(ngo, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<DisasterEventResponse> listForVolunteers(int page, int size) {
        requireVolunteer();
        var pageable = PageRequest.of(page, size, Sort.by("startAt").ascending());
        return PageResponse.from(eventRepository.findAllByStatusIn(
                List.of(EventStatus.OPEN, EventStatus.ONGOING, EventStatus.CLOSED), pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public DisasterEventResponse get(Long id) {
        return toResponse(loadEvent(id));
    }

    @Transactional
    public DisasterEventResponse createForNgo(DisasterEventRequest req) {
        Ngo currentNgo = ngoService.currentNgo();
        if (currentNgo == null) {
            throw ApiException.unauthorized("UNAUTHORIZED", "Valid NGO session required to create an event.");
        }

        // Pass the NGO directly into the builder to guarantee the relation is set
        DisasterEvent event = buildEvent(req, currentNgo, null, null);
        event = eventRepository.save(event);
        notificationService.notifyEventCreated(event);
        return toResponse(event);
    }

    @Transactional
    public DisasterEventResponse createForAdmin(DisasterEventRequest req) {
        var current = CurrentUser.require();
        SuperAdmin admin = adminRepository.findById(current.id())
                .orElseThrow(() -> ApiException.notFound("ADMIN_NOT_FOUND", "Administrator not found"));

        if (req.ngoId() == null) {
            throw ApiException.badRequest("MISSING_NGO",
                    "Admins must explicitly select an NGO when creating an event.");
        }

        Ngo assignedNgo = ngoRepository.findById(req.ngoId())
                .orElseThrow(() -> ApiException.notFound("NGO_NOT_FOUND", "Assigned NGO not found"));

        DisasterEvent event = buildEvent(req, assignedNgo, admin, null);
        event = eventRepository.save(event);
        notificationService.notifyEventCreated(event);
        return toResponse(event);
    }

    @Transactional
    public DisasterEventResponse createForVolunteer(DisasterEventRequest req) {
        Volunteer volunteer = requireVolunteer();
        DisasterEvent event = buildEvent(req, null, null, volunteer);
        event = eventRepository.save(event);
        notificationService.notifyEventCreated(event);
        return toResponse(event);
    }

    @Transactional
    public DisasterEventResponse join(Long eventId) {
        Volunteer volunteer = requireVolunteer();
        DisasterEvent event = loadEvent(eventId);
        if (event.getStatus() != EventStatus.OPEN && event.getStatus() != EventStatus.ONGOING) {
            throw ApiException.conflict("EVENT_NOT_JOINABLE", "Only open or ongoing events can be joined");
        }
        if (participationRepository.existsOverlappingParticipation(volunteer.getId(), event.getStartAt(),
                event.getEndAt())) {
            throw ApiException.conflict("OVERLAPPING_EVENT",
                    "You are already participating in another event during this time");
        }
        if (!participationRepository.existsByEventAndVolunteer(event, volunteer)) {
            participationRepository.save(EventParticipation.builder().event(event).volunteer(volunteer).build());
            participationRepository.flush();
        }
        return toResponse(event);
    }

    @Transactional
    public DisasterEventResponse withdraw(Long eventId) {
        Volunteer volunteer = requireVolunteer();
        DisasterEvent event = loadEvent(eventId);
        participationRepository.findByEventAndVolunteer(event, volunteer)
                .ifPresent(participationRepository::delete);
        participationRepository.flush();
        return toResponse(event);
    }

    @Transactional
    public DisasterEventResponse changeStatus(Long eventId, EventStatus newStatus) {
        var current = CurrentUser.require();
        DisasterEvent event = loadEvent(eventId);
        boolean allowed = Role.ROLE_SUPER_ADMIN.name().equals(current.role())
                || (Role.ROLE_NGO_ADMIN.name().equals(current.role())
                        && event.getNgo() != null && event.getNgo().getId().equals(current.ngoId()))
                || (Role.ROLE_VOLUNTEER.name().equals(current.role())
                        && event.getCreatedByVolunteer() != null
                        && event.getCreatedByVolunteer().getId().equals(current.id()));
        if (!allowed) {
            throw ApiException.forbidden("NOT_EVENT_OWNER", "Only the event creator or a super admin can update it");
        }
        event.setStatus(newStatus);
        eventRepository.save(event);
        if (newStatus == EventStatus.CLOSED) {
            certificateService.generateForEvent(eventId);
            notificationService.notifyEventClosed(event);
        }
        return toResponse(event);
    }

    // Notice the updated method signature that accepts the entities directly
    private DisasterEvent buildEvent(DisasterEventRequest req, Ngo ngo, SuperAdmin admin, Volunteer volunteer) {
        if (!req.endAt().isAfter(req.startAt())) {
            throw ApiException.badRequest("BAD_DATES", "The event end time must be after its start time");
        }
        DisasterEvent event = DisasterEvent.builder()
                .title(req.title().trim())
                .type(req.type())
                .severity(req.severity())
                .description(req.description())
                .startAt(req.startAt())
                .endAt(req.endAt())
                .requiredVolunteers(req.requiredVolunteers())
                .status(EventStatus.OPEN)
                .divisions(new HashSet<>(divisionRepository.findAllById(req.divisionIds())))
                .districts(new HashSet<>(req.districtIds() == null ? List.<District>of()
                        : districtRepository.findAllById(req.districtIds())))
                .thanas(new HashSet<>(req.thanaIds() == null ? List.<Thana>of()
                        : thanaRepository.findAllById(req.thanaIds())))
                // Crucial fix: Inject relations natively through the builder
                .ngo(ngo)
                .createdByAdmin(admin)
                .createdByVolunteer(volunteer)
                .build();

        if (event.getDivisions().isEmpty()) {
            throw ApiException.badRequest("NO_LOCATION", "At least one division is required");
        }
        return event;
    }

    private Volunteer requireVolunteer() {
        var current = CurrentUser.require();
        if (!Role.ROLE_VOLUNTEER.name().equals(current.role())) {
            throw ApiException.forbidden("NOT_VOLUNTEER", "Volunteer role required");
        }
        Volunteer volunteer = volunteerRepository.findById(current.id())
                .orElseThrow(() -> ApiException.notFound("VOLUNTEER_NOT_FOUND", "Volunteer not found"));
        if (volunteer.getStatus() != VolunteerStatus.ACTIVE) {
            throw ApiException.forbidden("VOLUNTEER_INACTIVE", "Your volunteer account must be active");
        }
        return volunteer;
    }

    private DisasterEvent loadEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("EVENT_NOT_FOUND", "Event not found"));
    }

    private DisasterEventResponse toResponse(DisasterEvent event) {
        Long organizerId;
        String organizerName;
        String organizerType;
        String organizerEmail = null;
        String organizerPhone = null;
        String organizerWebsite = null;
        if (event.getNgo() != null) {
            organizerId = event.getNgo().getId();
            organizerName = event.getNgo().getName();
            organizerType = "NGO";
            organizerEmail = event.getNgo().getEmail();
            organizerPhone = event.getNgo().getPhone();
            organizerWebsite = event.getNgo().getWebsite();
        } else if (event.getCreatedByVolunteer() != null) {
            organizerId = event.getCreatedByVolunteer().getId();
            organizerName = event.getCreatedByVolunteer().getName();
            organizerType = "VOLUNTEER";
            organizerPhone = event.getCreatedByVolunteer().getPhone();
        } else if (event.getCreatedByAdmin() != null) {
            organizerId = event.getCreatedByAdmin().getId();
            organizerName = event.getCreatedByAdmin().getName();
            organizerType = "ADMIN";
        } else {
            organizerId = null;
            organizerName = "Nexora";
            organizerType = "PLATFORM";
        }

        boolean joined = false;
        var current = CurrentUser.require();
        if (Role.ROLE_VOLUNTEER.name().equals(current.role())) {
            Volunteer volunteer = volunteerRepository.findById(current.id()).orElse(null);
            joined = volunteer != null && participationRepository.existsByEventAndVolunteer(event, volunteer);
        }

        return new DisasterEventResponse(
                event.getId(), event.getTitle(), event.getType(), event.getSeverity(), event.getDescription(),
                event.getDivisions().stream().map(d -> new LocationDto(d.getId(), d.getName(), d.getBnName(), null))
                        .toList(),
                event.getDistricts().stream()
                        .map(d -> new LocationDto(d.getId(), d.getName(), d.getBnName(), d.getDivision().getId()))
                        .toList(),
                event.getThanas().stream()
                        .map(t -> new LocationDto(t.getId(), t.getName(), t.getBnName(), t.getDistrict().getId()))
                        .toList(),
                event.getStartAt(), event.getEndAt(), event.getRequiredVolunteers(), event.getStatus(),
                organizerId, organizerName, organizerType, organizerEmail, organizerPhone, organizerWebsite,
                participationRepository.countByEvent(event), joined, event.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public PageResponse<DisasterEventResponse> listPublicActiveEvents(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.from(eventRepository.findAllByStatusIn(
                List.of(EventStatus.OPEN, EventStatus.ONGOING), pageable).map(this::toPublicResponse));
    }

    private DisasterEventResponse toPublicResponse(DisasterEvent event) {
        String organizerName = "Nexora Platform";
        if (event.getNgo() != null) {
            organizerName = event.getNgo().getName();
        } else if (event.getCreatedByAdmin() != null) {
            organizerName = event.getCreatedByAdmin().getName();
        }

        return new DisasterEventResponse(
                event.getId(), event.getTitle(), event.getType(), event.getSeverity(), event.getDescription(),
                List.of(), List.of(), List.of(),
                event.getStartAt(), event.getEndAt(), event.getRequiredVolunteers(), event.getStatus(),
                null, organizerName, "PUBLIC", null, null, null,
                participationRepository.countByEvent(event), false, event.getCreatedAt());
    }
}