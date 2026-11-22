package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions",
        indexes = {
                @Index(name = "idx_interview_session_user", columnList = "user_id"),
                @Index(name = "idx_interview_session_status", columnList = "status")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 20)
    private String difficulty;

    @Column(nullable = false, length = 20)
    private String mode;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    /** IN_PROGRESS, SUBMITTED, EXPIRED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "IN_PROGRESS";

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "score_percent")
    private Integer scorePercent;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "scored_questions")
    private Integer scoredQuestions;

    @Column(name = "earned_points")
    private Integer earnedPoints;

    @Column(name = "max_points")
    private Integer maxPoints;

    @PrePersist
    void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
    }
}
