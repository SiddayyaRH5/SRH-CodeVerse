package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CourseRepository extends JpaRepository<Course,Long>{ Optional<Course> findBySlug(String slug); }
