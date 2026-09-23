package com.shazan.Nexora.service.forecast;

import com.shazan.Nexora.domain.enums.EventStatus;
import com.shazan.Nexora.domain.enums.EventType;
import com.shazan.Nexora.domain.enums.Severity;
import com.shazan.Nexora.domain.enums.VolunteerStatus;
import com.shazan.Nexora.domain.event.DisasterEvent;
import com.shazan.Nexora.domain.event.EventParticipation;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.InventoryItem;
import com.shazan.Nexora.domain.operations.Shelter;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.forecast.*;
import com.shazan.Nexora.dto.weather.WeatherTelemetry;
import com.shazan.Nexora.repository.event.DisasterEventRepository;
import com.shazan.Nexora.repository.event.EventParticipationRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.ngo.NgoRepository;
import com.shazan.Nexora.repository.operations.InventoryItemRepository;
import com.shazan.Nexora.repository.operations.ShelterRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.AuthenticatedUser;
import com.shazan.Nexora.security.CurrentUser;
import com.shazan.Nexora.service.weather.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastService {

    private final DivisionRepository divisionRepository;
    private final DisasterEventRepository eventRepository;
    private final VolunteerRepository volunteerRepository;
    private final EventParticipationRepository participationRepository;
    private final ShelterRepository shelterRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final NgoRepository ngoRepository;
    private final WeatherService weatherService;

    @Transactional(readOnly = true)
    public List<DivisionForecastResponse> getNationalForecasts() {
        AuthenticatedUser user = CurrentUser.require();
        Long userDivisionId = null;
        if (user.ngoId() != null) {
            userDivisionId = ngoRepository.findById(user.ngoId())
                    .map(Ngo::getDivision)
                    .map(Division::getId)
                    .orElse(null);
        }

        List<Division> divisions = divisionRepository.findAll();
        List<DivisionForecastResponse> responses = new ArrayList<>();

        for (Division div : divisions) {
            boolean isUserDiv = userDivisionId != null && userDivisionId.equals(div.getId());
            responses.add(computeForecastForDivision(div, isUserDiv));
        }

        // Sort: if user has a designated division, prioritize it at the top;
        // otherwise sort by overall risk score descending
        final Long priorityDivId = userDivisionId;
        responses.sort((a, b) -> {
            if (priorityDivId != null) {
                if (a.isUserDivision() && !b.isUserDivision()) return -1;
                if (!a.isUserDivision() && b.isUserDivision()) return 1;
            }
            return Double.compare(b.overallRiskScore(), a.overallRiskScore());
        });

        return responses;
    }

    @Transactional(readOnly = true)
    public DivisionForecastResponse getForecastForDivision(Long divisionId) {
        AuthenticatedUser user = CurrentUser.require();
        Division division = divisionRepository.findById(divisionId)
                .orElseThrow(() -> new IllegalArgumentException("Division not found: " + divisionId));

        Long userDivisionId = null;
        if (user.ngoId() != null) {
            userDivisionId = ngoRepository.findById(user.ngoId())
                    .map(Ngo::getDivision)
                    .map(Division::getId)
                    .orElse(null);
        }

        boolean isUserDiv = userDivisionId != null && userDivisionId.equals(division.getId());
        return computeForecastForDivision(division, isUserDiv);
    }

    private DivisionForecastResponse computeForecastForDivision(Division division, boolean isUserDivision) {
        // 1. Fetch live weather
        WeatherTelemetry weather = weatherService.getWeatherForDivision(division.getName());

        // 2. Fetch volunteer supply metrics
        long activeVolunteers = volunteerRepository.countByDivisionIdAndStatus(division.getId(), VolunteerStatus.ACTIVE);
        long deployedVolunteers = participationRepository.countActiveDeployedInDivision(division.getId());
        long availableVolunteers = Math.max(0, activeVolunteers - deployedVolunteers);

        List<Volunteer> divisionVolunteers = volunteerRepository.findAllByDivisionIdAndStatus(division.getId(), VolunteerStatus.ACTIVE);
        Map<String, Long> skillCounts = divisionVolunteers.stream()
                .filter(v -> v.getSkills() != null)
                .flatMap(v -> v.getSkills().stream())
                .collect(Collectors.groupingBy(s -> s.trim(), Collectors.counting()));

        List<String> topSkills = skillCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .toList();

        VolunteerSupply volunteerSupply = new VolunteerSupply(
                activeVolunteers,
                deployedVolunteers,
                availableVolunteers,
                topSkills
        );

        // 3. Fetch Operational Resources (platform-wide shelters and inventory)
        List<Shelter> allShelters = shelterRepository.findAllByActiveTrueOrderByNameAsc();
        long openShelters = allShelters.stream()
                .filter(s -> s.getStatus() != null && "OPEN".equalsIgnoreCase(s.getStatus().name()))
                .count();
        long availableBeds = allShelters.stream()
                .filter(s -> s.getStatus() != null && "OPEN".equalsIgnoreCase(s.getStatus().name()))
                .mapToLong(s -> Math.max(0, (s.getCapacity() != null ? s.getCapacity() : 0) - (s.getCurrentOccupancy() != null ? s.getCurrentOccupancy() : 0)))
                .sum();

        List<InventoryItem> allInventory = inventoryItemRepository.findAllByActiveTrueOrderByNameAsc();
        long lowStockCount = allInventory.stream()
                .filter(i -> i.getQuantity() != null && i.getReorderLevel() != null
                        && i.getQuantity().compareTo(i.getReorderLevel()) <= 0)
                .count();

        ResourceSnapshot resources = new ResourceSnapshot(
                allShelters.size(),
                openShelters,
                availableBeds,
                allInventory.size(),
                lowStockCount
        );

        // 4. Historical Events in this Division
        List<DisasterEvent> historicalEvents = eventRepository.findAllByDivisionId(division.getId());

        int currentMonth = LocalDate.now().getMonthValue();
        List<DisasterTypeRisk> risks = new ArrayList<>();

        EventType[] monitoredTypes = {
                EventType.FLOOD,
                EventType.CYCLONE,
                EventType.EARTHQUAKE,
                EventType.FIRE,
                EventType.PANDEMIC
        };

        double maxScore = 0.0;
        EventType primaryThreatType = EventType.FLOOD;
        int totalPredictedVolunteers = 0;

        for (EventType type : monitoredTypes) {
            DisasterTypeRisk risk = evaluateRiskForType(
                    type,
                    division,
                    historicalEvents,
                    weather,
                    currentMonth,
                    availableVolunteers
            );
            risks.add(risk);

            if (risk.riskScore() > maxScore) {
                maxScore = risk.riskScore();
                primaryThreatType = type;
            }
            totalPredictedVolunteers += risk.predictedVolunteersNeeded();
        }

        // Bounded overall risk score
        double overallScore = Math.min(0.98, Math.max(0.12, maxScore));
        String overallLevel = resolveRiskLevel(overallScore);

        // Adjust aggregate predicted volunteers for the top primary threats
        int overallVolunteersNeeded = (int) Math.round(totalPredictedVolunteers * 0.45);
        if (overallVolunteersNeeded < 15) overallVolunteersNeeded = 15;

        String recommendation = generateRecommendation(division.getName(), primaryThreatType, overallLevel, weather, availableVolunteers, overallVolunteersNeeded);

        return new DivisionForecastResponse(
                division.getId(),
                division.getName(),
                division.getBnName() != null ? division.getBnName() : division.getName(),
                overallLevel,
                Math.round(overallScore * 100.0) / 100.0,
                overallVolunteersNeeded,
                primaryThreatType.name(),
                isUserDivision,
                weather,
                volunteerSupply,
                resources,
                risks,
                recommendation
        );
    }

    private DisasterTypeRisk evaluateRiskForType(
            EventType type,
            Division division,
            List<DisasterEvent> divisionEvents,
            WeatherTelemetry weather,
            int currentMonth,
            long availableVolunteers
    ) {
        // A. Historical frequency & severity
        List<DisasterEvent> typeEvents = divisionEvents.stream()
                .filter(e -> e.getType() == type)
                .toList();

        int histCount = typeEvents.size();
        double avgSeverity = typeEvents.isEmpty() ? 2.0 : typeEvents.stream()
                .mapToDouble(e -> severityToWeight(e.getSeverity()))
                .average()
                .orElse(2.0);

        // B. Bangladesh Seasonal Multiplier
        double seasonalMultiplier = computeSeasonalMultiplier(type, division.getName(), currentMonth);

        // C. Live Weather Multiplier
        double weatherMultiplier = computeWeatherMultiplier(type, weather);

        // D. Volunteer fulfillment gap ratio
        double volunteerGapRatio = computeVolunteerGap(typeEvents, availableVolunteers);

        // E. Composite Risk Calculation
        // Weights: 0.25 (Hist) + 0.20 (Sev) + 0.20 (Season) + 0.20 (Weather) + 0.15 (Gap)
        double normHist = Math.min(1.0, histCount / 6.0); // 6+ historical events = max normalized
        double normSev = (avgSeverity - 1.0) / 3.0;        // 1.0 (Low) to 4.0 (Critical) -> 0.0 to 1.0
        double normSeason = Math.min(1.0, (seasonalMultiplier - 0.7) / 1.3); // 0.7 to 2.0 -> 0.0 to 1.0
        double normWeather = Math.min(1.0, (weatherMultiplier - 0.8) / 1.2); // 0.8 to 2.0 -> 0.0 to 1.0
        double normGap = volunteerGapRatio;

        double compositeScore = (0.25 * normHist)
                + (0.20 * normSev)
                + (0.20 * normSeason)
                + (0.20 * normWeather)
                + (0.15 * normGap);

        compositeScore = Math.max(0.10, Math.min(0.95, compositeScore));

        // Predict volunteer requirements
        int baseDemand = switch (type) {
            case FLOOD -> 40;
            case CYCLONE -> 55;
            case EARTHQUAKE -> 65;
            case FIRE -> 30;
            case PANDEMIC -> 35;
            default -> 25;
        };

        int predictedVolunteers = (int) Math.round(baseDemand * (1.0 + compositeScore) * (seasonalMultiplier >= 1.4 ? 1.25 : 1.0));

        String reason = buildRiskReason(type, seasonalMultiplier, weatherMultiplier, histCount, weather);

        return new DisasterTypeRisk(
                type,
                formatTypeName(type),
                Math.round(compositeScore * 100.0) / 100.0,
                resolveRiskLevel(compositeScore),
                histCount,
                Math.round(avgSeverity * 10.0) / 10.0,
                Math.round(seasonalMultiplier * 100.0) / 100.0,
                Math.round(weatherMultiplier * 100.0) / 100.0,
                Math.round(volunteerGapRatio * 100.0) / 100.0,
                predictedVolunteers,
                reason
        );
    }

    private double severityToWeight(Severity s) {
        if (s == null) return 2.0;
        return switch (s) {
            case LOW -> 1.0;
            case MEDIUM -> 2.0;
            case HIGH -> 3.0;
            case CRITICAL -> 4.0;
        };
    }

    private double computeSeasonalMultiplier(EventType type, String divisionName, int month) {
        String div = divisionName.toLowerCase(Locale.ROOT);
        boolean isCoastal = div.contains("chattogram") || div.contains("chittagong")
                || div.contains("barishal") || div.contains("barisal")
                || div.contains("khulna");
        boolean isFlashFloodProne = div.contains("sylhet") || div.contains("rangpur") || div.contains("mymensingh");

        return switch (type) {
            case FLOOD -> {
                // Monsoon: June(6) to September(9)
                if (month >= 6 && month <= 9) {
                    yield isFlashFloodProne ? 1.95 : 1.70;
                } else if (month == 5 || month == 10) {
                    yield 1.30;
                }
                yield 0.75;
            }
            case CYCLONE -> {
                // Pre-monsoon (April-May) and Post-monsoon (October-November)
                if (month == 4 || month == 5 || month == 10 || month == 11) {
                    yield isCoastal ? 1.90 : 1.30;
                }
                yield isCoastal ? 1.10 : 0.70;
            }
            case FIRE -> {
                // Dry hot season: February to May
                if (month >= 2 && month <= 5) {
                    yield div.contains("dhaka") ? 1.75 : 1.50;
                }
                yield 0.90;
            }
            case EARTHQUAKE -> {
                // Tectonic risk in northeastern faultline
                if (div.contains("sylhet") || div.contains("chattogram") || div.contains("chittagong")) {
                    yield 1.35;
                }
                yield 1.0;
            }
            case PANDEMIC -> {
                // Post-monsoon waterborne disease surges
                if (month >= 7 && month <= 10) {
                    yield 1.35;
                }
                yield 0.95;
            }
            default -> 1.0;
        };
    }

    private double computeWeatherMultiplier(EventType type, WeatherTelemetry weather) {
        if (weather == null) return 1.0;

        double multiplier = 1.0;

        switch (type) {
            case FLOOD -> {
                if (weather.precipitation() > 25.0) multiplier += 0.50;
                else if (weather.precipitation() > 10.0) multiplier += 0.30;
                else if (weather.precipitation() > 0.0) multiplier += 0.15;
            }
            case CYCLONE -> {
                if (weather.windSpeed() > 50.0) multiplier += 0.60;
                else if (weather.windSpeed() > 30.0) multiplier += 0.35;
                else if (weather.windSpeed() > 20.0) multiplier += 0.15;
            }
            case FIRE -> {
                if (weather.temperature() > 37.0 && weather.relativeHumidity() < 45) multiplier += 0.45;
                else if (weather.temperature() > 34.0) multiplier += 0.20;
            }
            default -> {}
        }

        return Math.min(2.0, Math.max(0.70, multiplier));
    }

    private double computeVolunteerGap(List<DisasterEvent> typeEvents, long availableVolunteers) {
        if (typeEvents.isEmpty()) {
            return availableVolunteers < 10 ? 0.60 : 0.25;
        }

        double totalDeficit = 0.0;
        int count = 0;

        for (DisasterEvent e : typeEvents) {
            int req = e.getRequiredVolunteers() != null ? e.getRequiredVolunteers() : 20;
            long joined = participationRepository.countByEvent(e);
            double deficit = Math.max(0.0, (double) (req - joined) / Math.max(1, req));
            totalDeficit += deficit;
            count++;
        }

        double avgDeficit = count > 0 ? (totalDeficit / count) : 0.3;
        if (availableVolunteers < 15) {
            avgDeficit = Math.min(1.0, avgDeficit + 0.25);
        }
        return Math.min(1.0, Math.max(0.10, avgDeficit));
    }

    private String resolveRiskLevel(double score) {
        if (score >= 0.70) return "CRITICAL";
        if (score >= 0.50) return "HIGH";
        if (score >= 0.30) return "MODERATE";
        return "LOW";
    }

    private String formatTypeName(EventType type) {
        return switch (type) {
            case FLOOD -> "Flash & River Flood";
            case CYCLONE -> "Tropical Cyclone / Surge";
            case EARTHQUAKE -> "Seismic Tremor / Earthquake";
            case FIRE -> "Urban & Wild Fire";
            case PANDEMIC -> "Disease Outbreak / Epidemic";
            default -> type.name();
        };
    }

    private String buildRiskReason(EventType type, double season, double weatherMult, int histCount, WeatherTelemetry w) {
        StringBuilder sb = new StringBuilder();
        if (weatherMult >= 1.30) {
            if (type == EventType.FLOOD) sb.append(String.format("High precipitation (%.1fmm). ", w.precipitation()));
            else if (type == EventType.CYCLONE) sb.append(String.format("High wind velocity (%.1f km/h). ", w.windSpeed()));
            else if (type == EventType.FIRE) sb.append(String.format("Extreme temperature (%.1f°C). ", w.temperature()));
        }

        if (season >= 1.50) {
            sb.append("Current calendar month is peak seasonal hazard window. ");
        } else if (season >= 1.20) {
            sb.append("Elevated seasonal vulnerability. ");
        }

        if (histCount > 0) {
            sb.append(String.format("%d recorded historical events in this territory.", histCount));
        } else {
            sb.append("Baseline demographic modeling applied.");
        }

        return sb.toString().trim();
    }

    private String generateRecommendation(
            String divisionName,
            EventType threat,
            String level,
            WeatherTelemetry weather,
            long availableVolunteers,
            int neededVolunteers
    ) {
        long deficit = neededVolunteers - availableVolunteers;
        String deficitNote = deficit > 0
                ? String.format("Mobilize an additional %d certified volunteers from neighboring divisions.", deficit)
                : "Local active volunteer pool is currently sufficient to handle baseline surges.";

        return switch (threat) {
            case FLOOD -> String.format(
                    "High flood preparedness alert for %s. Live precipitation is %.1f mm (%s). Pre-stage rescue boats, emergency dry rations, and water purification units. %s",
                    divisionName, weather.precipitation(), weather.condition(), deficitNote
            );
            case CYCLONE -> String.format(
                    "Coastal cyclone vigilance recommended for %s. Current wind speed recorded at %.1f km/h. Inspect shelter structural integrity and prepare evacuation transports. %s",
                    divisionName, weather.windSpeed(), deficitNote
            );
            case FIRE -> String.format(
                    "Elevated fire hazard in %s due to dry ambient conditions (%.1f°C, %d%% humidity). Pre-position first responder medical kits and verify hydrant access. %s",
                    divisionName, weather.temperature(), weather.relativeHumidity(), deficitNote
            );
            case EARTHQUAKE -> String.format(
                    "Maintain search-and-rescue readiness in %s faultline zone. Ensure trauma response volunteer teams are on stand-by with valid certifications. %s",
                    divisionName, deficitNote
            );
            case PANDEMIC -> String.format(
                    "Hygiene and healthcare response advisory for %s. Distribute emergency sanitation kits and medical supplies. %s",
                    divisionName, deficitNote
            );
            default -> String.format(
                    "Maintain standard situational monitoring across %s. Current status: %s. %s",
                    divisionName, level, deficitNote
            );
        };
    }
}

