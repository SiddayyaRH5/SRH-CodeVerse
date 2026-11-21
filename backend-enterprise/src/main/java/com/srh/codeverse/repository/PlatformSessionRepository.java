package com.srh.codeverse.repository;

import com.srh.codeverse.entity.PlatformSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlatformSessionRepository extends JpaRepository<PlatformSession, String> {
    Optional<PlatformSession> findByTokenHashAndRevokedFalse(String tokenHash);
    List<PlatformSession> findByPlatformUserIdAndRevokedFalse(String platformUserId);
}
