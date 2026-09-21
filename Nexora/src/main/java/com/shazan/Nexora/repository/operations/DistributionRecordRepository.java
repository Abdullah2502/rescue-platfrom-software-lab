package com.shazan.Nexora.repository.operations;

import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.DistributionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistributionRecordRepository extends JpaRepository<DistributionRecord, Long> {
    List<DistributionRecord> findAllByNgoAndActiveTrueOrderByDistributedAtDesc(Ngo ngo);
    List<DistributionRecord> findAllByActiveTrueOrderByDistributedAtDesc();
    Optional<DistributionRecord> findByClientReference(String clientReference);
}
