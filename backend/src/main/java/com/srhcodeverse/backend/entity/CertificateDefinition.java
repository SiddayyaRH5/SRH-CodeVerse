package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certificate_definitions",
        uniqueConstraints = @UniqueConstraint(name = "uk_certificate_slug", columnNames = "slug"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateDefinition {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(length = 40)
    private String icon;

    @Column(length = 80)
    private String accent;

    @Column(columnDefinition = "TEXT")
    private String skills;

    /** Comma separated course slugs that contribute to the lesson requirement. */
    @Column(name = "required_course_slugs", columnDefinition = "TEXT")
    private String requiredCourseSlugs;

    @Column(name = "required_lesson_percent", nullable = false)
    @Builder.Default
    private Integer requiredLessonPercent = 80;

    @Column(name = "required_solved_problems", nullable = false)
    @Builder.Default
    private Integer requiredSolvedProblems = 0;

    /** Comma separated topic fragments counted for the solved problem requirement. */
    @Column(name = "required_problem_topics", columnDefinition = "TEXT")
    private String requiredProblemTopics;

    @Column(name = "required_interview_category", length = 40)
    private String requiredInterviewCategory;

    @Column(name = "required_interview_score", nullable = false)
    @Builder.Default
    private Integer requiredInterviewScore = 0;

    @Column(name = "assessment_pass_score", nullable = false)
    @Builder.Default
    private Integer assessmentPassScore = 70;

    @Column(name = "assessment_question_count", nullable = false)
    @Builder.Default
    private Integer assessmentQuestionCount = 10;

    @Column(name = "assessment_duration_minutes", nullable = false)
    @Builder.Default
    private Integer assessmentDurationMinutes = 20;

    @Column(name = "attempt_limit", nullable = false)
    @Builder.Default
    private Integer attemptLimit = 5;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
