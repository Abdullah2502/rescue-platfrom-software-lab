package com.shazan.Nexora.controller.operations;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.domain.enums.DistributionStatus;
import com.shazan.Nexora.dto.operations.*;
import com.shazan.Nexora.service.operations.OperationsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operations")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService service;

    @GetMapping("/summary")
    public ApiResponse<OperationsSummaryResponse> summary() {
        return ApiResponse.ok(service.summary());
    }

    @GetMapping("/shelters")
    public ApiResponse<List<ShelterResponse>> shelters() {
        return ApiResponse.ok(service.listShelters());
    }

    @GetMapping("/shelters/{id}")
    public ApiResponse<ShelterResponse> getShelter(@PathVariable Long id) {
        return ApiResponse.ok(service.getShelter(id));
    }

    @PostMapping("/shelters")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ShelterResponse> createShelter(@Valid @RequestBody ShelterRequest request) {
        return ApiResponse.ok(service.createShelter(request));
    }

    @PutMapping("/shelters/{id}")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ShelterResponse> updateShelter(@PathVariable Long id,
                                                      @Valid @RequestBody ShelterRequest request) {
        return ApiResponse.ok(service.updateShelter(id, request));
    }

    @GetMapping("/inventory")
    public ApiResponse<List<InventoryItemResponse>> inventory() {
        return ApiResponse.ok(service.listInventory());
    }

    @GetMapping("/inventory/{id}")
    public ApiResponse<InventoryItemResponse> getInventoryItem(@PathVariable Long id) {
        return ApiResponse.ok(service.getInventoryItem(id));
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InventoryItemResponse> createInventory(@Valid @RequestBody InventoryItemRequest request) {
        return ApiResponse.ok(service.createInventoryItem(request));
    }

    @PutMapping("/inventory/{id}")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InventoryItemResponse> updateInventory(@PathVariable Long id,
                                                               @Valid @RequestBody InventoryItemRequest request) {
        return ApiResponse.ok(service.updateInventoryItem(id, request));
    }

    @GetMapping("/distributions")
    public ApiResponse<List<DistributionResponse>> distributions() {
        return ApiResponse.ok(service.listDistributions());
    }

    @GetMapping("/distributions/{id}")
    public ApiResponse<DistributionResponse> getDistribution(@PathVariable Long id) {
        return ApiResponse.ok(service.getDistribution(id));
    }

    @PostMapping("/distributions")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DistributionResponse> createDistribution(@Valid @RequestBody DistributionRequest request) {
        return ApiResponse.ok(service.createDistribution(request));
    }

    @PutMapping("/distributions/{id}")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DistributionResponse> updateDistribution(@PathVariable Long id,
                                                                @Valid @RequestBody DistributionRequest request) {
        return ApiResponse.ok(service.updateDistribution(id, request));
    }

    @PatchMapping("/distributions/{id}/status")
    @PreAuthorize("hasAnyRole('NGO_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DistributionResponse> updateDistributionStatus(@PathVariable Long id,
                                                                       @RequestParam("status") DistributionStatus status) {
        return ApiResponse.ok(service.updateDistributionStatus(id, status));
    }
}
