package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.LessonBookmark;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonBookmarkRepository extends JpaRepository<LessonBookmark, Long> {
    List<LessonBookmark> findByUserOrderByCreatedAtDesc(User user);
    Optional<LessonBookmark> findByUserAndLesson(User user, CourseLesson lesson);
    boolean existsByUserAndLesson(User user, CourseLesson lesson);
    void deleteByUserAndLesson(User user, CourseLesson lesson);
    long countByUser(User user);
}
