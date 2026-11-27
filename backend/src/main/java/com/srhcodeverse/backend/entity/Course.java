package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

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
    private String instructor;
    private Integer estimatedDurationMinutes;
    private Integer lessonCount;
    private Integer problemCount;
    @Column(columnDefinition="TEXT") private String learningObjectives;
    @Column(columnDefinition="TEXT") private String prerequisites;
    @Column(columnDefinition="TEXT") private String skillsGained;

    // Additive columns with SQL defaults so existing production rows stay valid
    // when Hibernate runs ddl-auto=update. Legacy rows are treated as FREE.
    @Builder.Default
    @Column(length=16, columnDefinition="varchar(16) default 'FREE'")
    private String courseType = "FREE";

    @Builder.Default
    @Column(precision=12, scale=2, columnDefinition="decimal(12,2) default 0.00")
    private BigDecimal price = BigDecimal.ZERO;

    @Builder.Default
    @Column(length=3, columnDefinition="varchar(3) default 'INR'")
    private String currency = "INR";

    @Builder.Default
    @Column(columnDefinition="boolean default true")
    private Boolean published = Boolean.TRUE;

    @Builder.Default
    @Column(columnDefinition="boolean default true")
    private Boolean enrollmentEnabled = Boolean.TRUE;
}
