package com.shazan.Nexora.service.operations;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.DistributionStatus;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.DistributionRecord;
import com.shazan.Nexora.domain.operations.InventoryItem;
import com.shazan.Nexora.domain.operations.Shelter;
import com.shazan.Nexora.dto.operations.*;
import com.shazan.Nexora.repository.operations.DistributionRecordRepository;
import com.shazan.Nexora.repository.operations.InventoryItemRepository;
import com.shazan.Nexora.repository.operations.ShelterRepository;
import com.shazan.Nexora.security.CurrentUser;
import com.shazan.Nexora.service.ngo.NgoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OperationsService {

    private final ShelterRepository shelterRepository;
    private final InventoryItemRepository inventoryRepository;
    private final DistributionRecordRepository distributionRepository;
    private final NgoService ngoService;

    @Transactional(readOnly = true)
    public List<ShelterResponse> listShelters() {
        return visibleShelters().stream().map(this::toShelterResponse).toList();
    }

    @Transactional
    public ShelterResponse createShelter(ShelterRequest request) {
        Ngo ngo = ngoService.currentNgo();
        if (request.clientReference() != null && !request.clientReference().isBlank()) {
            var existing = shelterRepository.findByClientReference(request.clientReference());
            if (existing.isPresent()) return toShelterResponse(requireOwner(existing.get(), ngo));
        }
        validateShelterCapacity(request.capacity(), request.currentOccupancy());
        Shelter shelter = Shelter.builder()
                .ngo(ngo)
                .name(request.name().trim())
                .address(request.address().trim())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .capacity(request.capacity())
                .currentOccupancy(request.currentOccupancy())
                .contactName(request.contactName().trim())
                .contactPhone(request.contactPhone().trim())
                .status(request.status())
                .notes(request.notes())
                .clientReference(blankToNull(request.clientReference()))
                .build();
        return toShelterResponse(shelterRepository.save(shelter));
    }

    @Transactional
    public ShelterResponse updateShelter(Long id, ShelterRequest request) {
        Ngo ngo = ngoService.currentNgo();
        Shelter shelter = requireOwner(loadShelter(id), ngo);
        validateShelterCapacity(request.capacity(), request.currentOccupancy());
        shelter.setName(request.name().trim());
        shelter.setAddress(request.address().trim());
        shelter.setLatitude(request.latitude());
        shelter.setLongitude(request.longitude());
        shelter.setCapacity(request.capacity());
        shelter.setCurrentOccupancy(request.currentOccupancy());
        shelter.setContactName(request.contactName().trim());
        shelter.setContactPhone(request.contactPhone().trim());
        shelter.setStatus(request.status());
        shelter.setNotes(request.notes());
        return toShelterResponse(shelterRepository.save(shelter));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> listInventory() {
        return visibleInventory().stream().map(this::toInventoryResponse).toList();
    }

    @Transactional
    public InventoryItemResponse createInventoryItem(InventoryItemRequest request) {
        Ngo ngo = ngoService.currentNgo();
        if (request.clientReference() != null && !request.clientReference().isBlank()) {
            var existing = inventoryRepository.findByClientReference(request.clientReference());
            if (existing.isPresent()) return toInventoryResponse(requireOwner(existing.get(), ngo));
        }
        Shelter shelter = request.shelterId() == null ? null : requireOwner(loadShelter(request.shelterId()), ngo);
        InventoryItem item = InventoryItem.builder()
                .ngo(ngo)
                .shelter(shelter)
                .name(request.name().trim())
                .category(request.category())
                .quantity(request.quantity())
                .unit(request.unit().trim())
                .reorderLevel(request.reorderLevel())
                .expiryDate(request.expiryDate())
                .notes(request.notes())
                .clientReference(blankToNull(request.clientReference()))
                .build();
        return toInventoryResponse(inventoryRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse updateInventoryItem(Long id, InventoryItemRequest request) {
        Ngo ngo = ngoService.currentNgo();
        InventoryItem item = requireOwner(loadInventory(id), ngo);
        Shelter shelter = request.shelterId() == null ? null : requireOwner(loadShelter(request.shelterId()), ngo);
        item.setShelter(shelter);
        item.setName(request.name().trim());
        item.setCategory(request.category());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit().trim());
        item.setReorderLevel(request.reorderLevel());
        item.setExpiryDate(request.expiryDate());
        item.setNotes(request.notes());
        return toInventoryResponse(inventoryRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> listDistributions() {
        return visibleDistributions().stream().map(this::toDistributionResponse).toList();
    }

    @Transactional
    public DistributionResponse createDistribution(DistributionRequest request) {
        Ngo ngo = ngoService.currentNgo();
        if (request.clientReference() != null && !request.clientReference().isBlank()) {
            var existing = distributionRepository.findByClientReference(request.clientReference());
            if (existing.isPresent()) return toDistributionResponse(requireOwner(existing.get(), ngo));
        }
        InventoryItem item = requireOwner(loadInventory(request.inventoryItemId()), ngo);
        Shelter shelter = request.shelterId() == null ? null : requireOwner(loadShelter(request.shelterId()), ngo);
        if (request.status() == DistributionStatus.COMPLETED) deductInventory(item, request.quantity());
        DistributionRecord record = DistributionRecord.builder()
                .ngo(ngo)
                .shelter(shelter)
                .inventoryItem(item)
                .recipientGroup(request.recipientGroup().trim())
                .quantity(request.quantity())
                .distributedAt(request.distributedAt())
                .locationDescription(request.locationDescription().trim())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .status(request.status())
                .notes(request.notes())
                .clientReference(blankToNull(request.clientReference()))
                .build();
        inventoryRepository.save(item);
        return toDistributionResponse(distributionRepository.save(record));
    }

    @Transactional
    public DistributionResponse updateDistributionStatus(Long id, DistributionStatus status) {
        Ngo ngo = ngoService.currentNgo();
        DistributionRecord record = requireOwner(loadDistribution(id), ngo);
        DistributionStatus previous = record.getStatus();
        if (previous != DistributionStatus.COMPLETED && status == DistributionStatus.COMPLETED) {
            deductInventory(record.getInventoryItem(), record.getQuantity());
        } else if (previous == DistributionStatus.COMPLETED && status != DistributionStatus.COMPLETED) {
            record.getInventoryItem().setQuantity(record.getInventoryItem().getQuantity().add(record.getQuantity()));
        }
        record.setStatus(status);
        inventoryRepository.save(record.getInventoryItem());
        return toDistributionResponse(distributionRepository.save(record));
    }

    @Transactional(readOnly = true)
    public OperationsSummaryResponse summary() {
        List<Shelter> shelters = visibleShelters();
        List<InventoryItem> inventory = visibleInventory();
        List<DistributionRecord> distributions = visibleDistributions();
        long openShelters = shelters.stream().filter(s -> s.getStatus().name().equals("OPEN")).count();
        long availableBeds = shelters.stream()
                .filter(s -> s.getStatus().name().equals("OPEN"))
                .mapToLong(s -> Math.max(0, s.getCapacity() - s.getCurrentOccupancy())).sum();
        long lowStock = inventory.stream().filter(i -> i.getQuantity().compareTo(i.getReorderLevel()) <= 0).count();
        List<DistributionRecord> completed = distributions.stream()
                .filter(d -> d.getStatus() == DistributionStatus.COMPLETED).toList();
        BigDecimal totalDistributed = completed.stream().map(DistributionRecord::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new OperationsSummaryResponse(openShelters, availableBeds, inventory.size(), lowStock,
                completed.size(), totalDistributed);
    }

    private List<Shelter> visibleShelters() {
        return isNgo() ? shelterRepository.findAllByNgoAndActiveTrueOrderByNameAsc(ngoService.currentNgo())
                : shelterRepository.findAllByActiveTrueOrderByNameAsc();
    }

    private List<InventoryItem> visibleInventory() {
        return isNgo() ? inventoryRepository.findAllByNgoAndActiveTrueOrderByNameAsc(ngoService.currentNgo())
                : inventoryRepository.findAllByActiveTrueOrderByNameAsc();
    }

    private List<DistributionRecord> visibleDistributions() {
        return isNgo() ? distributionRepository.findAllByNgoAndActiveTrueOrderByDistributedAtDesc(ngoService.currentNgo())
                : distributionRepository.findAllByActiveTrueOrderByDistributedAtDesc();
    }

    private boolean isNgo() {
        return Role.ROLE_NGO_ADMIN.name().equals(CurrentUser.require().role());
    }

    private void deductInventory(InventoryItem item, BigDecimal quantity) {
        if (item.getQuantity().compareTo(quantity) < 0) {
            throw ApiException.conflict("INSUFFICIENT_STOCK", "Distribution quantity exceeds available inventory");
        }
        item.setQuantity(item.getQuantity().subtract(quantity));
    }

    private void validateShelterCapacity(Integer capacity, Integer occupancy) {
        if (occupancy > capacity) {
            throw ApiException.badRequest("OCCUPANCY_EXCEEDS_CAPACITY", "Current occupancy cannot exceed shelter capacity");
        }
    }

    private Shelter loadShelter(Long id) {
        return shelterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("SHELTER_NOT_FOUND", "Shelter not found"));
    }

    private InventoryItem loadInventory(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("INVENTORY_NOT_FOUND", "Inventory item not found"));
    }

    private DistributionRecord loadDistribution(Long id) {
        return distributionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("DISTRIBUTION_NOT_FOUND", "Distribution record not found"));
    }

    private Shelter requireOwner(Shelter shelter, Ngo ngo) {
        if (!shelter.getNgo().getId().equals(ngo.getId())) throw notOwner();
        return shelter;
    }

    private InventoryItem requireOwner(InventoryItem item, Ngo ngo) {
        if (!item.getNgo().getId().equals(ngo.getId())) throw notOwner();
        return item;
    }

    private DistributionRecord requireOwner(DistributionRecord record, Ngo ngo) {
        if (!record.getNgo().getId().equals(ngo.getId())) throw notOwner();
        return record;
    }

    private ApiException notOwner() {
        return ApiException.forbidden("NOT_OPERATION_OWNER", "This operational record belongs to another NGO");
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ShelterResponse toShelterResponse(Shelter shelter) {
        return new ShelterResponse(shelter.getId(), shelter.getNgo().getId(), shelter.getNgo().getName(),
                shelter.getName(), shelter.getAddress(), shelter.getLatitude(), shelter.getLongitude(),
                shelter.getCapacity(), shelter.getCurrentOccupancy(), shelter.getContactName(),
                shelter.getContactPhone(), shelter.getStatus(), shelter.getNotes(), shelter.getUpdatedAt());
    }

    private InventoryItemResponse toInventoryResponse(InventoryItem item) {
        return new InventoryItemResponse(item.getId(), item.getNgo().getId(), item.getNgo().getName(),
                item.getShelter() == null ? null : item.getShelter().getId(),
                item.getShelter() == null ? null : item.getShelter().getName(), item.getName(), item.getCategory(),
                item.getQuantity(), item.getUnit(), item.getReorderLevel(),
                item.getQuantity().compareTo(item.getReorderLevel()) <= 0, item.getExpiryDate(), item.getNotes(),
                item.getUpdatedAt());
    }

    private DistributionResponse toDistributionResponse(DistributionRecord record) {
        return new DistributionResponse(record.getId(), record.getNgo().getId(), record.getNgo().getName(),
                record.getShelter() == null ? null : record.getShelter().getId(),
                record.getShelter() == null ? null : record.getShelter().getName(),
                record.getInventoryItem().getId(), record.getInventoryItem().getName(),
                record.getInventoryItem().getUnit(), record.getRecipientGroup(), record.getQuantity(),
                record.getDistributedAt(), record.getLocationDescription(), record.getLatitude(), record.getLongitude(),
                record.getStatus(), record.getNotes(), record.getCreatedAt());
    }
}
