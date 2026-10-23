package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="course_lessons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseLesson {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="course_id", nullable=false) private Course course;
    @Column(nullable=false) private String moduleName;
    @Column(nullable=false) private Integer moduleOrder;
    @Column(nullable=false) private Integer lessonOrder;
    @Column(nullable=false) private String title;
    @Column(columnDefinition="TEXT", nullable=false) private String description;
    private Integer estimatedMinutes;
}
