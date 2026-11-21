package com.srh.codeverse.repository;

import com.srh.codeverse.entity.AuditActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditActivityRepository extends JpaRepository<AuditActivity, String> {
    List<AuditActivity> findTop60ByOrgIdOrderByTimestampDesc(String orgId);
    List<AuditActivity> findTop15ByOrgIdOrderByTimestampDesc(String orgId);
    long countByOrgId(String orgId);
}
