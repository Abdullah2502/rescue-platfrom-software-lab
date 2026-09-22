package com.shazan.Nexora.domain.chat;

import com.shazan.Nexora.common.BaseEntity;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.event.DisasterEvent;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_event", columnList = "event_id"),
        @Index(name = "idx_chat_messages_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * If event is null, this is a GLOBAL platform message.
     * If event is not null, this message belongs to that specific disaster event's operations chat.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private DisasterEvent event;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 32)
    private Role senderRole;

    @Column(name = "sender_name", nullable = false, length = 150)
    private String senderName;

    @Column(name = "sender_email", length = 150)
    private String senderEmail;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "pinned_by", length = 150)
    private String pinnedBy;

    @Column(name = "pinned_at")
    private Instant pinnedAt;
}

