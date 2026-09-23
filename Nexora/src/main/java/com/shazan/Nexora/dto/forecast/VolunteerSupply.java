package com.shazan.Nexora.dto.forecast;

import java.util.List;

public record VolunteerSupply(
        long activeVolunteers,
        long currentlyDeployed,
        long availableVolunteers,
        List<String> topSkills
) {}

