package com.shazan.Nexora.service.weather;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shazan.Nexora.dto.weather.WeatherTelemetry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class WeatherService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    // Cache weather readings for 20 minutes per division
    private record CacheEntry(WeatherTelemetry telemetry, Instant cachedAt) {}
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final Duration CACHE_TTL = Duration.ofMinutes(20);

    // Approximate centroid coordinates for Bangladesh's 8 divisions
    private static final Map<String, double[]> DIVISION_COORDINATES = Map.of(
            "dhaka", new double[]{23.8103, 90.4125},
            "chattogram", new double[]{22.3569, 91.7832},
            "chittagong", new double[]{22.3569, 91.7832},
            "rajshahi", new double[]{24.3745, 88.6042},
            "khulna", new double[]{22.8456, 89.5403},
            "barishal", new double[]{22.7010, 90.3535},
            "barisal", new double[]{22.7010, 90.3535},
            "sylhet", new double[]{24.8949, 91.8687},
            "rangpur", new double[]{25.7439, 89.2752},
            "mymensingh", new double[]{24.7471, 90.4203}
    );

    public WeatherTelemetry getWeatherForDivision(String rawDivisionName) {
        String key = rawDivisionName == null ? "dhaka" : rawDivisionName.trim().toLowerCase(Locale.ROOT);
        CacheEntry cached = cache.get(key);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return cached.telemetry();
        }

        double[] coords = DIVISION_COORDINATES.getOrDefault(key, DIVISION_COORDINATES.get("dhaka"));
        WeatherTelemetry fresh = fetchFromOpenMeteo(coords[0], coords[1]);
        if (fresh != null) {
            cache.put(key, new CacheEntry(fresh, Instant.now()));
            return fresh;
        }

        // Return fallback if cached exists or produce sensible default
        if (cached != null) {
            return cached.telemetry();
        }
        return createFallbackTelemetry();
    }

    private WeatherTelemetry fetchFromOpenMeteo(double latitude, double longitude) {
        try {
            String uriStr = String.format(Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
                    latitude, longitude);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uriStr))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .header("User-Agent", "Nexora-Disaster-Platform/1.0")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode current = root.path("current");
                if (!current.isMissingNode()) {
                    double temp = current.path("temperature_2m").asDouble(28.0);
                    int humidity = current.path("relative_humidity_2m").asInt(75);
                    double precip = current.path("precipitation").asDouble(0.0);
                    double wind = current.path("wind_speed_10m").asDouble(10.0);
                    int code = current.path("weather_code").asInt(0);
                    String condition = interpretWmoWeatherCode(code, precip, wind);

                    return new WeatherTelemetry(temp, precip, wind, humidity, code, condition, Instant.now().toString());
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch live weather from Open-Meteo for ({}, {}): {}", latitude, longitude, ex.getMessage());
        }
        return null;
    }

    private String interpretWmoWeatherCode(int code, double precip, double wind) {
        if (code >= 95) return "Thunderstorm / High Alert";
        if (code >= 80) return "Heavy Rain Showers";
        if (code >= 61 || precip > 10.0) return "Active Rainfall";
        if (code >= 51 || precip > 0.0) return "Light Rain / Drizzle";
        if (wind > 35.0) return "Strong Gale / High Wind";
        if (code >= 45) return "Foggy / Mist";
        if (code >= 1 && code <= 3) return "Partly Cloudy";
        return "Fair / Clear Skies";
    }

    private WeatherTelemetry createFallbackTelemetry() {
        return new WeatherTelemetry(
                29.5,
                0.0,
                11.0,
                72,
                1,
                "Fair / Clear (Seasonal Baseline)",
                Instant.now().toString()
        );
    }
}

