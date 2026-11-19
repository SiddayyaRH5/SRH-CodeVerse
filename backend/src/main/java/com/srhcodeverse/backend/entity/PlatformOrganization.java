package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_organizations", indexes = {
    @Index(name = "idx_platform_org_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlatformOrganization {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(nullable = false, unique = true, length = 180)
    private String slug;
    @Column(length = 1000)
    private String description;
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";
    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
