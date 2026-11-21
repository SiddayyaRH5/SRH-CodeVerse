package com.srh.codeverse.service;

import com.srh.codeverse.entity.*;
import com.srh.codeverse.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceTenantIsolationTest {

    @Mock OrganizationRepository organizationRepository;
    @Mock DepartmentRepository departmentRepository;
    @Mock TeamRepository teamRepository;
    @Mock EmployeeRepository employeeRepository;
    @Mock InvitationRepository invitationRepository;
    @Mock ProjectRepository projectRepository;
    @Mock TaskItemRepository taskItemRepository;
    @Mock AttendanceRepository attendanceRepository;
    @Mock LeaveRequestRepository leaveRequestRepository;
    @Mock WorklogRepository worklogRepository;
    @Mock TimesheetRepository timesheetRepository;
    @Mock AuditActivityRepository auditActivityRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock com.srh.codeverse.repository.WorkspaceSessionRepository workspaceSessionRepository;

    private WorkspaceService service;

    @BeforeEach
    void setUp() {
        service = new WorkspaceService(
            organizationRepository, departmentRepository, teamRepository,
            employeeRepository, invitationRepository, projectRepository,
            taskItemRepository, attendanceRepository, leaveRequestRepository,
            worklogRepository, timesheetRepository, auditActivityRepository,
            notificationRepository, new BCryptPasswordEncoder(), workspaceSessionRepository
        );
    }

    @Test
    void crossTenantEmployeeUpdateIsBlocked() {
        when(employeeRepository.findByIdAndOrgId("emp-b", "org-a")).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.updateEmployee("org-a", "ORG_ADMIN", "emp-a", "emp-b", Map.of("name", "Hacked")));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void crossTenantDepartmentDeleteIsBlocked() {
        when(departmentRepository.findByIdAndOrgId("dept-b", "org-a")).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.deleteDepartment("org-a", "ORG_ADMIN", "emp-a", "dept-b"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void crossTenantNotificationReadIsBlocked() {
        when(notificationRepository.findByIdAndOrgId("ntf-b", "org-a")).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.markNotificationRead("org-a", "EMPLOYEE", "emp-a", "ntf-b"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void crossTenantLeaveReviewIsBlocked() {
        when(leaveRequestRepository.findByIdAndOrgId("lv-b", "org-a")).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.reviewLeave("org-a", "TEAM_LEAD", "lead-a", "lv-b", Map.of("decision", "APPROVED")));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void employeeCannotPerformAdminMutation() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.createDepartment("org-a", "EMPLOYEE", "emp-a", Map.of("name", "Hack Dept", "code", "HCK")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}