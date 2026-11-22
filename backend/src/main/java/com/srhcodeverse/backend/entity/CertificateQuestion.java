package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certificate_questions",
        indexes = @Index(name = "idx_certificate_question_definition", columnList = "definition_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "definition_id", nullable = false)
    private CertificateDefinition definition;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(name = "options_json", columnDefinition = "TEXT", nullable = false)
    private String optionsJson;

    @Column(name = "correct_option", nullable = false)
    private Integer correctOption;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
