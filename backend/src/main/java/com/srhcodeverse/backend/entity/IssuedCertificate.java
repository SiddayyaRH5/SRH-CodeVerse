package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "issued_certificates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_issued_certificate_number", columnNames = "certificate_number"),
                @UniqueConstraint(name = "uk_issued_certificate_verification", columnNames = "verification_code"),
                @UniqueConstraint(name = "uk_user_certificate", columnNames = {"user_id", "definition_id"})
        },
        indexes = @Index(name = "idx_issued_certificate_user", columnList = "user_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IssuedCertificate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "definition_id", nullable = false)
    private CertificateDefinition definition;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 60)
    private String certificateNumber;

    @Column(name = "verification_code", nullable = false, unique = true, length = 80)
    private String verificationCode;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "score_percent")
    private Integer scorePercent;

    /** ACTIVE, REVOKED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
}
