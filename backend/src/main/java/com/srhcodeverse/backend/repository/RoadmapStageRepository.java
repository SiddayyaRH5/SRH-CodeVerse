package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Roadmap;
import com.srhcodeverse.backend.entity.RoadmapStage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadmapStageRepository extends JpaRepository<RoadmapStage, Long> {
    List<RoadmapStage> findByRoadmapOrderByStageOrderAsc(Roadmap roadmap);
    long countByRoadmap(Roadmap roadmap);
}
