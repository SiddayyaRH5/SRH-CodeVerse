package com.srhcodeverse.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CourseAdminRequest(
        @NotBlank String slug,
        @NotBlank String title,
        @NotBlank String shortDescription,
        String detailedDescription,
        @NotBlank String category,
        String difficulty,
        String level,
        String thumbnail,
        String instructor,
        Integer estimatedDurationMinutes,
        String courseType,
        @DecimalMin(value = "0", message = "price must not be negative") BigDecimal price,
        String currency,
        Boolean published,
        Boolean enrollmentEnabled) {
}
