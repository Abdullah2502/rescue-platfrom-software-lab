package com.shazan.Nexora.controller.chat;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.dto.chat.ChatEventSummaryResponse;
import com.shazan.Nexora.dto.chat.ChatMessageResponse;
import com.shazan.Nexora.dto.chat.SendMessageRequest;
import com.shazan.Nexora.service.chat.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatController {

    private final ChatService chatService;

    /* -------------------------------------------------------------
     * GLOBAL CHAT ENDPOINTS
     * ------------------------------------------------------------- */

    @GetMapping("/global")
    public ApiResponse<List<ChatMessageResponse>> listGlobalMessages() {
        return ApiResponse.ok(chatService.listGlobalMessages());
    }

    @PostMapping("/global")
    public ApiResponse<ChatMessageResponse> sendGlobalMessage(@Valid @RequestBody SendMessageRequest req) {
        return ApiResponse.ok(chatService.sendGlobalMessage(req));
    }

    @PatchMapping("/global/{messageId}/pin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<ChatMessageResponse> togglePinGlobalMessage(@PathVariable Long messageId) {
        return ApiResponse.ok(chatService.togglePinGlobalMessage(messageId));
    }

    /* -------------------------------------------------------------
     * EVENT OPERATIONS CHAT ENDPOINTS
     * ------------------------------------------------------------- */

    @GetMapping("/events")
    public ApiResponse<List<ChatEventSummaryResponse>> listAccessibleChatEvents() {
        return ApiResponse.ok(chatService.listAccessibleChatEvents());
    }

    @GetMapping("/events/{eventId}")
    public ApiResponse<List<ChatMessageResponse>> listEventMessages(@PathVariable Long eventId) {
        return ApiResponse.ok(chatService.listEventMessages(eventId));
    }

    @PostMapping("/events/{eventId}")
    public ApiResponse<ChatMessageResponse> sendEventMessage(
            @PathVariable Long eventId,
            @Valid @RequestBody SendMessageRequest req) {
        return ApiResponse.ok(chatService.sendEventMessage(eventId, req));
    }

    @PatchMapping("/events/{eventId}/{messageId}/pin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'NGO_ADMIN')")
    public ApiResponse<ChatMessageResponse> togglePinEventMessage(
            @PathVariable Long eventId,
            @PathVariable Long messageId) {
        return ApiResponse.ok(chatService.togglePinEventMessage(eventId, messageId));
    }

    /* -------------------------------------------------------------
     * UNREAD SUMMARY & READ RECEIPT ENDPOINTS
     * ------------------------------------------------------------- */

    @GetMapping("/unread-summary")
    public ApiResponse<com.shazan.Nexora.dto.chat.ChatUnreadSummaryResponse> getUnreadSummary() {
        return ApiResponse.ok(chatService.getUnreadSummary());
    }

    @PostMapping("/global/read")
    public ApiResponse<Void> markGlobalAsRead(@RequestBody(required = false) com.shazan.Nexora.dto.chat.MarkReadRequest req) {
        Long lastId = req != null ? req.lastMessageId() : null;
        chatService.markGlobalAsRead(lastId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/events/{eventId}/read")
    public ApiResponse<Void> markEventAsRead(
            @PathVariable Long eventId,
            @RequestBody(required = false) com.shazan.Nexora.dto.chat.MarkReadRequest req) {
        Long lastId = req != null ? req.lastMessageId() : null;
        chatService.markEventAsRead(eventId, lastId);
        return ApiResponse.ok(null);
    }
}

