package com.shazan.Nexora.controller.admin;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.domain.enums.NgoStatus;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.dto.event.DisasterEventResponse;
import com.shazan.Nexora.dto.location.LocationDto;
import com.shazan.Nexora.dto.ngo.NgoApprovalRequest;
import com.shazan.Nexora.dto.ngo.NgoResponse;
import com.shazan.Nexora.dto.volunteer.VolunteerApprovalRequest;
import com.shazan.Nexora.dto.volunteer.VolunteerResponse;
import com.shazan.Nexora.dto.certificate.CertificateGenerationResponse;
import com.shazan.Nexora.dto.certificate.CertificateResponse;
import com.shazan.Nexora.service.certificate.CertificateService;
import com.shazan.Nexora.service.admin.SuperAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService service;
    private final CertificateService certificateService;

    @GetMapping("/ngos")
    public ApiResponse<PageResponse<NgoResponse>> listNgos(@RequestParam(required = false) NgoStatus status,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.listNgos(status, page, size));
    }

    @PostMapping("/ngos/{id}/approve")
    public ApiResponse<NgoResponse> approveOrReject(@PathVariable Long id, @Valid @RequestBody NgoApprovalRequest req) {
        return ApiResponse.ok(service.reviewNgo(id, req));
    }

    /**
     * Hard-delete an NGO. Cascades the NGO's events and invitations, and
     * nulls out the {@code recruitedByNgo} pointer on volunteers they added.
     * Response includes the counts of cascaded rows for audit logs.
     */
    @DeleteMapping("/ngos/{id}")
    public ApiResponse<Map<String, Object>> deleteNgo(@PathVariable Long id) {
        return ApiResponse.ok(service.deleteNgo(id));
    }

    @GetMapping("/volunteers")
    public ApiResponse<PageResponse<VolunteerResponse>> listVolunteers(
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long thanaId,
            @RequestParam(required = false) VolunteerStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.listVolunteers(divisionId, districtId, thanaId, status, q, page, size));
    }

    @PostMapping("/volunteers/{id}/review")
    public ApiResponse<VolunteerResponse> reviewVolunteer(@PathVariable Long id,
                                                          @Valid @RequestBody VolunteerApprovalRequest req) {
        return ApiResponse.ok(service.reviewVolunteer(id, req));
    }

    /**
     * Hard-delete a volunteer. Refuses if the volunteer still has outstanding
     * event invitations — those must be resolved first so we don't strand
     * an {@code EventInvitation} row pointing at a deleted volunteer.
     */
    @DeleteMapping("/volunteers/{id}")
    public ApiResponse<Void> deleteVolunteer(@PathVariable Long id) {
        service.deleteVolunteer(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/events")
    public ApiResponse<PageResponse<DisasterEventResponse>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.listAllEvents(page, size));
    }

    @PostMapping("/events/{id}/certificates/generate")
    public ApiResponse<CertificateGenerationResponse> generateCertificates(@PathVariable Long id) {
        return ApiResponse.ok(certificateService.generateForEvent(id));
    }

    @GetMapping("/certificates")
    public ApiResponse<List<CertificateResponse>> listCertificates() {
        return ApiResponse.ok(certificateService.listAll());
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        return ApiResponse.ok(service.stats());
    }

    @PostMapping("/locations/divisions")
    public ApiResponse<LocationDto> addDivision(@RequestParam String name, @RequestParam(required = false) String bnName) {
        return ApiResponse.ok(service.addDivision(name, bnName));
    }

    @PostMapping("/locations/districts")
    public ApiResponse<LocationDto> addDistrict(@RequestParam Long divisionId, @RequestParam String name,
                                               @RequestParam(required = false) String bnName) {
        return ApiResponse.ok(service.addDistrict(divisionId, name, bnName));
    }

    @PostMapping("/locations/thanas")
    public ApiResponse<LocationDto> addThana(@RequestParam Long districtId, @RequestParam String name,
                                             @RequestParam(required = false) String bnName) {
        return ApiResponse.ok(service.addThana(districtId, name, bnName));
    }

    @DeleteMapping("/locations/thanas/{id}")
    public ApiResponse<Void> deleteThana(@PathVariable Long id) {
        service.deleteThana(id);
        return ApiResponse.ok(null);
    }
}
