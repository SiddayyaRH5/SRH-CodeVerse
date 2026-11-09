package com.srhcodeverse.backend.dto;
import lombok.*;
import java.util.List;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseDetailResponse { Long id; String slug; String title; String shortDescription; String detailedDescription; String category; String difficulty; String level; String thumbnail; Integer estimatedDurationMinutes; Integer lessonCount; Integer problemCount; List<String> learningObjectives; List<String> prerequisites; List<String> skillsGained; Integer progressPercent; Long currentLessonId; List<CourseLessonResponse> lessons; List<CourseResourceResponse> resources; List<CourseProjectResponse> projects; }
