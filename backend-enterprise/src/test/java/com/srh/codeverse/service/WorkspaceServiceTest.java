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
import com.srh.codeverse.repository.WorkspaceSessionRepository;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

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
    @Mock WorkspaceSessionRepository workspaceSessionRepository;

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
    void nonAdminCannotCreateEmployee() {
        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.createEmployee("org-1", "EMPLOYEE", "emp-1", Map.of("name", "Test User", "email", "u@test.io"))
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void duplicateDailyCheckInIsBlocked() {
        Employee emp = new Employee();
        emp.setId("emp-1");
        emp.setOrgId("org-1");
        emp.setName("Test Employee");
        emp.setRole("EMPLOYEE");

        AttendanceRecord existing = new AttendanceRecord();
        existing.setCheckIn("09:15");

        when(employeeRepository.findByIdAndOrgId("emp-1", "org-1")).thenReturn(Optional.of(emp));
        when(attendanceRepository.findByOrgIdAndEmployeeIdAndWorkDate("org-1", "emp-1", LocalDate.now().toString()))
            .thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.checkIn("org-1", "EMPLOYEE", "emp-1", Map.of("workMode", "OFFICE"))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void remoteCheckInIsBlockedWhenOrgPolicyDisallowsRemote() {
        Organization org = new Organization();
        org.setId("org-1");
        org.setStatus("ACTIVE");
        org.setAllowRemoteCheckIn(false);

        Employee emp = new Employee();
        emp.setId("emp-1");
        emp.setOrgId("org-1");
        emp.setRole("EMPLOYEE");

        when(organizationRepository.findById("org-1")).thenReturn(Optional.of(org));
        when(employeeRepository.findByIdAndOrgId("emp-1", "org-1")).thenReturn(Optional.of(emp));
        when(attendanceRepository.findByOrgIdAndEmployeeIdAndWorkDate("org-1", "emp-1", LocalDate.now().toString()))
            .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.checkIn("org-1", "EMPLOYEE", "emp-1", Map.of("workMode", "REMOTE"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void rejectingLeaveRequiresReason() {
        LeaveRequest lr = new LeaveRequest();
        lr.setId("lv-1");
        lr.setOrgId("org-1");
        lr.setStatus("PENDING");

        when(leaveRequestRepository.findByIdAndOrgId("lv-1", "org-1")).thenReturn(Optional.of(lr));

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.reviewLeave("org-1", "TEAM_LEAD", "lead-1", "lv-1", Map.of("decision", "REJECTED", "note", "No"))
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void teamLeadCannotApproveOwnLeaveRequest() {
        LeaveRequest lr = new LeaveRequest();
        lr.setId("lv-self");
        lr.setOrgId("org-1");
        lr.setEmployeeId("lead-1");
        lr.setStatus("PENDING");

        Employee lead = new Employee();
        lead.setId("lead-1");
        lead.setOrgId("org-1");
        lead.setRole("TEAM_LEAD");

        when(leaveRequestRepository.findByIdAndOrgId("lv-self", "org-1")).thenReturn(Optional.of(lr));
        when(employeeRepository.findByIdAndOrgId("lead-1", "org-1")).thenReturn(Optional.of(lead));

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.reviewLeave("org-1", "TEAM_LEAD", "lead-1", "lv-self", Map.of("decision", "APPROVED", "note", "Self approved"))
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void worklogCannotBeAddedToSubmittedOrApprovedTimesheet() {
        Employee emp = new Employee();
        emp.setId("emp-1");
        emp.setOrgId("org-1");
        emp.setRole("PROFESSIONAL");

        Project proj = new Project();
        proj.setId("proj-1");
        proj.setOrgId("org-1");
        proj.setCode("PRJ-1");

        TimesheetRecord lockedTs = new TimesheetRecord();
        lockedTs.setId("ts-1");
        lockedTs.setOrgId("org-1");
        lockedTs.setEmployeeId("emp-1");
        lockedTs.setWeekStart("2026-11-16");
        lockedTs.setWeekEnd("2026-11-22");
        lockedTs.setStatus("APPROVED");

        when(employeeRepository.findByIdAndOrgId("emp-1", "org-1")).thenReturn(Optional.of(emp));
        when(projectRepository.findByIdAndOrgId("proj-1", "org-1")).thenReturn(Optional.of(proj));
        when(timesheetRepository.findByOrgIdAndEmployeeIdAndWeekStart("org-1", "emp-1", "2026-11-16"))
            .thenReturn(Optional.of(lockedTs));

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.createWorklog("org-1", "PROFESSIONAL", "emp-1", Map.of(
                "projectId", "proj-1",
                "date", "2026-11-18",
                "hours", 4.0,
                "summary", "API hardening work"
            ))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(worklogRepository, never()).save(any());
    }

    @Test
    void submitTimesheetUpdatesOnlyWorklogsWithinTimesheetWeek() {
        Employee emp = new Employee();
        emp.setId("emp-1");
        emp.setOrgId("org-1");
        emp.setRole("EMPLOYEE");

        TimesheetRecord ts = new TimesheetRecord();
        ts.setId("ts-w1");
        ts.setOrgId("org-1");
        ts.setEmployeeId("emp-1");
        ts.setWeekStart("2026-11-16");
        ts.setWeekEnd("2026-11-22");
        ts.setTotalHours(8.0);
        ts.setStatus("DRAFT");

        WorklogEntry inWeek = new WorklogEntry();
        inWeek.setId("wl-in");
        inWeek.setWorkDate("2026-11-18");
        inWeek.setStatus("LOGGED");

        WorklogEntry otherWeek = new WorklogEntry();
        otherWeek.setId("wl-out");
        otherWeek.setWorkDate("2026-11-25");
        otherWeek.setStatus("LOGGED");

        when(employeeRepository.findByIdAndOrgId("emp-1", "org-1")).thenReturn(Optional.of(emp));
        when(timesheetRepository.findByIdAndOrgId("ts-w1", "org-1")).thenReturn(Optional.of(ts));
        when(timesheetRepository.save(any(TimesheetRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(worklogRepository.findByOrgIdAndEmployeeIdAndStatusAndWorkDateBetween(
            "org-1", "emp-1", "LOGGED", "2026-11-16", "2026-11-22"
        )).thenReturn(List.of(inWeek, otherWeek));

        service.submitTimesheet("org-1", "EMPLOYEE", "emp-1", "ts-w1");
        assertEquals("SUBMITTED", inWeek.getStatus());
        assertEquals("LOGGED", otherWeek.getStatus());
        verify(worklogRepository, times(1)).save(inWeek);
        verify(worklogRepository, never()).save(otherWeek);
    }

    @Test
    void employeeCannotMarkAnotherUsersNotificationAsRead() {
        WorkspaceNotification ntf = new WorkspaceNotification();
        ntf.setId("ntf-2");
        ntf.setOrgId("org-1");
        ntf.setRecipientId("emp-2");
        ntf.setReadFlag(false);

        Employee actor = new Employee();
        actor.setId("emp-1");
        actor.setOrgId("org-1");
        actor.setRole("EMPLOYEE");

        when(notificationRepository.findByIdAndOrgId("ntf-2", "org-1")).thenReturn(Optional.of(ntf));
        when(employeeRepository.findByIdAndOrgId("emp-1", "org-1")).thenReturn(Optional.of(actor));

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> service.markNotificationRead("org-1", "EMPLOYEE", "emp-1", "ntf-2")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void employeeSnapshotHidesInvitationsReportsAndPeerPrivateRecords() {
        Organization org = new Organization();
        org.setId("org-1");
        org.setName("Acme");
        org.setStatus("ACTIVE");

        Employee self = new Employee();
        self.setId("emp-self");
        self.setOrgId("org-1");
        self.setRole("EMPLOYEE");

        LeaveRequest ownLeave = new LeaveRequest();
        ownLeave.setId("lv-own");
        ownLeave.setEmployeeId("emp-self");

        LeaveRequest peerLeave = new LeaveRequest();
        peerLeave.setId("lv-peer");
        peerLeave.setEmployeeId("emp-other");

        when(organizationRepository.findById("org-1")).thenReturn(Optional.of(org));
        when(employeeRepository.findByOrgId("org-1")).thenReturn(List.of(self));
        when(employeeRepository.findByIdAndOrgId("emp-self", "org-1")).thenReturn(Optional.of(self));
        when(departmentRepository.findByOrgId("org-1")).thenReturn(List.of());
        when(teamRepository.findByOrgId("org-1")).thenReturn(List.of());
        when(projectRepository.findByOrgId("org-1")).thenReturn(List.of());
        when(taskItemRepository.findByOrgIdOrderByUpdatedAtDesc("org-1")).thenReturn(List.of());
        when(attendanceRepository.findByOrgIdOrderByWorkDateDesc("org-1")).thenReturn(List.of());
        when(leaveRequestRepository.findByOrgId("org-1")).thenReturn(List.of(ownLeave, peerLeave));
        when(worklogRepository.findByOrgIdOrderByWorkDateDesc("org-1")).thenReturn(List.of());
        when(timesheetRepository.findByOrgIdOrderByWeekStartDesc("org-1")).thenReturn(List.of());
        when(auditActivityRepository.findTop60ByOrgIdOrderByTimestampDesc("org-1")).thenReturn(List.of());
        when(notificationRepository.findByOrgIdAndRecipientIdOrderByCreatedAtDesc("org-1", "emp-self")).thenReturn(List.of());

        Map<String, Object> snap = service.getWorkspaceSnapshot("org-1", "EMPLOYEE", "emp-self");
        assertNull(snap.get("reports"));
        assertTrue(((List<?>) snap.get("invitations")).isEmpty());
        @SuppressWarnings("unchecked")
        List<LeaveRequest> visibleLeaves = (List<LeaveRequest>) snap.get("leaves");
        assertEquals(1, visibleLeaves.size());
        assertEquals("lv-own", visibleLeaves.get(0).getId());
        verify(invitationRepository, never()).findByOrgIdOrderByInvitedAtDesc(any());
    }

    @Test
    void businessDaysExcludesWeekends() {
        assertEquals(5, WorkspaceService.calculateBusinessDays("2026-11-16", "2026-11-20"));
        assertEquals(0, WorkspaceService.calculateBusinessDays("2026-11-21", "2026-11-22"));
    }
}
