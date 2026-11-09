package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.CourseProgress;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CourseProgressRepository extends JpaRepository<CourseProgress,Long>{ Optional<CourseProgress> findByUserAndCourse(User user, Course course); }
