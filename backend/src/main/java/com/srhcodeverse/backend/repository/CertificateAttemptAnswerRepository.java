package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CertificateAttempt;
import com.srhcodeverse.backend.entity.CertificateAttemptAnswer;
import com.srhcodeverse.backend.entity.CertificateQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateAttemptAnswerRepository extends JpaRepository<CertificateAttemptAnswer, Long> {
    List<CertificateAttemptAnswer> findByAttempt(CertificateAttempt attempt);
    Optional<CertificateAttemptAnswer> findByAttemptAndQuestion(CertificateAttempt attempt, CertificateQuestion question);
    long countByAttemptAndCorrectTrue(CertificateAttempt attempt);
}
