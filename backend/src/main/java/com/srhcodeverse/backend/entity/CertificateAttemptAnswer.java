package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certificate_attempt_answers",
        uniqueConstraints = @UniqueConstraint(name = "uk_attempt_question", columnNames = {"attempt_id", "question_id"}),
        indexes = @Index(name = "idx_certificate_answer_attempt", columnList = "attempt_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateAttemptAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private CertificateAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private CertificateQuestion question;

    @Column(name = "selected_option")
    private Integer selectedOption;

    @Column
    private Boolean correct;
}
