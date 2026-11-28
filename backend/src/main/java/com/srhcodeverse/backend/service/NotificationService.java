package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.NotificationResponse;
import com.srhcodeverse.backend.entity.Notification;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.NotificationRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationService(UserRepository userRepository,
                               NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String username) {
        User user = user(username);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markRead(String username, Long notificationId) {
        User user = user(username);
        Notification notification = notificationRepository.findByIdAndRecipient(notificationId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Notification not found"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllRead(String username) {
        User user = user(username);
        List<Notification> unread = notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream().filter(notification -> !notification.isRead()).toList();
        unread.forEach(notification -> notification.setRead(true));
        if (!unread.isEmpty()) notificationRepository.saveAll(unread);
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getCategory(),
                n.getTitle(),
                n.getBody(),
                n.getCreatedAt() == null ? null : n.getCreatedAt().toString(),
                n.isRead(),
                n.getLink());
    }
}
