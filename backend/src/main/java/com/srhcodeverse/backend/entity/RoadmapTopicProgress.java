package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "roadmap_topic_progress",
        uniqueConstraints = @UniqueConstraint(name = "uk_enrollment_topic", columnNames = {"enrollment_id", "topic_id"}),
        indexes = @Index(name = "idx_roadmap_progress_enrollment", columnList = "enrollment_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoadmapTopicProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private RoadmapEnrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private RoadmapTopic topic;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
