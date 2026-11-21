package com.srh.codeverse.repository;

import com.srh.codeverse.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, String> {
    List<Employee> findByOrgId(String orgId);
    Optional<Employee> findByIdAndOrgId(String id, String orgId);
    Optional<Employee> findFirstByEmailIgnoreCase(String email);
    Optional<Employee> findByOrgIdAndEmailIgnoreCase(String orgId, String email);
    boolean existsByOrgIdAndEmailIgnoreCase(String orgId, String email);
    boolean existsByOrgIdAndDepartmentId(String orgId, String departmentId);
    long countByOrgId(String orgId);
    long countByOrgIdAndRoleAndStatus(String orgId, String role, String status);
    long countByOrgIdAndRole(String orgId, String role);
    List<Employee> findByOrgIdAndRole(String orgId, String role);
}
