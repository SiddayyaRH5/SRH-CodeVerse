package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findByOrgId(String orgId);
    Optional<Department> findByIdAndOrgId(String id, String orgId);
    boolean existsByOrgIdAndCodeIgnoreCase(String orgId, String code);
    long countByOrgId(String orgId);
}
