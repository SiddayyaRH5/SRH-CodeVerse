package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationRepository extends JpaRepository<Organization, String> {
    boolean existsBySlugIgnoreCase(String slug);
    List<Organization> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
