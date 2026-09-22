package com.shazan.Nexora.repository.chat;

import com.shazan.Nexora.domain.chat.ChatReadReceipt;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.event.DisasterEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatReadReceiptRepository extends JpaRepository<ChatReadReceipt, Long> {

    Optional<ChatReadReceipt> findByUserIdAndUserRoleAndEventIsNull(Long userId, Role userRole);

    Optional<ChatReadReceipt> findByUserIdAndUserRoleAndEvent(Long userId, Role userRole, DisasterEvent event);

    List<ChatReadReceipt> findAllByUserIdAndUserRole(Long userId, Role userRole);
}
