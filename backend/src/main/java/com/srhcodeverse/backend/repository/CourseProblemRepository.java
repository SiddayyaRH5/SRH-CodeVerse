package com.srhcodeverse.backend.repository;
import com.srhcodeverse.backend.entity.CourseProblem;
import com.srhcodeverse.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CourseProblemRepository extends JpaRepository<CourseProblem,Long>{ List<CourseProblem> findByCourseOrderByIdAsc(Course course); }
