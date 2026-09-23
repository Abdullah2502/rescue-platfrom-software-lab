package com.shazan.Nexora.dto.forecast;

public record ResourceSnapshot(
        long totalShelters,
        long openShelters,
        long availableBeds,
        long totalInventoryItems,
        long lowStockItems
) {}

