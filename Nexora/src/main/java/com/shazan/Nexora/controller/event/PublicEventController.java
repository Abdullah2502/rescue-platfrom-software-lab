package com.shazan.Nexora.controller.event;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.dto.event.DisasterEventResponse;
import com.shazan.Nexora.service.event.DisasterEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class PublicEventController {

    private final DisasterEventService eventService;

    @GetMapping
    public ApiResponse<PageResponse<DisasterEventResponse>> getLiveEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size) {
        
        return ApiResponse.ok(eventService.listPublicActiveEvents(page, size));
    }
}