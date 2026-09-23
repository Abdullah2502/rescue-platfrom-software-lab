package com.shazan.Nexora.dto.forecast;

import com.shazan.Nexora.dto.weather.WeatherTelemetry;

import java.util.List;

public record DivisionForecastResponse(
        Long divisionId,
        String divisionName,
        String divisionBnName,
        String overallRiskLevel,
        double overallRiskScore,
        int predictedVolunteersNeeded,
        String primaryThreat,
        boolean isUserDivision,
        WeatherTelemetry weather,
        VolunteerSupply volunteerSupply,
        ResourceSnapshot resources,
        List<DisasterTypeRisk> risks,
        String recommendation
) {}

