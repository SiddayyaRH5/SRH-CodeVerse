package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="course_resources")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseResource {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="course_id", nullable=false) private Course course;
    @Column(nullable=false) private String title;
    @Column(nullable=false) private String provider;
    @Column(nullable=false, length=1000) private String url;
    @Column(nullable=false) private String type;
    @Column(nullable=false) private boolean free;
    @Column(columnDefinition="TEXT") private String description;
}
