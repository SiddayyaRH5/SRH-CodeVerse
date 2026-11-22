package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.LessonNote;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonNoteRepository extends JpaRepository<LessonNote, Long> {
    Optional<LessonNote> findByUserAndLesson(User user, CourseLesson lesson);
    List<LessonNote> findByUserOrderByUpdatedAtDesc(User user);
}
