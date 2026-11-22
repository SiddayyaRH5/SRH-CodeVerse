package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.CertificateDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateDefinitionRepository extends JpaRepository<CertificateDefinition, Long> {
    Optional<CertificateDefinition> findBySlug(String slug);
    Optional<CertificateDefinition> findBySlugAndActiveTrue(String slug);
    List<CertificateDefinition> findByActiveTrueOrderBySortOrderAsc();
}
