package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Roadmap;
import com.srhcodeverse.backend.entity.RoadmapEnrollment;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoadmapEnrollmentRepository extends JpaRepository<RoadmapEnrollment, Long> {
    Optional<RoadmapEnrollment> findByUserAndRoadmap(User user, Roadmap roadmap);
    List<RoadmapEnrollment> findByUserOrderByEnrolledAtDesc(User user);
    boolean existsByUserAndRoadmap(User user, Roadmap roadmap);
    long countByUserAndStatus(User user, String status);
}
