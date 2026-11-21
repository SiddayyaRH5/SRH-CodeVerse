package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, String> {
    List<Team> findByOrgId(String orgId);
    Optional<Team> findByIdAndOrgId(String id, String orgId);
    long countByOrgId(String orgId);
}
