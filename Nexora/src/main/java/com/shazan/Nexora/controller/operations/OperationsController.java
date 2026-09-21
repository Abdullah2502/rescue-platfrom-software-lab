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

    @PostMapping("/shelters")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<ShelterResponse> createShelter(@Valid @RequestBody ShelterRequest request) {
        return ApiResponse.ok(service.createShelter(request));
    }

    @PutMapping("/shelters/{id}")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<ShelterResponse> updateShelter(@PathVariable Long id,
                                                      @Valid @RequestBody ShelterRequest request) {
        return ApiResponse.ok(service.updateShelter(id, request));
    }

    @GetMapping("/inventory")
    public ApiResponse<List<InventoryItemResponse>> inventory() {
        return ApiResponse.ok(service.listInventory());
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<InventoryItemResponse> createInventory(@Valid @RequestBody InventoryItemRequest request) {
        return ApiResponse.ok(service.createInventoryItem(request));
    }

    @PutMapping("/inventory/{id}")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<InventoryItemResponse> updateInventory(@PathVariable Long id,
                                                               @Valid @RequestBody InventoryItemRequest request) {
        return ApiResponse.ok(service.updateInventoryItem(id, request));
    }

    @GetMapping("/distributions")
    public ApiResponse<List<DistributionResponse>> distributions() {
        return ApiResponse.ok(service.listDistributions());
    }

    @PostMapping("/distributions")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<DistributionResponse> createDistribution(@Valid @RequestBody DistributionRequest request) {
        return ApiResponse.ok(service.createDistribution(request));
    }

    @PatchMapping("/distributions/{id}/status")
    @PreAuthorize("hasRole('NGO_ADMIN')")
    public ApiResponse<DistributionResponse> updateDistributionStatus(@PathVariable Long id,
                                                                       @RequestParam DistributionStatus status) {
        return ApiResponse.ok(service.updateDistributionStatus(id, status));
    }
}
