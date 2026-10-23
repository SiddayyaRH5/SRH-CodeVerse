package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="course_progress", uniqueConstraints=@UniqueConstraint(name="uk_user_course_progress", columnNames={"user_id","course_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseProgress {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false) private User user;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="course_id", nullable=false) private Course course;
    @Column(columnDefinition="TEXT") private String completedLessonIds;
    private Long currentLessonId;
    private Integer xpEarned;
    private LocalDateTime updatedAt;
    @PrePersist @PreUpdate void touch(){ updatedAt=LocalDateTime.now(); }
}
