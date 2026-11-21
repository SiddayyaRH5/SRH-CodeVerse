package com.srh.codeverse.controller;

import com.srh.codeverse.entity.*;
import com.srh.codeverse.service.WorkspaceAuthService;
import com.srh.codeverse.service.WorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final WorkspaceAuthService authService;

    public WorkspaceController(WorkspaceService workspaceService, WorkspaceAuthService authService) {
        this.workspaceService = workspaceService;
        this.authService = authService;
    }

    private String authorization(HttpServletRequest request) {
        return request.getHeader("Authorization");
    }

    private com.srh.codeverse.entity.Employee principal(HttpServletRequest request) {
        return authService.requireWorkspaceUser(authorization(request));
    }

    @GetMapping("/workspace-data")
    public Map<String, Object> getWorkspaceData(HttpServletRequest request) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.getWorkspaceSnapshot(emp.getOrgId(), emp.getRole(), emp.getId());
    }

    @PatchMapping("/organization")
    public Organization updateOrganization(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateOrganization(emp.getOrgId(), emp.getRole(), emp.getId(), payload != null ? payload : Map.of());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createEmployee(emp.getOrgId(), emp.getRole(), emp.getId(), payload != null ? payload : Map.of()));
    }

    @PatchMapping("/employees/{id}")
    public Employee updateEmployee(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateEmployee(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @PostMapping("/invitations")
    public ResponseEntity<Invitation> createInvitation(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createInvitation(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PostMapping("/invitations/{id}/resend")
    public Invitation resendInvitation(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.resendInvitation(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/invitations/{id}/cancel")
    public Invitation cancelInvitation(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.cancelInvitation(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createDepartment(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PatchMapping("/departments/{id}")
    public Department updateDepartment(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateDepartment(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @DeleteMapping("/departments/{id}")
    public Map<String, Object> deleteDepartment(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.deleteDepartment(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/teams")
    public ResponseEntity<Team> createTeam(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createTeam(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PatchMapping("/teams/{id}")
    public Team updateTeam(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateTeam(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @DeleteMapping("/teams/{id}")
    public Map<String, Object> deleteTeam(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.deleteTeam(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/projects")
    public ResponseEntity<Project> createProject(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createProject(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PatchMapping("/projects/{id}")
    public Project updateProject(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateProject(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskItem> createTask(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createTask(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PatchMapping("/tasks/{id}")
    public TaskItem updateTask(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.updateTask(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<AttendanceRecord> checkIn(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.checkIn(emp.getOrgId(), emp.getRole(), emp.getId(), payload != null ? payload : Map.of()));
    }

    @PostMapping("/attendance/check-out")
    public AttendanceRecord checkOut(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.checkOut(emp.getOrgId(), emp.getRole(), emp.getId(), payload != null ? payload : Map.of());
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> createLeave(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createLeave(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PostMapping("/leaves/{id}/cancel")
    public LeaveRequest cancelLeave(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.cancelLeave(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/leaves/{id}/review")
    public LeaveRequest reviewLeave(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.reviewLeave(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @PostMapping("/worklogs")
    public ResponseEntity<WorklogEntry> createWorklog(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.createWorklog(emp.getOrgId(), emp.getRole(), emp.getId(), payload));
    }

    @PostMapping("/timesheets/{id}/submit")
    public TimesheetRecord submitTimesheet(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.submitTimesheet(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/timesheets/{id}/review")
    public TimesheetRecord reviewTimesheet(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> payload) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.reviewTimesheet(emp.getOrgId(), emp.getRole(), emp.getId(), id, payload);
    }

    @PostMapping("/notifications/{id}/read")
    public WorkspaceNotification markNotificationRead(HttpServletRequest request, @PathVariable String id) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.markNotificationRead(emp.getOrgId(), emp.getRole(), emp.getId(), id);
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Object> markAllNotificationsRead(HttpServletRequest request) {
        com.srh.codeverse.entity.Employee emp = principal(request);
        return workspaceService.markAllNotificationsRead(emp.getOrgId(), emp.getRole(), emp.getId());
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> body = payload != null ? payload : Map.of();
        String email = body.get("email") != null ? String.valueOf(body.get("email")) : "";
        String password = body.get("password") != null ? String.valueOf(body.get("password")) : "";
        return authService.login(email, password, resolveClientIp(request));
    }

    @PostMapping("/auth/logout")
    public Map<String, Object> logout(HttpServletRequest request) {
        return authService.logout(request.getHeader("Authorization"));
    }

    @GetMapping("/auth/session")
    public Map<String, Object> session(HttpServletRequest request) {
        com.srh.codeverse.entity.Employee emp = authService.requireWorkspaceUser(request.getHeader("Authorization"));
        return Map.of("authenticated", true, "user", authService.sanitizeUser(emp));
    }
}