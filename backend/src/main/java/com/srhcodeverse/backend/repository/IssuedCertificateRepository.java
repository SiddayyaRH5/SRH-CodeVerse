package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CertificateDefinition;
import com.srhcodeverse.backend.entity.IssuedCertificate;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IssuedCertificateRepository extends JpaRepository<IssuedCertificate, Long> {
    List<IssuedCertificate> findByUserOrderByIssuedAtDesc(User user);
    Optional<IssuedCertificate> findByCertificateNumber(String certificateNumber);
    Optional<IssuedCertificate> findByVerificationCode(String verificationCode);
    Optional<IssuedCertificate> findByUserAndDefinition(User user, CertificateDefinition definition);
    boolean existsByUserAndDefinition(User user, CertificateDefinition definition);
    boolean existsByCertificateNumber(String certificateNumber);
    boolean existsByVerificationCode(String verificationCode);
}
