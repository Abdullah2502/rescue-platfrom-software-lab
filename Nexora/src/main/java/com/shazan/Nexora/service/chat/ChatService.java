package com.shazan.Nexora.service.chat;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.admin.SuperAdmin;
import com.shazan.Nexora.domain.chat.ChatMessage;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.chat.ChatEventSummaryResponse;
import com.shazan.Nexora.dto.chat.ChatMessageResponse;
import com.shazan.Nexora.dto.chat.SendMessageRequest;
import com.shazan.Nexora.repository.admin.SuperAdminRepository;
import com.shazan.Nexora.repository.chat.ChatMessageRepository;
import com.shazan.Nexora.repository.event.DisasterEventRepository;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.ngo.NgoRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.AuthenticatedUser;
import com.shazan.Nexora.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final DisasterEventRepository eventRepository;
    private final EventParticipationRepository participationRepository;
    private final SuperAdminRepository adminRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;

    /* -------------------------------------------------------------
     * GLOBAL CHAT METHODS
     * ------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listGlobalMessages() {
        CurrentUser.require(); // Must be authenticated
        return chatMessageRepository.findGlobalMessages().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendGlobalMessage(SendMessageRequest req) {
        var user = CurrentUser.require();
        SenderInfo sender = resolveSender(user);

        ChatMessage msg = ChatMessage.builder()
                .event(null)
                .senderId(user.id())
                .senderRole(sender.role())
                .senderName(sender.name())
                .senderEmail(user.email())
                .message(req.message().trim())
                .pinned(false)
                .build();

        msg = chatMessageRepository.save(msg);
        return toResponse(msg);
    }

    @Transactional
    public ChatMessageResponse togglePinGlobalMessage(Long messageId) {
        var user = CurrentUser.require();
        if (!Role.ROLE_SUPER_ADMIN.name().equals(user.role())) {
            throw ApiException.forbidden("PIN_PERMISSION_DENIED", "Only Super Admins can pin messages in the global chat.");
        }

        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("MESSAGE_NOT_FOUND", "Message not found"));

        if (msg.getEvent() != null) {
            throw ApiException.badRequest("NOT_GLOBAL_MESSAGE", "This message does not belong to global chat.");
        }

        boolean willPin = !msg.isPinned();
        msg.setPinned(willPin);
        msg.setPinnedBy(willPin ? resolveSender(user).name() : null);
        msg.setPinnedAt(willPin ? Instant.now() : null);

        msg = chatMessageRepository.save(msg);
        return toResponse(msg);
    }

    /* -------------------------------------------------------------
     * EVENT OPERATIONS CHAT METHODS
     * ------------------------------------------------------------- */

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listEventMessages(Long eventId) {
        var user = CurrentUser.require();
        DisasterEvent event = loadEvent(eventId);
        verifyEventChatAccess(event, user);

        return chatMessageRepository.findEventMessages(event).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendEventMessage(Long eventId, SendMessageRequest req) {
        var user = CurrentUser.require();
        DisasterEvent event = loadEvent(eventId);
        verifyEventChatAccess(event, user);

        SenderInfo sender = resolveSender(user);

        ChatMessage msg = ChatMessage.builder()
                .event(event)
                .senderId(user.id())
                .senderRole(sender.role())
                .senderName(sender.name())
                .senderEmail(user.email())
                .message(req.message().trim())
                .pinned(false)
                .build();

        msg = chatMessageRepository.save(msg);
        return toResponse(msg);
    }

    @Transactional
    public ChatMessageResponse togglePinEventMessage(Long eventId, Long messageId) {
        var user = CurrentUser.require();
        DisasterEvent event = loadEvent(eventId);

        // Pinning in event chat is restricted to Super Admin or the organizing NGO
        boolean isSuperAdmin = Role.ROLE_SUPER_ADMIN.name().equals(user.role());
        boolean isOrganizingNgo = Role.ROLE_NGO_ADMIN.name().equals(user.role())
                && event.getNgo() != null && event.getNgo().getId().equals(user.ngoId());

        if (!isSuperAdmin && !isOrganizingNgo) {
            throw ApiException.forbidden("PIN_PERMISSION_DENIED",
                    "Only the event's organizing NGO or a Super Admin can pin operational messages.");
        }

        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("MESSAGE_NOT_FOUND", "Message not found"));

        if (msg.getEvent() == null || !msg.getEvent().getId().equals(eventId)) {
            throw ApiException.badRequest("EVENT_MISMATCH", "Message does not belong to this event.");
        }

        boolean willPin = !msg.isPinned();
        msg.setPinned(willPin);
        msg.setPinnedBy(willPin ? resolveSender(user).name() : null);
        msg.setPinnedAt(willPin ? Instant.now() : null);

        msg = chatMessageRepository.save(msg);
        return toResponse(msg);
    }

    @Transactional(readOnly = true)
    public List<ChatEventSummaryResponse> listAccessibleChatEvents() {
        var user = CurrentUser.require();

        if (Role.ROLE_SUPER_ADMIN.name().equals(user.role())) {
            // Super Admin can access all events
            return eventRepository.findAll(PageRequest.of(0, 100, Sort.by("createdAt").descending())).stream()
                    .map(this::toEventSummary)
                    .toList();
        }

        if (Role.ROLE_NGO_ADMIN.name().equals(user.role())) {
            // NGO can access their organized events
            Ngo ngo = ngoRepository.findById(user.ngoId() != null ? user.ngoId() : user.id()).orElse(null);
            if (ngo == null) return List.of();
            return eventRepository.findAllByNgo(ngo, PageRequest.of(0, 100, Sort.by("createdAt").descending())).stream()
                    .map(this::toEventSummary)
                    .toList();
        }

        if (Role.ROLE_VOLUNTEER.name().equals(user.role())) {
            // Volunteer can access events they've joined or created
            Volunteer v = volunteerRepository.findById(user.id()).orElse(null);
            if (v == null) return List.of();
            return participationRepository.findAllByVolunteerOrderByCreatedAtDesc(v).stream()
                    .map(p -> toEventSummary(p.getEvent()))
                    .toList();
        }

        return List.of();
    }

    /* -------------------------------------------------------------
     * ACCESS VERIFICATION & HELPERS
     * ------------------------------------------------------------- */

    private void verifyEventChatAccess(DisasterEvent event, AuthenticatedUser user) {
        // 1. Super Admin has universal platform access
        if (Role.ROLE_SUPER_ADMIN.name().equals(user.role())) {
            return;
        }

        // 2. Organizing NGO
        if (Role.ROLE_NGO_ADMIN.name().equals(user.role())) {
            if (event.getNgo() != null && event.getNgo().getId().equals(user.ngoId())) {
                return;
            }
            throw ApiException.forbidden("CHAT_ACCESS_DENIED",
                    "This event operations chat is restricted to the organizing NGO, joined volunteers, and platform admins.");
        }

        // 3. Joined Volunteer or Event Creator
        if (Role.ROLE_VOLUNTEER.name().equals(user.role())) {
            Volunteer volunteer = volunteerRepository.findById(user.id())
                    .orElseThrow(() -> ApiException.notFound("VOLUNTEER_NOT_FOUND", "Volunteer not found"));

            boolean isParticipant = participationRepository.existsByEventAndVolunteer(event, volunteer);
            boolean isCreator = event.getCreatedByVolunteer() != null
                    && event.getCreatedByVolunteer().getId().equals(volunteer.getId());

            if (isParticipant || isCreator) {
                return;
            }

            throw ApiException.forbidden("CHAT_ACCESS_DENIED",
                    "You must join this disaster event first to participate in its operational chat room.");
        }

        throw ApiException.forbidden("CHAT_ACCESS_DENIED", "Access to this event chat is not permitted.");
    }

    private DisasterEvent loadEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("EVENT_NOT_FOUND", "Disaster event not found"));
    }

    private SenderInfo resolveSender(AuthenticatedUser user) {
        if (Role.ROLE_SUPER_ADMIN.name().equals(user.role())) {
            String name = adminRepository.findById(user.id()).map(SuperAdmin::getName).orElse("Platform Administrator");
            return new SenderInfo(name, Role.ROLE_SUPER_ADMIN);
        }
        if (Role.ROLE_NGO_ADMIN.name().equals(user.role())) {
            Long ngoId = user.ngoId() != null ? user.ngoId() : user.id();
            String name = ngoRepository.findById(ngoId).map(Ngo::getName).orElse("NGO Organization");
            return new SenderInfo(name, Role.ROLE_NGO_ADMIN);
        }
        if (Role.ROLE_VOLUNTEER.name().equals(user.role())) {
            String name = volunteerRepository.findById(user.id()).map(Volunteer::getName).orElse("Volunteer");
            return new SenderInfo(name, Role.ROLE_VOLUNTEER);
        }
        return new SenderInfo("Nexora User", Role.ROLE_VOLUNTEER);
    }

    private ChatMessageResponse toResponse(ChatMessage m) {
        Long eventId = m.getEvent() != null ? m.getEvent().getId() : null;
        String eventTitle = m.getEvent() != null ? m.getEvent().getTitle() : null;

        return new ChatMessageResponse(
                m.getId(),
                eventId,
                eventTitle,
                m.getSenderId(),
                m.getSenderRole(),
                m.getSenderName(),
                m.getSenderEmail(),
                m.getMessage(),
                m.isPinned(),
                m.getPinnedBy(),
                m.getPinnedAt(),
                m.getCreatedAt()
        );
    }

    private ChatEventSummaryResponse toEventSummary(DisasterEvent e) {
        String organizerName = "Nexora Platform";
        String organizerType = "PLATFORM";
        if (e.getNgo() != null) {
            organizerName = e.getNgo().getName();
            organizerType = "NGO";
        } else if (e.getCreatedByVolunteer() != null) {
            organizerName = e.getCreatedByVolunteer().getName();
            organizerType = "VOLUNTEER";
        } else if (e.getCreatedByAdmin() != null) {
            organizerName = e.getCreatedByAdmin().getName();
            organizerType = "ADMIN";
        }

        long messageCount = chatMessageRepository.countByEvent(e);
        long participantCount = participationRepository.countByEvent(e);

        return new ChatEventSummaryResponse(
                e.getId(),
                e.getTitle(),
                e.getType(),
                e.getSeverity(),
                e.getStatus(),
                organizerName,
                organizerType,
                participantCount,
                messageCount,
                e.getStartAt(),
                e.getEndAt()
        );
    }

    private record SenderInfo(String name, Role role) {}
}
