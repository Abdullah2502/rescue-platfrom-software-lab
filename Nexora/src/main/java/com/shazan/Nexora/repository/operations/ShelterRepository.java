package com.shazan.Nexora.repository.operations;

import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.operations.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {
    List<Shelter> findAllByNgoAndActiveTrueOrderByNameAsc(Ngo ngo);
    List<Shelter> findAllByActiveTrueOrderByNameAsc();
    Optional<Shelter> findByClientReference(String clientReference);
}
