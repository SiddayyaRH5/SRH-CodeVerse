package com.srhcodeverse.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AnnouncementRequest(
        @NotBlank String title,
        @NotBlank String body,
        @NotBlank String audience) {
}
