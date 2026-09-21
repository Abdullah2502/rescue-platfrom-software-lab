package com.shazan.Nexora.domain.operations;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.InventoryCategory;
import com.shazan.Nexora.domain.ngo.Ngo;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ngo_id", nullable = false)
    private Ngo ngo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id")
    private Shelter shelter;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InventoryCategory category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 40)
    private String unit;

    @Column(name = "reorder_level", nullable = false, precision = 14, scale = 2)
    private BigDecimal reorderLevel;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(length = 1000)
    private String notes;

    @Column(name = "client_reference", unique = true, length = 80)
    private String clientReference;
}
