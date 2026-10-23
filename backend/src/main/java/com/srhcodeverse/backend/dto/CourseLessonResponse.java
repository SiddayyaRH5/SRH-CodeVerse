package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseLessonResponse { Long id; String moduleName; Integer moduleOrder; Integer lessonOrder; String title; String description; Integer estimatedMinutes; boolean completed; }
