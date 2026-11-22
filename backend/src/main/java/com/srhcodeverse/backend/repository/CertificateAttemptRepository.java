package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CertificateAttempt;
import com.srhcodeverse.backend.entity.CertificateDefinition;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateAttemptRepository extends JpaRepository<CertificateAttempt, Long> {
    List<CertificateAttempt> findByUserAndDefinitionOrderByAttemptNumberDesc(User user, CertificateDefinition definition);
    List<CertificateAttempt> findByUserOrderByStartedAtDesc(User user);
    Optional<CertificateAttempt> findByIdAndUser(Long id, User user);
    Optional<CertificateAttempt> findFirstByUserAndDefinitionAndStatusOrderByAttemptNumberDesc(User user, CertificateDefinition definition, String status);
    Optional<CertificateAttempt> findFirstByUserAndDefinitionAndPassedTrueOrderBySubmittedAtDesc(User user, CertificateDefinition definition);
    long countByUserAndDefinition(User user, CertificateDefinition definition);
    boolean existsByUserAndDefinitionAndPassedTrue(User user, CertificateDefinition definition);
}
