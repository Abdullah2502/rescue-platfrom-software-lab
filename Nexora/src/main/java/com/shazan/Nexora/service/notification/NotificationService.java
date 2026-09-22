package com.shazan.Nexora.service.notification;

import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import com.shazan.Nexora.domain.notification.Notification;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.notification.NotificationResponse;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.notification.NotificationRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final VolunteerRepository volunteerRepository;
    private final EventParticipationRepository participationRepository;

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        return emitter;
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(int page, int size) {
        Long userId = CurrentUser.require().id();
        return PageResponse.from(notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)).map(this::toResponse));
    }

    @Transactional
    public void markAsRead(Long id) {
        Long userId = CurrentUser.require().id();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("NOTIF_NOT_FOUND", "Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw ApiException.unauthorized("UNAUTHORIZED", "Not your notification");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead() {
        Long userId = CurrentUser.require().id();
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private void createAndSend(Long userId, String title, String message) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        notification = notificationRepository.save(notification);

        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(toResponse(notification)));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }

    @Transactional
    public void notifyEventCreated(DisasterEvent event) {
        if (event.getStatus() != EventStatus.OPEN) {
            return;
        }
        Set<Long> eventThanaIds = event.getThanas().stream().map(Thana::getId).collect(Collectors.toSet());
        Set<Long> eventDistrictIds = event.getDistricts().stream().map(District::getId).collect(Collectors.toSet());
        Set<Long> eventDivisionIds = event.getDivisions().stream().map(Division::getId).collect(Collectors.toSet());

        List<Volunteer> allVolunteers = volunteerRepository.findAll();
        for (Volunteer volunteer : allVolunteers) {
            boolean inArea = false;
            if (volunteer.getThana() != null && eventThanaIds.contains(volunteer.getThana().getId())) {
                inArea = true;
            } else if (volunteer.getDistrict() != null && eventDistrictIds.contains(volunteer.getDistrict().getId())) {
                inArea = true;
            } else if (volunteer.getDivision() != null && eventDivisionIds.contains(volunteer.getDivision().getId())) {
                inArea = true;
            }

            if (inArea) {
                String title = "New Emergency Event";
                String message = event.getTitle() + " - " + event.getSeverity() + " emergency in your area.";
                createAndSend(volunteer.getId(), title, message);
            }
        }
    }

    @Transactional
    public void notifyEventClosed(DisasterEvent event) {
        participationRepository.findAllByEvent(event).forEach(p -> {
            String title = "Event Closed";
            String message = "The event '" + event.getTitle() + "' you participated in has been closed.";
            createAndSend(p.getVolunteer().getId(), title, message);
        });
    }
}
