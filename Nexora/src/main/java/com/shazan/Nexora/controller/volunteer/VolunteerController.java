package com.shazan.Nexora.controller.volunteer;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.dto.volunteer.UpdateVolunteerProfileRequest;
import com.shazan.Nexora.dto.volunteer.VolunteerResponse;
import com.shazan.Nexora.dto.certificate.CertificateResponse;
import com.shazan.Nexora.service.certificate.CertificateService;
import com.shazan.Nexora.service.volunteer.VolunteerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/volunteer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VOLUNTEER')")
public class VolunteerController {

    private final VolunteerService service;
    private final CertificateService certificateService;

    @GetMapping("/dashboard")
    public ApiResponse<VolunteerResponse> dashboard() {
        return ApiResponse.ok(service.me());
    }

    @PutMapping("/profile")
    public ApiResponse<VolunteerResponse> updateProfile(@Valid @RequestBody UpdateVolunteerProfileRequest req) {
        return ApiResponse.ok(service.updateMyProfile(req));
    }

    @GetMapping("/certificates")
    public ApiResponse<List<CertificateResponse>> certificates() {
        return ApiResponse.ok(certificateService.listForCurrentVolunteer());
    }

}
