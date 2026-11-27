package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmap_topics",
        uniqueConstraints = @UniqueConstraint(name = "uk_roadmap_topic_order", columnNames = {"stage_id", "topic_order"}),
        indexes = @Index(name = "idx_roadmap_topic_stage", columnList = "stage_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoadmapTopic {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stage_id", nullable = false)
    private RoadmapStage stage;

    @Column(name = "topic_order", nullable = false)
    private Integer topicOrder;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "resource_title", length = 200)
    private String resourceTitle;

    @Column(name = "resource_url", length = 600)
    private String resourceUrl;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;
}
