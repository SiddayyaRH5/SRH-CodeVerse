package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseSummaryResponse { Long id; String slug; String title; String shortDescription; String category; String difficulty; String level; String thumbnail; Integer estimatedDurationMinutes; Integer lessonCount; Integer problemCount; Integer progressPercent; }
