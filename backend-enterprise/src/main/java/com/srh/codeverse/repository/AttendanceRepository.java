package com.srh.codeverse.repository;

import com.srh.codeverse.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, String> {
    List<AttendanceRecord> findByOrgIdOrderByWorkDateDesc(String orgId);
    Optional<AttendanceRecord> findByOrgIdAndEmployeeIdAndWorkDate(String orgId, String employeeId, String workDate);
}
