package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmap_stages",
        uniqueConstraints = @UniqueConstraint(name = "uk_roadmap_stage_order", columnNames = {"roadmap_id", "stage_order"}),
        indexes = @Index(name = "idx_roadmap_stage_roadmap", columnList = "roadmap_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoadmapStage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private Roadmap roadmap;

    @Column(name = "stage_order", nullable = false)
    private Integer stageOrder;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    /** Comma separated stage orders that must be completed first. */
    @Column(name = "prerequisite_orders", length = 120)
    private String prerequisiteOrders;

    @Column(name = "completion_criteria", columnDefinition = "TEXT")
    private String completionCriteria;
}
