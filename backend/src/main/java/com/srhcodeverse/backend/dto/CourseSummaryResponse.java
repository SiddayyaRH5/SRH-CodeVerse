package com.srhcodeverse.backend.dto;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseSummaryResponse {
    Long id;
    String slug;
    String title;
    String shortDescription;
    String category;
    String difficulty;
    String level;
    String thumbnail;
    String thumbnailUrl;
    String instructor;
    String courseType;
    BigDecimal price;
    String currency;
    Boolean paid;
    Boolean published;
    Boolean enrollmentEnabled;
    Integer estimatedDurationMinutes;
    Integer lessonCount;
    Integer problemCount;
    Integer progressPercent;
}
