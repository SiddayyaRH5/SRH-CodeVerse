package com.srh.codeverse.repository;

import com.srh.codeverse.entity.TaskItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskItemRepository extends JpaRepository<TaskItem, String> {
    List<TaskItem> findByOrgIdOrderByUpdatedAtDesc(String orgId);
    Optional<TaskItem> findByIdAndOrgId(String id, String orgId);
    long countByOrgId(String orgId);
    long countByOrgIdAndStatus(String orgId, String status);
}
