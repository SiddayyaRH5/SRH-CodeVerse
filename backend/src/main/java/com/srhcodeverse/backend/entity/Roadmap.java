package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmaps",
        uniqueConstraints = @UniqueConstraint(name = "uk_roadmap_slug", columnNames = "slug"),
        indexes = @Index(name = "idx_roadmap_category", columnList = "category"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Roadmap {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(name = "short_description", nullable = false, length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false, length = 30)
    private String difficulty;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(length = 40)
    private String icon;

    @Column(length = 80)
    private String accent;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
