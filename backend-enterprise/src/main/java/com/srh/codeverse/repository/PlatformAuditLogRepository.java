package com.srh.codeverse.repository;

import com.srh.codeverse.entity.PlatformAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformAuditLogRepository extends JpaRepository<PlatformAuditLog, String> {
    List<PlatformAuditLog> findTop100ByOrderByCreatedAtDesc();
    List<PlatformAuditLog> findTop50ByTargetIdOrderByCreatedAtDesc(String targetId);
}
