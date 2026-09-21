package com.shazan.Nexora.repository.operations;

import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByNgoAndActiveTrueOrderByNameAsc(Ngo ngo);
    List<InventoryItem> findAllByActiveTrueOrderByNameAsc();
    Optional<InventoryItem> findByClientReference(String clientReference);
}
