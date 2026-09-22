package com.shazan.Nexora.repository.chat;

import com.shazan.Nexora.domain.chat.ChatMessage;
import com.shazan.Nexora.domain.event.DisasterEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Find messages for Global Chat (event is null).
     * Pinned messages first, then sorted by creation date ascending.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.event IS NULL ORDER BY m.pinned DESC, m.createdAt ASC")
    List<ChatMessage> findGlobalMessages();

    /**
     * Find messages for a specific event operations chat.
     * Pinned messages first, then sorted by creation date ascending.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.event = :event ORDER BY m.pinned DESC, m.createdAt ASC")
    List<ChatMessage> findEventMessages(@Param("event") DisasterEvent event);

    long countByEvent(DisasterEvent event);

    java.util.Optional<ChatMessage> findFirstByEventIsNullOrderByIdDesc();

    java.util.Optional<ChatMessage> findFirstByEventOrderByIdDesc(DisasterEvent event);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.event IS NULL
          AND m.id > :lastReadId
          AND NOT (m.senderId = :userId AND m.senderRole = :userRole)
    """)
    long countUnreadGlobalMessages(@Param("lastReadId") Long lastReadId,
                                   @Param("userId") Long userId,
                                   @Param("userRole") com.shazan.Nexora.domain.enums.Role userRole);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.event IS NULL
          AND NOT (m.senderId = :userId AND m.senderRole = :userRole)
    """)
    long countAllUnreadGlobalMessages(@Param("userId") Long userId,
                                      @Param("userRole") com.shazan.Nexora.domain.enums.Role userRole);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.event = :event
          AND m.id > :lastReadId
          AND NOT (m.senderId = :userId AND m.senderRole = :userRole)
    """)
    long countUnreadEventMessages(@Param("event") DisasterEvent event,
                                  @Param("lastReadId") Long lastReadId,
                                  @Param("userId") Long userId,
                                  @Param("userRole") com.shazan.Nexora.domain.enums.Role userRole);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.event = :event
          AND NOT (m.senderId = :userId AND m.senderRole = :userRole)
    """)
    long countAllUnreadEventMessages(@Param("event") DisasterEvent event,
                                     @Param("userId") Long userId,
                                     @Param("userRole") com.shazan.Nexora.domain.enums.Role userRole);
}

