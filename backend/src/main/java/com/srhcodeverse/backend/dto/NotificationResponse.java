package com.srhcodeverse.backend.dto;

public record NotificationResponse(
        Long id,
        String category,
        String title,
        String body,
        String createdAt,
        boolean read,
        String link) {
}
