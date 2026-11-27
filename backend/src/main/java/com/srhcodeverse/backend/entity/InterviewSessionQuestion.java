package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_session_questions",
        uniqueConstraints = @UniqueConstraint(name = "uk_session_question", columnNames = {"session_id", "question_id"}),
        indexes = @Index(name = "idx_session_question_session", columnList = "session_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSessionQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private InterviewQuestion question;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "selected_option")
    private Integer selectedOption;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(nullable = false)
    @Builder.Default
    private Boolean flagged = false;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column
    private Boolean correct;

    @Column(name = "awarded_points")
    private Integer awardedPoints;

    /** SCORED, SELF_REVIEW, UNANSWERED */
    @Column(name = "review_status", length = 20)
    private String reviewStatus;
}
