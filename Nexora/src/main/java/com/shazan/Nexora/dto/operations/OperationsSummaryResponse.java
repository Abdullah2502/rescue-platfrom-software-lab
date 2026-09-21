package com.shazan.Nexora.dto.operations;

import java.math.BigDecimal;

public record OperationsSummaryResponse(
        long openShelters,
        long availableBeds,
        long inventoryItems,
        long lowStockItems,
        long completedDistributions,
        BigDecimal totalUnitsDistributed
) {}
