package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.CourseProject;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CourseProjectRepository extends JpaRepository<CourseProject,Long>{ List<CourseProject> findByCourseOrderByIdAsc(Course course); }
