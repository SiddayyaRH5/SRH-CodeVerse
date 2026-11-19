package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.PlatformOrganization;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlatformOrganizationRepository extends JpaRepository<PlatformOrganization, Long> {
    Optional<PlatformOrganization> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<PlatformOrganization> findByNameContainingIgnoreCaseOrSlugContainingIgnoreCase(String name, String slug, Pageable pageable);
}
