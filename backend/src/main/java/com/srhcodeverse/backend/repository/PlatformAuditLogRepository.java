package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.PlatformAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformAuditLogRepository extends JpaRepository<PlatformAuditLog, Long> {
    Page<PlatformAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
