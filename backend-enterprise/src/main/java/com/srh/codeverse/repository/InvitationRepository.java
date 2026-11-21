package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, String> {
    List<Invitation> findByOrgIdOrderByInvitedAtDesc(String orgId);
    Optional<Invitation> findByIdAndOrgId(String id, String orgId);
    boolean existsByOrgIdAndEmailIgnoreCaseAndStatus(String orgId, String email, String status);
}
