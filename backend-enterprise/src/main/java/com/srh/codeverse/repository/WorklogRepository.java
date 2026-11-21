package com.srh.codeverse.repository;

import com.srh.codeverse.entity.WorklogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorklogRepository extends JpaRepository<WorklogEntry, String> {
    List<WorklogEntry> findByOrgIdOrderByWorkDateDesc(String orgId);
    List<WorklogEntry> findByOrgIdAndEmployeeIdAndWorkDate(String orgId, String employeeId, String workDate);
    List<WorklogEntry> findByOrgIdAndEmployeeIdAndStatus(String orgId, String employeeId, String status);
    List<WorklogEntry> findByOrgIdAndEmployeeIdAndStatusAndWorkDateBetween(
        String orgId,
        String employeeId,
        String status,
        String startDate,
        String endDate
    );
}
