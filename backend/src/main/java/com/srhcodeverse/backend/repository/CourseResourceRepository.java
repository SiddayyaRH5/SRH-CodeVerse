package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.CourseResource;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CourseResourceRepository extends JpaRepository<CourseResource,Long>{ List<CourseResource> findByCourseOrderByIdAsc(Course course); }
