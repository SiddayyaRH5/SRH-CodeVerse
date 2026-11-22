package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CertificateDefinition;
import com.srhcodeverse.backend.entity.CertificateQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CertificateQuestionRepository extends JpaRepository<CertificateQuestion, Long> {
    List<CertificateQuestion> findByDefinitionAndActiveTrue(CertificateDefinition definition);
    long countByDefinitionAndActiveTrue(CertificateDefinition definition);
    List<CertificateQuestion> findByDefinition(CertificateDefinition definition);
}
