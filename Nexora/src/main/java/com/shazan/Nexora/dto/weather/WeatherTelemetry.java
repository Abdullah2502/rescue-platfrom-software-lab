package com.shazan.Nexora.dto.weather;

public record WeatherTelemetry(
        double temperature,
        double precipitation,
        double windSpeed,
        int relativeHumidity,
        int weatherCode,
        String condition,
        String fetchedAt
) {}

