package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="course_projects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseProject {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="course_id", nullable=false) private Course course;
    @Column(nullable=false) private String title;
    @Column(columnDefinition="TEXT", nullable=false) private String description;
    @Column(columnDefinition="TEXT") private String requirements;
    @Column(columnDefinition="TEXT") private String technologies;
    @Column(columnDefinition="TEXT") private String features;
    @Column(nullable=false) private String difficulty;
    @Column(columnDefinition="TEXT") private String outcome;
}
