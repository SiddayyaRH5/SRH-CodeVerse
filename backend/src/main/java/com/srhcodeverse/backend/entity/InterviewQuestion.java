package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_questions",
        indexes = {
                @Index(name = "idx_interview_question_category", columnList = "category"),
                @Index(name = "idx_interview_question_difficulty", columnList = "difficulty")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 80)
    private String topic;

    @Column(nullable = false, length = 20)
    private String difficulty;

    /** MCQ, SHORT, SQL, HR, CODING */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    /** JSON array of option strings for MCQ questions. */
    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson;

    /** Zero based index of the correct option for MCQ questions. */
    @Column(name = "correct_option")
    private Integer correctOption;

    @Column(name = "reference_answer", columnDefinition = "TEXT")
    private String referenceAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    /** Comma separated accepted keywords used by the deterministic rubric. */
    @Column(columnDefinition = "TEXT")
    private String rubric;

    @Column(nullable = false)
    @Builder.Default
    private Integer points = 1;

    @Column(name = "code_problem_id")
    private Long codeProblemId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
