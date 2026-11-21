package com.srh.codeverse.repository;

import com.srh.codeverse.entity.WorkspaceNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<WorkspaceNotification, String> {
    List<WorkspaceNotification> findByOrgIdOrderByCreatedAtDesc(String orgId);
    List<WorkspaceNotification> findByOrgIdAndRecipientIdOrderByCreatedAtDesc(String orgId, String recipientId);
    Optional<WorkspaceNotification> findByIdAndOrgId(String id, String orgId);
}
