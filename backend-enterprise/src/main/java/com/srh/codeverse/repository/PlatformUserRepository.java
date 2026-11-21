package com.srh.codeverse.repository;

import com.srh.codeverse.entity.PlatformUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlatformUserRepository extends JpaRepository<PlatformUser, String> {
    Optional<PlatformUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByPlatformRole(String platformRole);
    long countByPlatformRoleAndStatus(String platformRole, String status);
    long countByStatus(String status);
    List<PlatformUser> findAllByOrderByCreatedAtDesc();
}
