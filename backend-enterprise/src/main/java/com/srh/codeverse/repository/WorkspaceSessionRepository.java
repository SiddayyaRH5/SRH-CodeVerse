package com.srh.codeverse.repository;

import com.srh.codeverse.entity.WorkspaceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceSessionRepository extends JpaRepository<WorkspaceSession, String> {
    Optional<WorkspaceSession> findByTokenHashAndRevokedFalse(String tokenHash);
    List<WorkspaceSession> findByEmployeeIdAndRevokedFalse(String employeeId);
}