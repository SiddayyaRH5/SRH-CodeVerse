package com.srhcodeverse.backend.dto;

public record AnnouncementResponse(
        Long id,
        String title,
        String audience,
        String author,
        String date) {
}
