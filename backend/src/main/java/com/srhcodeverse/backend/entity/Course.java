package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="courses", uniqueConstraints=@UniqueConstraint(name="uk_course_slug", columnNames="slug"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private String slug;
    @Column(nullable=false) private String title;
    @Column(length=500, nullable=false) private String shortDescription;
    @Column(columnDefinition="TEXT", nullable=false) private String detailedDescription;
    @Column(nullable=false) private String category;
    @Column(nullable=false) private String difficulty;
    @Column(nullable=false) private String level;
    private String thumbnail;
    private Integer estimatedDurationMinutes;
    private Integer lessonCount;
    private Integer problemCount;
    @Column(columnDefinition="TEXT") private String learningObjectives;
    @Column(columnDefinition="TEXT") private String prerequisites;
    @Column(columnDefinition="TEXT") private String skillsGained;
}
