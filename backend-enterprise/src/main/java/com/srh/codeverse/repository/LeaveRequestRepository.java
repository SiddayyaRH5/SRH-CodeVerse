package com.srh.codeverse.repository;

import com.srh.codeverse.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, String> {
    List<LeaveRequest> findByOrgId(String orgId);
    List<LeaveRequest> findByOrgIdAndEmployeeId(String orgId, String employeeId);
    Optional<LeaveRequest> findByIdAndOrgId(String id, String orgId);
}
