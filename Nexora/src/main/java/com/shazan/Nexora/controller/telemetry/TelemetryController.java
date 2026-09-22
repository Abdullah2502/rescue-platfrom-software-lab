package com.shazan.Nexora.controller.telemetry;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.dto.telemetry.PublicStatsResponse;
import com.shazan.Nexora.repository.event.DisasterEventRepository;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/telemetry")
@RequiredArgsConstructor
public class TelemetryController {

    private final DisasterEventRepository eventRepository;
    private final EventParticipationRepository participationRepository;
    private final VolunteerRepository volunteerRepository;

    @GetMapping("/public-stats")
    public ApiResponse<PublicStatsResponse> getPublicStats() {
        long activeEvents = eventRepository.countByStatusIn(List.of(EventStatus.OPEN, EventStatus.ONGOING));
        long deployedPersonnel = participationRepository.count();
        long totalVolunteers = volunteerRepository.countByStatus(VolunteerStatus.ACTIVE);
        return ApiResponse.ok(new PublicStatsResponse(activeEvents, deployedPersonnel, "12m", totalVolunteers));
    }
}
