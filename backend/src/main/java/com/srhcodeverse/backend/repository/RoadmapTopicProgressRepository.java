package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.RoadmapEnrollment;
import com.srhcodeverse.backend.entity.RoadmapTopic;
import com.srhcodeverse.backend.entity.RoadmapTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoadmapTopicProgressRepository extends JpaRepository<RoadmapTopicProgress, Long> {
    List<RoadmapTopicProgress> findByEnrollment(RoadmapEnrollment enrollment);
    Optional<RoadmapTopicProgress> findByEnrollmentAndTopic(RoadmapEnrollment enrollment, RoadmapTopic topic);
    long countByEnrollmentAndCompletedTrue(RoadmapEnrollment enrollment);
    void deleteByEnrollment(RoadmapEnrollment enrollment);
}
