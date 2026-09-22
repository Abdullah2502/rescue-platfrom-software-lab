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
    private final com.shazan.Nexora.repository.chat.ChatReadReceiptRepository readReceiptRepository;

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
        return getAccessibleEventsForUser(user).stream()
                .map(this::toEventSummary)
                .toList();
    }

    public List<DisasterEvent> getAccessibleEventsForUser(AuthenticatedUser user) {
        if (Role.ROLE_SUPER_ADMIN.name().equals(user.role())) {
            return eventRepository.findAll(PageRequest.of(0, 100, Sort.by("createdAt").descending())).getContent();
        }

        if (Role.ROLE_NGO_ADMIN.name().equals(user.role())) {
            Ngo ngo = ngoRepository.findById(user.ngoId() != null ? user.ngoId() : user.id()).orElse(null);
            if (ngo == null) return List.of();
            return eventRepository.findAllByNgo(ngo, PageRequest.of(0, 100, Sort.by("createdAt").descending())).getContent();
        }

        if (Role.ROLE_VOLUNTEER.name().equals(user.role())) {
            Volunteer v = volunteerRepository.findById(user.id()).orElse(null);
            if (v == null) return List.of();
            return participationRepository.findAllByVolunteerOrderByCreatedAtDesc(v).stream()
                    .map(com.shazan.Nexora.domain.event.EventParticipation::getEvent)
                    .toList();
        }

        return List.of();
    }

    /* -------------------------------------------------------------
     * UNREAD TRACKING & READ RECEIPTS
     * ------------------------------------------------------------- */

    @Transactional
    public void markGlobalAsRead(Long lastMessageId) {
        var user = CurrentUser.require();
        Role role = Role.valueOf(user.role());

        Long targetId = lastMessageId;
        if (targetId == null || targetId <= 0) {
            targetId = chatMessageRepository.findFirstByEventIsNullOrderByIdDesc()
                    .map(ChatMessage::getId)
                    .orElse(0L);
        }

        com.shazan.Nexora.domain.chat.ChatReadReceipt receipt = readReceiptRepository
                .findByUserIdAndUserRoleAndEventIsNull(user.id(), role)
                .orElse(null);

        if (receipt == null) {
            receipt = com.shazan.Nexora.domain.chat.ChatReadReceipt.builder()
                    .userId(user.id())
                    .userRole(role)
                    .event(null)
                    .lastReadMessageId(targetId)
                    .lastReadAt(Instant.now())
                    .build();
        } else {
            if (targetId > receipt.getLastReadMessageId()) {
                receipt.setLastReadMessageId(targetId);
                receipt.setLastReadAt(Instant.now());
            }
        }
        readReceiptRepository.save(receipt);
    }

    @Transactional
    public void markEventAsRead(Long eventId, Long lastMessageId) {
        var user = CurrentUser.require();
        Role role = Role.valueOf(user.role());
        DisasterEvent event = loadEvent(eventId);
        verifyEventChatAccess(event, user);

        Long targetId = lastMessageId;
        if (targetId == null || targetId <= 0) {
            targetId = chatMessageRepository.findFirstByEventOrderByIdDesc(event)
                    .map(ChatMessage::getId)
                    .orElse(0L);
        }

        com.shazan.Nexora.domain.chat.ChatReadReceipt receipt = readReceiptRepository
                .findByUserIdAndUserRoleAndEvent(user.id(), role, event)
                .orElse(null);

        if (receipt == null) {
            receipt = com.shazan.Nexora.domain.chat.ChatReadReceipt.builder()
                    .userId(user.id())
                    .userRole(role)
                    .event(event)
                    .lastReadMessageId(targetId)
                    .lastReadAt(Instant.now())
                    .build();
        } else {
            if (targetId > receipt.getLastReadMessageId()) {
                receipt.setLastReadMessageId(targetId);
                receipt.setLastReadAt(Instant.now());
            }
        }
        readReceiptRepository.save(receipt);
    }

    @Transactional(readOnly = true)
    public com.shazan.Nexora.dto.chat.ChatUnreadSummaryResponse getUnreadSummary() {
        var user = CurrentUser.require();
        Role role = Role.valueOf(user.role());

        // 1. Global Chat Unread Count
        com.shazan.Nexora.domain.chat.ChatReadReceipt globalReceipt = readReceiptRepository
                .findByUserIdAndUserRoleAndEventIsNull(user.id(), role)
                .orElse(null);

        long globalUnread;
        if (globalReceipt != null) {
            globalUnread = chatMessageRepository.countUnreadGlobalMessages(globalReceipt.getLastReadMessageId(), user.id(), role);
        } else {
            globalUnread = chatMessageRepository.countAllUnreadGlobalMessages(user.id(), role);
        }

        ChatMessage latestGlobal = chatMessageRepository.findFirstByEventIsNullOrderByIdDesc().orElse(null);
        String latestGlobalMsg = latestGlobal != null ? latestGlobal.getMessage() : null;
        String latestGlobalSender = latestGlobal != null ? latestGlobal.getSenderName() : null;
        Instant latestGlobalAt = latestGlobal != null ? latestGlobal.getCreatedAt() : null;

        // 2. Accessible Event Chats Unread Count
        List<DisasterEvent> accessibleEvents = getAccessibleEventsForUser(user);
        java.util.Map<Long, com.shazan.Nexora.domain.chat.ChatReadReceipt> eventReceiptMap = readReceiptRepository
                .findAllByUserIdAndUserRole(user.id(), role)
                .stream()
                .filter(r -> r.getEvent() != null)
                .collect(java.util.stream.Collectors.toMap(r -> r.getEvent().getId(), r -> r, (a, b) -> a));

        java.util.List<com.shazan.Nexora.dto.chat.ChatUnreadSummaryResponse.UnreadEventSummary> unreadEvents = new java.util.ArrayList<>();
        long totalEventUnread = 0;

        for (DisasterEvent event : accessibleEvents) {
            com.shazan.Nexora.domain.chat.ChatReadReceipt receipt = eventReceiptMap.get(event.getId());
            long count;
            if (receipt != null) {
                count = chatMessageRepository.countUnreadEventMessages(event, receipt.getLastReadMessageId(), user.id(), role);
            } else {
                count = chatMessageRepository.countAllUnreadEventMessages(event, user.id(), role);
            }

            if (count > 0) {
                totalEventUnread += count;
                ChatMessage latestMsg = chatMessageRepository.findFirstByEventOrderByIdDesc(event).orElse(null);
                unreadEvents.add(new com.shazan.Nexora.dto.chat.ChatUnreadSummaryResponse.UnreadEventSummary(
                        event.getId(),
                        event.getTitle(),
                        count,
                        latestMsg != null ? latestMsg.getMessage() : null,
                        latestMsg != null ? latestMsg.getSenderName() : null,
                        latestMsg != null ? latestMsg.getCreatedAt() : null
                ));
            }
        }

        return new com.shazan.Nexora.dto.chat.ChatUnreadSummaryResponse(
                globalUnread,
                latestGlobalMsg,
                latestGlobalSender,
                latestGlobalAt,
                totalEventUnread,
                globalUnread + totalEventUnread,
                unreadEvents
        );
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
