package com.srh.codeverse.repository;

import com.srh.codeverse.entity.TimesheetRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TimesheetRepository extends JpaRepository<TimesheetRecord, String> {
    List<TimesheetRecord> findByOrgIdOrderByWeekStartDesc(String orgId);
    Optional<TimesheetRecord> findByIdAndOrgId(String id, String orgId);
    Optional<TimesheetRecord> findByOrgIdAndEmployeeIdAndWeekStart(String orgId, String employeeId, String weekStart);
}
