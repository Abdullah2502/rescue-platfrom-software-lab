package com.shazan.Nexora.domain.chat;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.event.DisasterEvent;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "chat_read_receipts", indexes = {
        @Index(name = "idx_chat_read_receipt_user", columnList = "user_id, user_role"),
        @Index(name = "idx_chat_read_receipt_event", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatReadReceipt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false, length = 32)
    private Role userRole;

    /**
     * If event is null, this receipt tracks GLOBAL platform chat.
     * If event is not null, this receipt tracks the given Disaster Event's operations chat.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private DisasterEvent event;

    @Column(name = "last_read_message_id", nullable = false)
    private Long lastReadMessageId;

    @Column(name = "last_read_at", nullable = false)
    private Instant lastReadAt;
}
