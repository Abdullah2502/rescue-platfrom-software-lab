package com.shazan.Nexora.service.operations;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.DistributionStatus;
import com.shazan.Nexora.domain.enums.InventoryCategory;
import com.shazan.Nexora.domain.enums.ShelterStatus;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.InventoryItem;
import com.shazan.Nexora.domain.operations.DistributionRecord;
import com.shazan.Nexora.dto.operations.DistributionRequest;
import com.shazan.Nexora.dto.operations.ShelterRequest;
import com.shazan.Nexora.repository.operations.DistributionRecordRepository;
import com.shazan.Nexora.repository.operations.InventoryItemRepository;
import com.shazan.Nexora.repository.operations.ShelterRepository;
import com.shazan.Nexora.service.ngo.NgoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperationsServiceTest {

    @Mock ShelterRepository shelterRepository;
    @Mock InventoryItemRepository inventoryRepository;
    @Mock DistributionRecordRepository distributionRepository;
    @Mock NgoService ngoService;
    @InjectMocks OperationsService service;

    private Ngo ngo;
    private InventoryItem rice;

    @BeforeEach
    void setUp() {
        ngo = Ngo.builder().id(7L).name("Response Bangladesh").build();
        rice = InventoryItem.builder()
                .id(12L).ngo(ngo).name("Rice packs").category(InventoryCategory.FOOD)
                .quantity(new BigDecimal("100.00")).unit("packs").reorderLevel(new BigDecimal("20.00"))
                .build();
        when(ngoService.currentNgo()).thenReturn(ngo);
    }

    @Test
    void completedDistributionDeductsInventory() {
        when(inventoryRepository.findById(12L)).thenReturn(Optional.of(rice));
        when(distributionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var request = new DistributionRequest(null, 12L, "Flood affected families",
                new BigDecimal("35.00"), Instant.parse("2026-09-22T00:00:00Z"), "Ward 6 school",
                new BigDecimal("23.8103"), new BigDecimal("90.4125"), DistributionStatus.COMPLETED,
                null, "offline-1");

        var response = service.createDistribution(request);

        assertEquals(new BigDecimal("65.00"), rice.getQuantity());
        assertEquals(DistributionStatus.COMPLETED, response.status());
        verify(inventoryRepository).save(rice);
    }

    @Test
    void distributionCannotExceedAvailableInventory() {
        when(inventoryRepository.findById(12L)).thenReturn(Optional.of(rice));
        var request = new DistributionRequest(null, 12L, "Flood affected families",
                new BigDecimal("101.00"), Instant.now(), "Ward 6 school", null, null,
                DistributionStatus.COMPLETED, null, null);

        ApiException error = assertThrows(ApiException.class, () -> service.createDistribution(request));

        assertEquals("INSUFFICIENT_STOCK", error.getCode());
        verify(distributionRepository, never()).save(any());
    }

    @Test
    void shelterOccupancyCannotExceedCapacity() {
        var request = new ShelterRequest("School shelter", "Main road", new BigDecimal("23.7"),
                new BigDecimal("90.4"), 100, 101, "Coordinator", "01700000000",
                ShelterStatus.OPEN, null, null);

        ApiException error = assertThrows(ApiException.class, () -> service.createShelter(request));

        assertEquals("OCCUPANCY_EXCEEDS_CAPACITY", error.getCode());
        verify(shelterRepository, never()).save(any());
    }

    @Test
    void distributionStatusTransitionsKeepInventoryBalanced() {
        DistributionRecord record = DistributionRecord.builder()
                .id(18L).ngo(ngo).inventoryItem(rice).recipientGroup("Shelter residents")
                .quantity(new BigDecimal("25.00")).distributedAt(Instant.now())
                .locationDescription("School shelter").status(DistributionStatus.PLANNED).build();
        when(distributionRepository.findById(18L)).thenReturn(Optional.of(record));
        when(distributionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateDistributionStatus(18L, DistributionStatus.COMPLETED);
        assertEquals(new BigDecimal("75.00"), rice.getQuantity());

        service.updateDistributionStatus(18L, DistributionStatus.CANCELLED);
        assertEquals(new BigDecimal("100.00"), rice.getQuantity());
        verify(inventoryRepository, times(2)).save(rice);
    }
}
