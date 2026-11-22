package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_attempts",
        indexes = {
                @Index(name = "idx_certificate_attempt_user", columnList = "user_id"),
                @Index(name = "idx_certificate_attempt_definition", columnList = "definition_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "definition_id", nullable = false)
    private CertificateDefinition definition;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

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

    @Column(nullable = false)
    @Builder.Default
    private Boolean passed = false;

    @PrePersist
    void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
    }
}
