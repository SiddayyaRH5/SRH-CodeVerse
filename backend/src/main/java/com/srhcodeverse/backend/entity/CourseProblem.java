package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="course_problems")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseProblem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="course_id", nullable=false) private Course course;
    @Column(nullable=false) private String title;
    @Column(columnDefinition="TEXT", nullable=false) private String statement;
    @Column(columnDefinition="TEXT", nullable=false) private String description;
    @Column(nullable=false) private String difficulty;
    @Column(nullable=false) private String topic;
    @Column(columnDefinition="TEXT") private String tags;
    @Column(columnDefinition="TEXT") private String expectedInput;
    @Column(columnDefinition="TEXT") private String expectedOutput;
    @Column(columnDefinition="TEXT") private String exampleInput;
    @Column(columnDefinition="TEXT") private String exampleOutput;
    @Column(columnDefinition="TEXT") private String explanation;
    @Column(columnDefinition="TEXT") private String constraintsText;
    @Column(columnDefinition="TEXT") private String starterCode;
    @Column(columnDefinition="TEXT") private String solution;
    private Integer xp;
    private Integer estimatedTimeMinutes;
}
