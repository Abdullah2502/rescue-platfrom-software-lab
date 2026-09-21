package com.shazan.Nexora.domain.operations;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.DistributionStatus;
import com.shazan.Nexora.domain.ngo.Ngo;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "distribution_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistributionRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ngo_id", nullable = false)
    private Ngo ngo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id")
    private Shelter shelter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "recipient_group", nullable = false, length = 180)
    private String recipientGroup;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quantity;

    @Column(name = "distributed_at", nullable = false)
    private Instant distributedAt;

    @Column(name = "location_description", nullable = false, length = 300)
    private String locationDescription;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DistributionStatus status;

    @Column(length = 1000)
    private String notes;

    @Column(name = "client_reference", unique = true, length = 80)
    private String clientReference;
}
