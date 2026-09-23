package com.shazan.Nexora.controller.forecast;

import com.shazan.Nexora.common.ApiResponse;
import com.shazan.Nexora.dto.forecast.DivisionForecastResponse;
import com.shazan.Nexora.service.forecast.ForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping("/divisions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'NGO_ADMIN')")
    public ApiResponse<List<DivisionForecastResponse>> getNationalForecasts() {
        return ApiResponse.ok(forecastService.getNationalForecasts());
    }

    @GetMapping("/divisions/{divisionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'NGO_ADMIN')")
    public ApiResponse<DivisionForecastResponse> getForecastForDivision(@PathVariable Long divisionId) {
        return ApiResponse.ok(forecastService.getForecastForDivision(divisionId));
    }
}

