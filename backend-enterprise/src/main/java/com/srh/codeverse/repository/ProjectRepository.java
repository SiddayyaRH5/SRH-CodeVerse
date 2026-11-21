package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByOrgId(String orgId);
    Optional<Project> findByIdAndOrgId(String id, String orgId);
    boolean existsByOrgIdAndTeamId(String orgId, String teamId);
    long countByOrgId(String orgId);
    long countByStatus(String status);
}
