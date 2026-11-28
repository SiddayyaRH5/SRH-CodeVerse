package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Notification;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    Optional<Notification> findByIdAndRecipient(Long id, User recipient);

    long countByRecipientAndReadFalse(User recipient);
}
