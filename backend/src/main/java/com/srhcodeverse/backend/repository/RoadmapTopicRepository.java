package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.RoadmapStage;
import com.srhcodeverse.backend.entity.RoadmapTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadmapTopicRepository extends JpaRepository<RoadmapTopic, Long> {
    List<RoadmapTopic> findByStageOrderByTopicOrderAsc(RoadmapStage stage);
    List<RoadmapTopic> findByStageInOrderByStageStageOrderAscTopicOrderAsc(List<RoadmapStage> stages);
    long countByStage(RoadmapStage stage);
}
