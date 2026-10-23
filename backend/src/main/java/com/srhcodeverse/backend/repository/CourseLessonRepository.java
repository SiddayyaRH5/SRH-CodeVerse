package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CourseLessonRepository extends JpaRepository<CourseLesson,Long>{ List<CourseLesson> findByCourseOrderByModuleOrderAscLessonOrderAsc(Course course); }
