package com.shazan.Nexora.controller.event;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.dto.event.DisasterEventRequest;
import com.shazan.Nexora.dto.event.DisasterEventResponse;
import com.shazan.Nexora.service.event.DisasterEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DisasterEventController {

    private final DisasterEventService service;

    @GetMapping("/ngo/events")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<PageResponse<DisasterEventResponse>> listForNgo(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean all) {
        return ApiResponse.ok(service.listForCurrentNgo(page, size, all));
    }

    @PostMapping("/ngo/events")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<DisasterEventResponse> createForNgo(@Valid @RequestBody DisasterEventRequest req) {
        return ApiResponse.ok(service.createForNgo(req));
    }

    @GetMapping("/volunteer/events")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ApiResponse<PageResponse<DisasterEventResponse>> listForVolunteers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.listForVolunteers(page, size));
    }

    @PostMapping("/volunteer/events")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ApiResponse<DisasterEventResponse> createForVolunteer(@Valid @RequestBody DisasterEventRequest req) {
        return ApiResponse.ok(service.createForVolunteer(req));
    }

    @GetMapping("/volunteer/event-requests")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ApiResponse<PageResponse<DisasterEventResponse>> listMyEventRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.listMyEventRequests(page, size));
    }

    @PostMapping("/admin/events")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<DisasterEventResponse> createForAdmin(@Valid @RequestBody DisasterEventRequest req) {
        return ApiResponse.ok(service.createForAdmin(req));
    }

    @GetMapping("/events/{id}")
    public ApiResponse<DisasterEventResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(id));
    }

    @PostMapping("/volunteer/events/{id}/join")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ApiResponse<DisasterEventResponse> join(@PathVariable Long id) {
        return ApiResponse.ok(service.join(id));
    }

    @DeleteMapping("/volunteer/events/{id}/join")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ApiResponse<DisasterEventResponse> withdraw(@PathVariable Long id) {
        return ApiResponse.ok(service.withdraw(id));
    }

    @PatchMapping("/events/{id}/status")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'VOLUNTEER', 'SUPER_ADMIN')")
    public ApiResponse<DisasterEventResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam EventStatus status) {
        return ApiResponse.ok(service.changeStatus(id, status));
    }
}
