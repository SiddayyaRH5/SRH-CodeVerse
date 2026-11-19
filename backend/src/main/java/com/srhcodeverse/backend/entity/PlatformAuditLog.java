package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_audit_logs", indexes = {
        @Index(name = "idx_platform_audit_created", columnList = "created_at"),
        @Index(name = "idx_platform_audit_actor", columnList = "actor_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlatformAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "actor_user_id") private Long actorUserId;
    @Column(name = "actor_username", length = 120) private String actorUsername;
    @Column(name = "action", nullable = false, length = 80) private String action;
    @Column(name = "target_type", length = 80) private String targetType;
    @Column(name = "target_id") private Long targetId;
    @Column(name = "details", length = 1000) private String details;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
