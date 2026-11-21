package com.srh.codeverse.service;

import com.srh.codeverse.entity.*;
import com.srh.codeverse.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class WorkspaceService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Set<String> VALID_ROLES = Set.of("ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
    private static final Set<String> VALID_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> VALID_TASK_STATUSES = Set.of("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED");
    private static final Set<String> VALID_PROJECT_STATUSES = Set.of("PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED");

    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final InvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final TaskItemRepository taskItemRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final WorklogRepository worklogRepository;
    private final TimesheetRepository timesheetRepository;
    private final AuditActivityRepository auditActivityRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final WorkspaceSessionRepository workspaceSessionRepository;

    public WorkspaceService(
        OrganizationRepository organizationRepository,
        DepartmentRepository departmentRepository,
        TeamRepository teamRepository,
        EmployeeRepository employeeRepository,
        InvitationRepository invitationRepository,
        ProjectRepository projectRepository,
        TaskItemRepository taskItemRepository,
        AttendanceRepository attendanceRepository,
        LeaveRequestRepository leaveRequestRepository,
        WorklogRepository worklogRepository,
        TimesheetRepository timesheetRepository,
        AuditActivityRepository auditActivityRepository,
        NotificationRepository notificationRepository,
        PasswordEncoder passwordEncoder,
        WorkspaceSessionRepository workspaceSessionRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
        this.invitationRepository = invitationRepository;
        this.projectRepository = projectRepository;
        this.taskItemRepository = taskItemRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.worklogRepository = worklogRepository;
        this.timesheetRepository = timesheetRepository;
        this.auditActivityRepository = auditActivityRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.workspaceSessionRepository = workspaceSessionRepository;
    }

    private String nextId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        if (payload == null) return fallback;
        Object val = payload.get(key);
        return val != null ? String.valueOf(val).trim() : fallback;
    }

    private String optionalId(Map<String, Object> payload, String key) {
        if (payload == null) return null;
        Object val = payload.get(key);
        if (val == null) return null;
        String trimmed = String.valueOf(val).trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isDateWithinRange(String workDate, String weekStart, String weekEnd) {
        if (workDate == null || weekStart == null || weekEnd == null) return false;
        return workDate.compareTo(weekStart) >= 0 && workDate.compareTo(weekEnd) <= 0;
    }

    private void requireRole(String role, String... allowed) {
        for (String a : allowed) {
            if (a.equalsIgnoreCase(role)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: role " + role + " lacks required permission.");
    }

    private void ensureOrgNotSuspended(Organization org) {
        if (org != null && "SUSPENDED".equalsIgnoreCase(org.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organization is currently suspended.");
        }
    }

    private void ensureOrgNotSuspended(String orgId) {
        if (orgId == null || orgId.isBlank()) return;
        organizationRepository.findById(orgId).ifPresent(this::ensureOrgNotSuspended);
    }

    private Organization resolveOrg(String orgId) {
        if (orgId != null && !orgId.isBlank()) {
            Organization found = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found: " + orgId));
            ensureOrgNotSuspended(found);
            return found;
        }
        List<Organization> all = organizationRepository.findAll();
        if (all.isEmpty()) return null;
        return all.stream()
            .filter(o -> !"SUSPENDED".equalsIgnoreCase(o.getStatus()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Organization is currently suspended."));
    }

    private void revokeWorkspaceSessions(String employeeId) {
        if (employeeId == null || employeeId.isBlank() || workspaceSessionRepository == null) return;
        for (com.srh.codeverse.entity.WorkspaceSession s : workspaceSessionRepository.findByEmployeeIdAndRevokedFalse(employeeId)) {
            s.setRevoked(true);
            workspaceSessionRepository.save(s);
        }
    }

    private Employee resolveActor(String orgId, String role, String userId) {
        if (userId != null && !userId.isBlank()) {
            Optional<Employee> direct = employeeRepository.findByIdAndOrgId(userId, orgId);
            if (direct.isPresent()) return direct.get();
        }
        return employeeRepository.findByOrgId(orgId).stream()
            .filter(e -> role != null && role.equalsIgnoreCase(e.getRole()))
            .findFirst()
            .orElse(null);
    }

    private void recordActivity(String orgId, Employee actor, String role, String category, String action, String target) {
        AuditActivity act = new AuditActivity();
        act.setId(nextId("act"));
        act.setOrgId(orgId);
        act.setActorId(actor != null ? actor.getId() : "system");
        act.setActorName(actor != null ? actor.getName() : "System");
        act.setActorRole(role);
        act.setCategory(category);
        act.setAction(action);
        act.setTarget(target);
        act.setTimestamp(Instant.now().toString());
        auditActivityRepository.save(act);
    }

    private void pushNotification(String orgId, String recipientId, String title, String message, String category) {
        if (recipientId == null || recipientId.isBlank()) return;
        WorkspaceNotification ntf = new WorkspaceNotification();
        ntf.setId(nextId("ntf"));
        ntf.setOrgId(orgId);
        ntf.setRecipientId(recipientId);
        ntf.setTitle(title);
        ntf.setMessage(message);
        ntf.setCategory(category);
        ntf.setReadFlag(false);
        ntf.setCreatedAt(Instant.now().toString());
        notificationRepository.save(ntf);
    }

    public static int calculateBusinessDays(String startDate, String endDate) {
        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(startDate);
            end = LocalDate.parse(endDate);
        } catch (Exception ex) {
            return 0;
        }
        if (end.isBefore(start)) return 0;
        int days = 0;
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            DayOfWeek dow = cursor.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                days++;
            }
            cursor = cursor.plusDays(1);
        }
        return days;
    }

    public static double computeHoursBetween(String checkIn, String checkOut) {
        try {
            LocalTime in = LocalTime.parse(checkIn);
            LocalTime out = LocalTime.parse(checkOut);
            long mins = Duration.between(in, out).toMinutes();
            if (mins <= 0) return 0.0;
            return Math.round((mins / 60.0) * 100.0) / 100.0;
        } catch (Exception ex) {
            return 0.0;
        }
    }

    private List<Map<String, Object>> getRoleDefinitions() {
        return List.of(
            Map.of(
                "role", "ORG_ADMIN",
                "label", "Organization Admin",
                "scope", "Entire Organization",
                "description", "Full governance across organization settings, directory, invitations, departments, teams, projects, and reports.",
                "permissions", List.of(
                    Map.of("module", "Organization Settings", "access", "FULL", "detail", "Update corporate identity and attendance policies."),
                    Map.of("module", "Employees & Invitations", "access", "FULL", "detail", "Create, edit, invite, resend, and revoke member accounts."),
                    Map.of("module", "Departments & Teams", "access", "FULL", "detail", "Create, update, and remove empty departments/teams."),
                    Map.of("module", "Projects & Reports", "access", "FULL", "detail", "Manage organization projects and export live MySQL analytics.")
                ),
                "safeguards", List.of(
                    "Cannot deactivate or demote the last active ORG_ADMIN in an organization.",
                    "All mutations enforce org_id tenant isolation in JPA repositories."
                )
            ),
            Map.of(
                "role", "TEAM_LEAD",
                "label", "Team Lead",
                "scope", "Assigned Teams & Projects",
                "description", "Manages squad task allocation, workload distribution, project tracking, and leave/timesheet approvals.",
                "permissions", List.of(
                    Map.of("module", "Team Tasks & Workload", "access", "TEAM", "detail", "Create, filter, and reassign tasks across squad members."),
                    Map.of("module", "Leave & Timesheet Approvals", "access", "TEAM", "detail", "Approve or reject requests with mandatory rejection notes."),
                    Map.of("module", "Organization Admin Controls", "access", "NONE", "detail", "Restricted to ORG_ADMIN on Spring Boot endpoints.")
                ),
                "safeguards", List.of("Rejection decisions require an explicit reviewer reason.")
            ),
            Map.of(
                "role", "PROFESSIONAL",
                "label", "Professional",
                "scope", "Assigned Projects & Personal Records",
                "description", "Individual contributor workspace for task delivery, billable worklogs, timesheets, attendance, and leaves.",
                "permissions", List.of(
                    Map.of("module", "Tasks & Projects", "access", "SELF", "detail", "Update progress and status on assigned tasks."),
                    Map.of("module", "Worklogs & Timesheets", "access", "SELF", "detail", "Log hours within daily 24h cap and submit weekly timesheets."),
                    Map.of("module", "Approvals & Admin", "access", "NONE", "detail", "Blocked by Spring Boot role authorization.")
                ),
                "safeguards", List.of("Task updates verify assignee ownership.")
            ),
            Map.of(
                "role", "EMPLOYEE",
                "label", "Employee",
                "scope", "Self-Service Only",
                "description", "Self-service workspace for daily attendance check-in/out, assigned tasks, leaves, and worklogs.",
                "permissions", List.of(
                    Map.of("module", "Attendance & Leave", "access", "SELF", "detail", "Daily check-in/out with duplicate check-in protection."),
                    Map.of("module", "Personal Tasks & Worklogs", "access", "SELF", "detail", "Track tasks and submit weekly timesheets."),
                    Map.of("module", "Admin & Approvals", "access", "NONE", "detail", "Blocked by Spring Boot role authorization.")
                ),
                "safeguards", List.of("Duplicate daily check-ins and overlapping leave dates are rejected.")
            )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWorkspaceSnapshot(String requestedOrgId, String role, String userId) {
        String today = LocalDate.now().toString();
        Organization activeOrg = resolveOrg(requestedOrgId);

        // Strict tenant isolation: ordinary workspaces receive ONLY their own active organization,
        // never platform-wide organization listings (reserved exclusively for verified SUPER_ADMIN APIs).
        List<Organization> scopedOrganizations = activeOrg != null ? List.of(activeOrg) : List.of();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("today", today);
        payload.put("organizations", scopedOrganizations);
        payload.put("roles", getRoleDefinitions());

        if (activeOrg == null) {
            payload.put("activeOrg", null);
            payload.put("currentUser", null);
            payload.put("employees", List.of());
            payload.put("departments", List.of());
            payload.put("teams", List.of());
            payload.put("invitations", List.of());
            payload.put("projects", List.of());
            payload.put("tasks", List.of());
            payload.put("attendance", List.of());
            payload.put("leaves", List.of());
            payload.put("worklogs", List.of());
            payload.put("timesheets", List.of());
            payload.put("activities", List.of());
            payload.put("notifications", List.of());
            payload.put("reports", null);
            return payload;
        }

        String orgId = activeOrg.getId();
        boolean isAdmin = "ORG_ADMIN".equalsIgnoreCase(role);
        boolean isLead = "TEAM_LEAD".equalsIgnoreCase(role);

        List<Employee> employees = employeeRepository.findByOrgId(orgId);
        List<Department> departments = departmentRepository.findByOrgId(orgId);
        List<Team> teams = teamRepository.findByOrgId(orgId);
        List<Invitation> invitations = isAdmin
            ? invitationRepository.findByOrgIdOrderByInvitedAtDesc(orgId)
            : List.of();
        List<Project> projects = projectRepository.findByOrgId(orgId);
        List<TaskItem> tasks = taskItemRepository.findByOrgIdOrderByUpdatedAtDesc(orgId);
        List<AttendanceRecord> attendance = attendanceRepository.findByOrgIdOrderByWorkDateDesc(orgId);
        List<LeaveRequest> leaves = leaveRequestRepository.findByOrgId(orgId);
        List<WorklogEntry> worklogs = worklogRepository.findByOrgIdOrderByWorkDateDesc(orgId);
        List<TimesheetRecord> timesheets = timesheetRepository.findByOrgIdOrderByWeekStartDesc(orgId);
        List<AuditActivity> activities = auditActivityRepository.findTop60ByOrgIdOrderByTimestampDesc(orgId);
        Employee currentUser = resolveActor(orgId, role, userId);

        if (!isAdmin && !isLead) {
            String selfId = currentUser != null ? currentUser.getId() : null;
            attendance = selfId != null
                ? attendance.stream().filter(a -> selfId.equals(a.getEmployeeId())).toList()
                : List.of();
            leaves = selfId != null
                ? leaves.stream().filter(l -> selfId.equals(l.getEmployeeId())).toList()
                : List.of();
            worklogs = selfId != null
                ? worklogs.stream().filter(w -> selfId.equals(w.getEmployeeId())).toList()
                : List.of();
            timesheets = selfId != null
                ? timesheets.stream().filter(ts -> selfId.equals(ts.getEmployeeId())).toList()
                : List.of();
            activities = selfId != null
                ? activities.stream().filter(act -> selfId.equals(act.getActorId())).toList()
                : List.of();
        }

        List<WorkspaceNotification> notifications = isAdmin
            ? notificationRepository.findByOrgIdOrderByCreatedAtDesc(orgId)
            : (currentUser != null
                ? notificationRepository.findByOrgIdAndRecipientIdOrderByCreatedAtDesc(orgId, currentUser.getId())
                : List.of());

        payload.put("activeOrg", activeOrg);
        payload.put("currentUser", currentUser);
        payload.put("employees", employees);
        payload.put("departments", departments);
        payload.put("teams", teams);
        payload.put("invitations", invitations);
        payload.put("projects", projects);
        payload.put("tasks", tasks);
        payload.put("attendance", attendance);
        payload.put("leaves", leaves);
        payload.put("worklogs", worklogs);
        payload.put("timesheets", timesheets);
        payload.put("activities", activities);
        payload.put("notifications", notifications);
        payload.put("reports", (isAdmin || isLead)
            ? computeReports(today, employees, departments, teams, projects, tasks, invitations, attendance, leaves, worklogs, timesheets)
            : null);
        return payload;
    }

    private Map<String, Object> computeReports(
        String today,
        List<Employee> employees,
        List<Department> departments,
        List<Team> teams,
        List<Project> projects,
        List<TaskItem> tasks,
        List<Invitation> invitations,
        List<AttendanceRecord> attendance,
        List<LeaveRequest> leaves,
        List<WorklogEntry> worklogs,
        List<TimesheetRecord> timesheets
    ) {
        long activeEmployees = employees.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count();
        long completedTasks = tasks.stream().filter(t -> "DONE".equals(t.getStatus())).count();
        long overdueTasks = tasks.stream()
            .filter(t -> !"DONE".equals(t.getStatus()) && t.getDueDate() != null && t.getDueDate().compareTo(today) < 0)
            .count();
        long pendingInvitations = invitations.stream().filter(i -> "PENDING".equals(i.getStatus())).count();
        long pendingApprovals = leaves.stream().filter(l -> "PENDING".equals(l.getStatus())).count()
            + timesheets.stream().filter(ts -> "SUBMITTED".equals(ts.getStatus())).count();
        long todayAttendance = attendance.stream().filter(a -> today.equals(a.getWorkDate())).count();
        int attendanceRate = activeEmployees > 0 ? (int) Math.min(100, Math.round((todayAttendance * 100.0) / activeEmployees)) : 0;
        double totalLoggedHours = Math.round(worklogs.stream().mapToDouble(WorklogEntry::getHours).sum() * 10.0) / 10.0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEmployees", employees.size());
        summary.put("activeEmployees", activeEmployees);
        summary.put("departmentsCount", departments.size());
        summary.put("teamsCount", teams.size());
        summary.put("activeProjects", projects.stream().filter(p -> "ACTIVE".equals(p.getStatus())).count());
        summary.put("totalTasks", tasks.size());
        summary.put("completedTasks", completedTasks);
        summary.put("overdueTasks", overdueTasks);
        summary.put("pendingInvitations", pendingInvitations);
        summary.put("pendingApprovals", pendingApprovals);
        summary.put("attendanceRate", attendanceRate);
        summary.put("totalLoggedHours", totalLoggedHours);

        List<Map<String, Object>> departmentDistribution = departments.stream().map(dept -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("departmentId", dept.getId());
            row.put("departmentName", dept.getName());
            row.put("employeeCount", employees.stream().filter(e -> dept.getId().equals(e.getDepartmentId())).count());
            row.put("activeProjects", projects.stream().filter(p -> dept.getId().equals(p.getDepartmentId()) && "ACTIVE".equals(p.getStatus())).count());
            return row;
        }).toList();

        List<Map<String, Object>> taskStatusBreakdown = List.of("TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE").stream()
            .map(status -> Map.<String, Object>of(
                "status", status,
                "count", tasks.stream().filter(t -> status.equals(t.getStatus())).count()
            )).toList();

        List<Map<String, Object>> projectHealth = projects.stream().map(project -> {
            List<TaskItem> pTasks = tasks.stream().filter(t -> project.getId().equals(t.getProjectId())).toList();
            int progress = pTasks.isEmpty() ? 0 : (int) Math.round(
                pTasks.stream().mapToInt(t -> "DONE".equals(t.getStatus()) ? 100 : Math.max(0, Math.min(100, t.getProgress()))).average().orElse(0)
            );
            double logged = Math.round(worklogs.stream().filter(w -> project.getId().equals(w.getProjectId())).mapToDouble(WorklogEntry::getHours).sum() * 10.0) / 10.0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("projectId", project.getId());
            row.put("code", project.getCode());
            row.put("name", project.getName());
            row.put("status", project.getStatus());
            row.put("progress", progress);
            row.put("totalTasks", pTasks.size());
            row.put("completedTasks", pTasks.stream().filter(t -> "DONE".equals(t.getStatus())).count());
            row.put("overdueTasks", pTasks.stream().filter(t -> !"DONE".equals(t.getStatus()) && t.getDueDate() != null && t.getDueDate().compareTo(today) < 0).count());
            row.put("loggedHours", logged);
            row.put("budgetHours", project.getBudgetHours());
            return row;
        }).toList();

        List<Map<String, Object>> workloadByMember = employees.stream()
            .filter(e -> !"INACTIVE".equals(e.getStatus()))
            .map(emp -> {
                List<TaskItem> open = tasks.stream().filter(t -> emp.getId().equals(t.getAssigneeId()) && !"DONE".equals(t.getStatus())).toList();
                long overdue = open.stream().filter(t -> t.getDueDate() != null && t.getDueDate().compareTo(today) < 0).count();
                double logged = Math.round(worklogs.stream().filter(w -> emp.getId().equals(w.getEmployeeId())).mapToDouble(WorklogEntry::getHours).sum() * 10.0) / 10.0;
                int cap = emp.getWeeklyCapacityHours() > 0 ? emp.getWeeklyCapacityHours() : 40;
                int util = (int) Math.min(150, Math.round((logged / cap) * 100.0));
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("employeeId", emp.getId());
                row.put("name", emp.getName());
                row.put("title", emp.getTitle());
                row.put("teamId", emp.getTeamId());
                row.put("openTasks", open.size());
                row.put("overdueTasks", overdue);
                row.put("loggedHours", logged);
                row.put("capacityHours", cap);
                row.put("utilizationPct", util);
                return row;
            }).toList();

        Map<String, Object> reports = new LinkedHashMap<>();
        reports.put("summary", summary);
        reports.put("departmentDistribution", departmentDistribution);
        reports.put("taskStatusBreakdown", taskStatusBreakdown);
        reports.put("projectHealth", projectHealth);
        reports.put("workloadByMember", workloadByMember);
        return reports;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Organization updateOrganization(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found."));
        ensureOrgNotSuspended(org);
        if (payload.get("name") instanceof String name) {
            if (name.trim().length() < 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization name must be at least 2 characters.");
            org.setName(name.trim());
        }
        if (payload.get("industry") instanceof String v) org.setIndustry(v.trim());
        if (payload.get("domain") instanceof String v) org.setDomain(v.trim());
        if (payload.get("timezone") instanceof String v) org.setTimezone(v.trim());
        if (payload.get("location") instanceof String v) org.setLocation(v.trim());
        if (payload.get("workWeek") instanceof String v) org.setWorkWeek(v.trim());
        if (payload.get("attendancePolicy") instanceof Map<?, ?> policy) {
            if (policy.get("standardStart") instanceof String s) org.setStandardStart(s);
            if (policy.get("standardEnd") instanceof String s) org.setStandardEnd(s);
            if (policy.get("graceMinutes") instanceof Number n) org.setGraceMinutes(Math.max(0, Math.min(60, n.intValue())));
            if (policy.get("allowRemoteCheckIn") instanceof Boolean b) org.setAllowRemoteCheckIn(b);
        }
        Organization saved = organizationRepository.save(org);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Updated organization profile & settings", saved.getName());
        return saved;
    }

    @Transactional
    public Employee createEmployee(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        String name = str(payload, "name", "");
        String email = str(payload, "email", "").toLowerCase();
        String deptId = str(payload, "departmentId", "");
        if (name.length() < 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee full name is required.");
        if (!EMAIL_PATTERN.matcher(email).matches()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid corporate email is required.");
        if (employeeRepository.existsByOrgIdAndEmailIgnoreCase(orgId, email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An employee with this email already exists in this organization.");
        }
        Department dept = departmentRepository.findByIdAndOrgId(deptId, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid department."));
        String empRole = str(payload, "role", "EMPLOYEE").toUpperCase();
        if (!VALID_ROLES.contains(empRole)) empRole = "EMPLOYEE";

        String requestedTeamId = optionalId(payload, "teamId");
        Team assignedTeam = null;
        if (requestedTeamId != null) {
            assignedTeam = teamRepository.findByIdAndOrgId(requestedTeamId, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid team in this organization."));
        }

        Employee emp = new Employee();
        emp.setId(nextId("emp"));
        emp.setOrgId(orgId);
        emp.setEmployeeCode("EMP-" + (1000 + employeeRepository.findByOrgId(orgId).size() + 1));
        emp.setName(name);
        emp.setEmail(email);
        emp.setTitle(str(payload, "title", "Software Engineer"));
        emp.setRole(empRole);
        emp.setDepartmentId(dept.getId());
        emp.setTeamId(assignedTeam != null ? assignedTeam.getId() : null);
        emp.setStatus("ACTIVE");
        emp.setLocation(str(payload, "location", ""));
        emp.setPhone(str(payload, "phone", ""));
        emp.setJoinedAt(LocalDate.now().toString());
        if (payload.get("password") instanceof String rawPassword && !rawPassword.isBlank()) {
            if (rawPassword.length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");
            }
            emp.setPasswordHash(passwordEncoder.encode(rawPassword));
        }
        Employee saved = employeeRepository.save(emp);

        if (assignedTeam != null && !assignedTeam.getMemberIds().contains(saved.getId())) {
            assignedTeam.getMemberIds().add(saved.getId());
            teamRepository.save(assignedTeam);
        }
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "EMPLOYEE", "Added " + saved.getName() + " (" + saved.getRole() + ")", dept.getName());
        return saved;
    }

    @Transactional
    public Employee updateEmployee(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        ensureOrgNotSuspended(orgId);
        Employee emp = employeeRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found in this organization."));
        Employee actor = resolveActor(orgId, role, userId);
        boolean isAdmin = "ORG_ADMIN".equalsIgnoreCase(role);
        boolean isSelf = actor != null && emp.getId().equals(actor.getId());
        if (!isAdmin && !isSelf) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: only Organization Admins can edit other employee records.");
        }

        if (payload.get("name") instanceof String n && n.trim().length() >= 2) emp.setName(n.trim());
        if (payload.get("title") instanceof String t && t.trim().length() >= 2) emp.setTitle(t.trim());
        if (payload.get("location") instanceof String l) emp.setLocation(l.trim());
        if (payload.get("phone") instanceof String p) emp.setPhone(p.trim());
        if (payload.get("skills") instanceof List<?> skills) {
            emp.setSkills(skills.stream().map(s -> String.valueOf(s).trim()).filter(s -> !s.isEmpty()).toList());
        }

        if (isAdmin) {
            if (payload.get("password") instanceof String rawPassword && !rawPassword.isBlank()) {
                if (rawPassword.length() < 8) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");
                }
                emp.setPasswordHash(passwordEncoder.encode(rawPassword));
                revokeWorkspaceSessions(emp.getId());
            }
            if (payload.get("status") instanceof String st && Set.of("ACTIVE", "ON_LEAVE", "INACTIVE").contains(st)) {
                if ("ORG_ADMIN".equals(emp.getRole()) && "INACTIVE".equals(st) && "ACTIVE".equals(emp.getStatus())) {
                    if (employeeRepository.countByOrgIdAndRoleAndStatus(orgId, "ORG_ADMIN", "ACTIVE") <= 1) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot deactivate the last active Organization Admin.");
                    }
                }
                emp.setStatus(st);
                if ("INACTIVE".equalsIgnoreCase(st)) {
                    revokeWorkspaceSessions(emp.getId());
                }
            }
            if (payload.get("role") instanceof String nextRole && VALID_ROLES.contains(nextRole)) {
                if ("ORG_ADMIN".equals(emp.getRole()) && !"ORG_ADMIN".equals(nextRole)) {
                    if (employeeRepository.countByOrgIdAndRole(orgId, "ORG_ADMIN") <= 1) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization must retain at least one Organization Admin.");
                    }
                }
                emp.setRole(nextRole);
            }
            if (payload.get("departmentId") instanceof String deptId && departmentRepository.findByIdAndOrgId(deptId, orgId).isPresent()) {
                emp.setDepartmentId(deptId);
            }
            if (payload.containsKey("teamId")) {
                String prevTeamId = emp.getTeamId();
                String nextTeamId = optionalId(payload, "teamId");
                Team nextTeam = null;
                if (nextTeamId != null) {
                    nextTeam = teamRepository.findByIdAndOrgId(nextTeamId, orgId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid team in this organization."));
                }
                if (prevTeamId != null && !prevTeamId.equals(nextTeamId)) {
                    teamRepository.findByIdAndOrgId(prevTeamId, orgId).ifPresent(t -> {
                        t.getMemberIds().remove(emp.getId());
                        teamRepository.save(t);
                    });
                }
                if (nextTeam != null && !nextTeam.getMemberIds().contains(emp.getId())) {
                    nextTeam.getMemberIds().add(emp.getId());
                    teamRepository.save(nextTeam);
                }
                emp.setTeamId(nextTeam != null ? nextTeam.getId() : null);
            }
        }
        Employee saved = employeeRepository.save(emp);
        recordActivity(orgId, actor, role, "EMPLOYEE", "Updated profile for " + saved.getName(), saved.getEmployeeCode());
        return saved;
    }

    @Transactional
    public Invitation createInvitation(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        String name = str(payload, "name", "");
        String email = str(payload, "email", "").toLowerCase();
        String deptId = str(payload, "departmentId", "");
        if (name.length() < 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitee name is required.");
        if (!EMAIL_PATTERN.matcher(email).matches()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        if (employeeRepository.existsByOrgIdAndEmailIgnoreCase(orgId, email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This user is already an employee in this organization.");
        }
        if (invitationRepository.existsByOrgIdAndEmailIgnoreCaseAndStatus(orgId, email, "PENDING")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A pending invitation already exists for this email.");
        }
        Department dept = departmentRepository.findByIdAndOrgId(deptId, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid department."));
        String requestedTeamId = optionalId(payload, "teamId");
        if (requestedTeamId != null && teamRepository.findByIdAndOrgId(requestedTeamId, orgId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid team in this organization.");
        }
        Employee actor = resolveActor(orgId, role, userId);

        Invitation inv = new Invitation();
        inv.setId(nextId("inv"));
        inv.setOrgId(orgId);
        inv.setEmail(email);
        inv.setName(name);
        String invRole = str(payload, "role", "EMPLOYEE").toUpperCase();
        inv.setRole(VALID_ROLES.contains(invRole) ? invRole : "EMPLOYEE");
        inv.setDepartmentId(dept.getId());
        inv.setTeamId(requestedTeamId);
        inv.setStatus("PENDING");
        inv.setInvitedBy(actor != null ? actor.getName() : "Organization Admin");
        String now = Instant.now().toString();
        inv.setInvitedAt(now);
        inv.setLastSentAt(now);
        inv.setExpiresAt(LocalDate.now().plusDays(7).toString());
        Invitation saved = invitationRepository.save(inv);
        recordActivity(orgId, actor, role, "ORGANIZATION", "Invited " + saved.getName() + " (" + saved.getEmail() + ")", dept.getName());
        return saved;
    }

    @Transactional
    public Invitation resendInvitation(String orgId, String role, String userId, String id) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Invitation inv = invitationRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found."));
        if (!"PENDING".equals(inv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending invitations can be resent.");
        }
        inv.setLastSentAt(Instant.now().toString());
        Invitation saved = invitationRepository.save(inv);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Resent invitation to " + inv.getEmail(), inv.getName());
        return saved;
    }

    @Transactional
    public Invitation cancelInvitation(String orgId, String role, String userId, String id) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Invitation inv = invitationRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found."));
        if (!"PENDING".equals(inv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending invitations can be cancelled.");
        }
        inv.setStatus("CANCELLED");
        Invitation saved = invitationRepository.save(inv);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Revoked invitation for " + inv.getEmail(), inv.getName());
        return saved;
    }

    @Transactional
    public Department createDepartment(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        String name = str(payload, "name", "");
        if (name.length() < 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name must be at least 2 characters.");
        String fallbackCode = name.substring(0, Math.min(3, name.length()));
        String rawCode = str(payload, "code", fallbackCode).toUpperCase();
        if (rawCode.isEmpty()) rawCode = fallbackCode.toUpperCase();
        String code = rawCode.substring(0, Math.min(6, rawCode.length()));
        if (departmentRepository.existsByOrgIdAndCodeIgnoreCase(orgId, code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code " + code + " already exists.");
        }
        String headId = optionalId(payload, "headId");
        if (headId != null && employeeRepository.findByIdAndOrgId(headId, orgId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department head must be an employee in this organization.");
        }
        Department dept = new Department();
        dept.setId(nextId("dept"));
        dept.setOrgId(orgId);
        dept.setName(name);
        dept.setCode(code);
        dept.setHeadId(headId);
        dept.setDescription(str(payload, "description", ""));
        dept.setBudgetCode(str(payload, "budgetCode", "CC-" + code + "-100"));
        dept.setCreatedAt(LocalDate.now().toString());
        Department saved = departmentRepository.save(dept);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Created department " + saved.getName(), saved.getCode());
        return saved;
    }

    @Transactional
    public Department updateDepartment(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Department dept = departmentRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found."));
        if (payload.get("name") instanceof String n && n.trim().length() >= 2) dept.setName(n.trim());
        if (payload.get("description") instanceof String d) dept.setDescription(d.trim());
        if (payload.containsKey("headId")) {
            String headId = optionalId(payload, "headId");
            if (headId != null && employeeRepository.findByIdAndOrgId(headId, orgId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department head must be an employee in this organization.");
            }
            dept.setHeadId(headId);
        }
        if (payload.get("budgetCode") instanceof String b) dept.setBudgetCode(b.trim());
        Department saved = departmentRepository.save(dept);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Updated department " + saved.getName(), saved.getCode());
        return saved;
    }

    @Transactional
    public Map<String, Object> deleteDepartment(String orgId, String role, String userId, String id) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Department dept = departmentRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found."));
        if (employeeRepository.existsByOrgIdAndDepartmentId(orgId, dept.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reassign employees out of this department before deleting it.");
        }
        departmentRepository.delete(dept);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Removed department " + dept.getName(), dept.getCode());
        return Map.of("deleted", true);
    }

    @Transactional
    public Team createTeam(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        String name = str(payload, "name", "");
        if (name.length() < 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team name is required.");
        String deptId = str(payload, "departmentId", "");
        Department dept = departmentRepository.findByIdAndOrgId(deptId, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid department."));
        String leadId = optionalId(payload, "leadId");
        Set<String> members = new LinkedHashSet<>();
        if (leadId != null) members.add(leadId);
        if (payload.get("memberIds") instanceof List<?> rawList) {
            for (Object o : rawList) {
                if (o != null && !String.valueOf(o).isBlank()) {
                    members.add(String.valueOf(o).trim());
                }
            }
        }

        List<Employee> resolvedMembers = new ArrayList<>();
        for (String mId : members) {
            Employee member = employeeRepository.findByIdAndOrgId(mId, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "All team leads and members must belong to this organization."));
            resolvedMembers.add(member);
        }

        Team team = new Team();
        team.setId(nextId("team"));
        team.setOrgId(orgId);
        team.setDepartmentId(dept.getId());
        team.setName(name);
        team.setLeadId(leadId);
        team.setDescription(str(payload, "description", ""));
        team.setMemberIds(new ArrayList<>(members));
        team.setCapacityHoursPerWeek(Math.max(40, members.size() * 40));
        team.setCreatedAt(LocalDate.now().toString());
        Team saved = teamRepository.save(team);

        for (Employee member : resolvedMembers) {
            member.setTeamId(saved.getId());
            employeeRepository.save(member);
        }
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Created team " + saved.getName(), dept.getName());
        return saved;
    }

    @Transactional
    public Team updateTeam(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Team team = teamRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));
        if (payload.get("name") instanceof String n && n.trim().length() >= 2) team.setName(n.trim());
        if (payload.get("description") instanceof String d) team.setDescription(d.trim());
        if (payload.containsKey("leadId")) {
            String nextLeadId = optionalId(payload, "leadId");
            if (nextLeadId != null && employeeRepository.findByIdAndOrgId(nextLeadId, orgId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team lead must belong to this organization.");
            }
            team.setLeadId(nextLeadId);
        }
        if (payload.get("memberIds") instanceof List<?> rawList) {
            Set<String> nextMembers = new LinkedHashSet<>();
            for (Object o : rawList) {
                if (o != null && !String.valueOf(o).isBlank()) {
                    nextMembers.add(String.valueOf(o).trim());
                }
            }
            List<Employee> resolvedMembers = new ArrayList<>();
            for (String mId : nextMembers) {
                Employee member = employeeRepository.findByIdAndOrgId(mId, orgId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "All team members must belong to this organization."));
                resolvedMembers.add(member);
            }
            for (String prevId : team.getMemberIds()) {
                if (!nextMembers.contains(prevId)) {
                    employeeRepository.findByIdAndOrgId(prevId, orgId).ifPresent(e -> {
                        if (team.getId().equals(e.getTeamId())) {
                            e.setTeamId(null);
                            employeeRepository.save(e);
                        }
                    });
                }
            }
            for (Employee member : resolvedMembers) {
                member.setTeamId(team.getId());
                employeeRepository.save(member);
            }
            team.setMemberIds(new ArrayList<>(nextMembers));
            team.setCapacityHoursPerWeek(Math.max(40, nextMembers.size() * 40));
        }
        Team saved = teamRepository.save(team);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Updated team " + saved.getName(), saved.getMemberIds().size() + " members");
        return saved;
    }

    @Transactional
    public Map<String, Object> deleteTeam(String orgId, String role, String userId, String id) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        Team team = teamRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));
        if (projectRepository.existsByOrgIdAndTeamId(orgId, team.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reassign active projects from this team before deleting.");
        }
        for (Employee e : employeeRepository.findByOrgId(orgId)) {
            if (team.getId().equals(e.getTeamId())) {
                e.setTeamId(null);
                employeeRepository.save(e);
            }
        }
        teamRepository.delete(team);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "ORGANIZATION", "Deleted team " + team.getName(), team.getId());
        return Map.of("deleted", true);
    }

    @Transactional
    public Project createProject(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN");
        ensureOrgNotSuspended(orgId);
        String name = str(payload, "name", "");
        if (name.length() < 3) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project name must be at least 3 characters.");
        String teamId = str(payload, "teamId", "");
        Team team = teamRepository.findByIdAndOrgId(teamId, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid team for this project."));
        Employee actor = resolveActor(orgId, role, userId);

        Project project = new Project();
        project.setId(nextId("proj"));
        project.setOrgId(orgId);
        String fallbackCode = "PRJ-" + (projectRepository.findByOrgId(orgId).size() + 1);
        String code = str(payload, "code", fallbackCode).toUpperCase();
        if (code.isEmpty()) code = fallbackCode;
        project.setCode(code.substring(0, Math.min(12, code.length())));
        project.setName(name);
        project.setDescription(str(payload, "description", ""));
        project.setStatus("ACTIVE");
        project.setDepartmentId(team.getDepartmentId());
        project.setTeamId(team.getId());
        project.setLeadId(team.getLeadId() != null ? team.getLeadId() : (actor != null ? actor.getId() : null));
        project.setMemberIds(new ArrayList<>(team.getMemberIds()));
        project.setStartDate(str(payload, "startDate", LocalDate.now().toString()));
        project.setDueDate(str(payload, "dueDate", LocalDate.now().plusDays(45).toString()));
        String priority = str(payload, "priority", "MEDIUM").toUpperCase();
        project.setPriority(VALID_PRIORITIES.contains(priority) ? priority : "MEDIUM");
        int budget = payload.get("budgetHours") instanceof Number n ? Math.max(20, n.intValue()) : 160;
        project.setBudgetHours(budget);
        Project saved = projectRepository.save(project);
        recordActivity(orgId, actor, role, "PROJECT", "Created project " + saved.getName(), saved.getCode());
        return saved;
    }

    @Transactional
    public Project updateProject(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD");
        ensureOrgNotSuspended(orgId);
        Project project = projectRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found."));
        if (payload.get("status") instanceof String st && VALID_PROJECT_STATUSES.contains(st)) project.setStatus(st);
        if (payload.get("dueDate") instanceof String d) project.setDueDate(d);
        if (payload.get("priority") instanceof String p && VALID_PRIORITIES.contains(p)) project.setPriority(p);
        Project saved = projectRepository.save(project);
        recordActivity(orgId, resolveActor(orgId, role, userId), role, "PROJECT", "Updated project " + saved.getCode() + " (" + saved.getStatus() + ")", saved.getName());
        return saved;
    }

    @Transactional
    public TaskItem createTask(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD");
        ensureOrgNotSuspended(orgId);
        String title = str(payload, "title", "");
        if (title.length() < 3) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task title must be at least 3 characters.");
        Project project = projectRepository.findByIdAndOrgId(str(payload, "projectId", ""), orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid project."));
        Employee assignee = employeeRepository.findByIdAndOrgId(str(payload, "assigneeId", ""), orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid assignee."));
        Employee actor = resolveActor(orgId, role, userId);

        TaskItem task = new TaskItem();
        task.setId(nextId("task"));
        task.setOrgId(orgId);
        task.setTaskKey("TSK-" + (taskItemRepository.countByOrgId(orgId) + 101));
        task.setProjectId(project.getId());
        task.setTeamId(project.getTeamId());
        task.setTitle(title);
        task.setDescription(str(payload, "description", ""));
        task.setStatus("TODO");
        String priority = str(payload, "priority", "MEDIUM").toUpperCase();
        task.setPriority(VALID_PRIORITIES.contains(priority) ? priority : "MEDIUM");
        task.setAssigneeId(assignee.getId());
        task.setReporterId(actor != null ? actor.getId() : null);
        task.setDueDate(str(payload, "dueDate", LocalDate.now().plusDays(7).toString()));
        double est = payload.get("estimatedHours") instanceof Number n ? Math.max(1.0, n.doubleValue()) : 6.0;
        task.setEstimatedHours(est);
        task.setLoggedHours(0);
        task.setProgress(0);
        task.setUpdatedAt(Instant.now().toString());
        TaskItem saved = taskItemRepository.save(task);
        recordActivity(orgId, actor, role, "TASK", "Created " + saved.getTaskKey() + ": " + saved.getTitle(), assignee.getName());
        pushNotification(orgId, assignee.getId(), "New task assigned: " + saved.getTaskKey(),
            (actor != null ? actor.getName() : "Lead") + " assigned \"" + saved.getTitle() + "\" (Due " + saved.getDueDate() + ").", "TASK");
        return saved;
    }

    @Transactional
    public TaskItem updateTask(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        ensureOrgNotSuspended(orgId);
        TaskItem task = taskItemRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
        Employee actor = resolveActor(orgId, role, userId);
        boolean canReassign = "ORG_ADMIN".equalsIgnoreCase(role) || "TEAM_LEAD".equalsIgnoreCase(role);
        if (!canReassign && (actor == null || !actor.getId().equals(task.getAssigneeId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: you can only update tasks assigned to you.");
        }
        if (payload.get("assigneeId") instanceof String nextAssigneeId && !nextAssigneeId.equals(task.getAssigneeId())) {
            if (!canReassign) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Team Leads or Admins can reassign tasks.");
            Employee nextAssignee = employeeRepository.findByIdAndOrgId(nextAssigneeId, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid assignee."));
            task.setAssigneeId(nextAssignee.getId());
            pushNotification(orgId, nextAssignee.getId(), "Task reassigned: " + task.getTaskKey(),
                (actor != null ? actor.getName() : "Lead") + " reassigned \"" + task.getTitle() + "\" to you.", "TASK");
        }
        if (payload.get("status") instanceof String st && VALID_TASK_STATUSES.contains(st)) {
            task.setStatus(st);
            if ("DONE".equals(st)) task.setProgress(100);
            else if ("TODO".equals(st) && !payload.containsKey("progress")) task.setProgress(0);
        }
        if (payload.get("progress") instanceof Number p) {
            task.setProgress(Math.max(0, Math.min(100, (int) Math.round(p.doubleValue()))));
        }
        if (canReassign) {
            if (payload.get("priority") instanceof String pr && VALID_PRIORITIES.contains(pr)) task.setPriority(pr);
            if (payload.get("dueDate") instanceof String dd && !dd.isBlank()) task.setDueDate(dd);
        }
        task.setUpdatedAt(Instant.now().toString());
        TaskItem saved = taskItemRepository.save(task);
        recordActivity(orgId, actor, role, "TASK", "Updated " + saved.getTaskKey() + " -> " + saved.getStatus() + " (" + saved.getProgress() + "%)", saved.getTitle());
        return saved;
    }

    @Transactional
    public AttendanceRecord checkIn(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
        Organization org = (orgId != null && !orgId.isBlank()) ? organizationRepository.findById(orgId).orElse(null) : null;
        ensureOrgNotSuspended(org);
        Employee actor = resolveActor(orgId, role, userId);
        if (actor == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active employee profile not found.");
        String today = LocalDate.now().toString();
        Optional<AttendanceRecord> existing = attendanceRepository.findByOrgIdAndEmployeeIdAndWorkDate(orgId, actor.getId(), today);
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already checked in today at " + existing.get().getCheckIn() + ". Duplicate check-in is blocked.");
        }
        String mode = str(payload, "workMode", "OFFICE").toUpperCase();
        if (!Set.of("OFFICE", "REMOTE", "HYBRID").contains(mode)) mode = "OFFICE";
        if ("REMOTE".equals(mode) && org != null && !org.isAllowRemoteCheckIn()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remote check-in is disabled by organization attendance policy.");
        }
        String nowTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        AttendanceRecord rec = new AttendanceRecord();
        rec.setId(nextId("att"));
        rec.setOrgId(orgId);
        rec.setEmployeeId(actor.getId());
        rec.setWorkDate(today);
        rec.setCheckIn(nowTime);
        rec.setCheckOut(null);
        rec.setWorkMode(mode);
        rec.setStatus("CHECKED_IN");
        rec.setHoursWorked(0);
        rec.setNotes(str(payload, "notes", mode + " shift started"));
        AttendanceRecord saved = attendanceRepository.save(rec);
        recordActivity(orgId, actor, role, "ATTENDANCE", "Checked in (" + mode + ") at " + nowTime, today);
        return saved;
    }

    @Transactional
    public AttendanceRecord checkOut(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
        ensureOrgNotSuspended(orgId);
        Employee actor = resolveActor(orgId, role, userId);
        if (actor == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active employee profile not found.");
        String today = LocalDate.now().toString();
        AttendanceRecord rec = attendanceRepository.findByOrgIdAndEmployeeIdAndWorkDate(orgId, actor.getId(), today)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must check in before checking out."));
        if (rec.getCheckOut() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already checked out today at " + rec.getCheckOut() + ".");
        }
        String outTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        double hours = computeHoursBetween(rec.getCheckIn(), outTime);
        rec.setCheckOut(outTime);
        rec.setHoursWorked(hours);
        rec.setStatus("REMOTE".equals(rec.getWorkMode()) ? "REMOTE" : "COMPLETED");
        if (payload != null && payload.get("notes") instanceof String n && !n.isBlank()) rec.setNotes(n.trim());
        AttendanceRecord saved = attendanceRepository.save(rec);
        recordActivity(orgId, actor, role, "ATTENDANCE", "Checked out at " + outTime + " (" + hours + "h logged)", today);
        return saved;
    }

    @Transactional
    public LeaveRequest createLeave(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
        ensureOrgNotSuspended(orgId);
        Employee actor = resolveActor(orgId, role, userId);
        if (actor == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active employee profile not found.");
        String startDate = str(payload, "startDate", "");
        String endDate = str(payload, "endDate", "");
        String reason = str(payload, "reason", "");
        String rawType = str(payload, "type", "ANNUAL").toUpperCase();
        final String type = Set.of("ANNUAL", "SICK", "PERSONAL", "PARENTAL", "UNPAID").contains(rawType) ? rawType : "ANNUAL";

        int days = calculateBusinessDays(startDate, endDate);
        if (days <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected date range must include at least one working day.");
        if (reason.length() < 5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a brief reason (at least 5 characters).");

        List<LeaveRequest> existing = leaveRequestRepository.findByOrgIdAndEmployeeId(orgId, actor.getId());
        for (LeaveRequest req : existing) {
            if (("PENDING".equals(req.getStatus()) || "APPROVED".equals(req.getStatus()))
                && startDate.compareTo(req.getEndDate()) <= 0
                && endDate.compareTo(req.getStartDate()) >= 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Dates overlap with an existing " + req.getStatus().toLowerCase() + " leave (" + req.getStartDate() + " to " + req.getEndDate() + ").");
            }
        }
        if ("ANNUAL".equals(type) && days > actor.getAnnualLeaveBalance()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient annual leave balance.");
        }
        if ("SICK".equals(type) && days > actor.getSickLeaveBalance()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient sick leave balance.");
        }
        if ("PERSONAL".equals(type) && days > actor.getPersonalLeaveBalance()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient personal leave balance.");
        }

        LeaveRequest lr = new LeaveRequest();
        lr.setId(nextId("lv"));
        lr.setOrgId(orgId);
        lr.setEmployeeId(actor.getId());
        lr.setTeamId(actor.getTeamId());
        lr.setType(type);
        lr.setStartDate(startDate);
        lr.setEndDate(endDate);
        lr.setDays(days);
        lr.setReason(reason);
        lr.setStatus("PENDING");
        lr.setCreatedAt(Instant.now().toString());
        LeaveRequest saved = leaveRequestRepository.save(lr);

        recordActivity(orgId, actor, role, "LEAVE", "Requested " + days + "d " + type + " leave (" + startDate + " to " + endDate + ")", actor.getName());
        if (actor.getTeamId() != null) {
            teamRepository.findByIdAndOrgId(actor.getTeamId(), orgId).ifPresent(team -> {
                if (team.getLeadId() != null && !team.getLeadId().equals(actor.getId())) {
                    pushNotification(orgId, team.getLeadId(), "Leave request from " + actor.getName(),
                        days + " day(s) " + type + " leave (" + startDate + " - " + endDate + ") pending review.", "APPROVAL");
                }
            });
        }
        return saved;
    }

    @Transactional
    public LeaveRequest cancelLeave(String orgId, String role, String userId, String id) {
        ensureOrgNotSuspended(orgId);
        LeaveRequest leave = leaveRequestRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found."));
        Employee actor = resolveActor(orgId, role, userId);
        boolean isOwner = actor != null && actor.getId().equals(leave.getEmployeeId());
        if (!isOwner && !"ORG_ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: you can only cancel your own leave requests.");
        }
        if (!"PENDING".equals(leave.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending leave requests can be cancelled.");
        }
        leave.setStatus("CANCELLED");
        LeaveRequest saved = leaveRequestRepository.save(leave);
        recordActivity(orgId, actor, role, "LEAVE", "Cancelled leave request (" + leave.getStartDate() + " to " + leave.getEndDate() + ")", leave.getId());
        return saved;
    }

    @Transactional
    public LeaveRequest reviewLeave(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD");
        ensureOrgNotSuspended(orgId);
        LeaveRequest leave = leaveRequestRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found."));
        if (!"PENDING".equals(leave.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave request has already been " + leave.getStatus().toLowerCase() + ".");
        }
        String decision = str(payload, "decision", "").toUpperCase();
        String note = str(payload, "note", "");
        if (!"APPROVED".equals(decision) && !"REJECTED".equals(decision)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be APPROVED or REJECTED.");
        }
        if ("REJECTED".equals(decision) && note.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a rejection reason (at least 4 characters).");
        }
        Employee reviewer = resolveActor(orgId, role, userId);
        if ("TEAM_LEAD".equalsIgnoreCase(role) && reviewer != null && reviewer.getId().equals(leave.getEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Team Leads cannot review their own leave requests.");
        }
        leave.setStatus(decision);
        leave.setReviewerId(reviewer != null ? reviewer.getId() : null);
        leave.setReviewerNote(note.isEmpty() ? "Approved." : note);
        leave.setReviewedAt(Instant.now().toString());
        LeaveRequest saved = leaveRequestRepository.save(leave);

        employeeRepository.findByIdAndOrgId(leave.getEmployeeId(), orgId).ifPresent(requester -> {
            if ("APPROVED".equals(decision)) {
                if ("ANNUAL".equals(leave.getType())) requester.setAnnualLeaveBalance(Math.max(0, requester.getAnnualLeaveBalance() - leave.getDays()));
                if ("SICK".equals(leave.getType())) requester.setSickLeaveBalance(Math.max(0, requester.getSickLeaveBalance() - leave.getDays()));
                if ("PERSONAL".equals(leave.getType())) requester.setPersonalLeaveBalance(Math.max(0, requester.getPersonalLeaveBalance() - leave.getDays()));
                employeeRepository.save(requester);
            }
            recordActivity(orgId, reviewer, role, "APPROVAL", decision + " " + requester.getName() + "'s leave", leave.getStartDate() + " - " + leave.getEndDate());
            pushNotification(orgId, requester.getId(), "Leave request " + decision.toLowerCase(),
                (reviewer != null ? reviewer.getName() : "Reviewer") + " " + decision.toLowerCase() + " your leave. " + saved.getReviewerNote(), "LEAVE");
        });
        return saved;
    }

    @Transactional
    public WorklogEntry createWorklog(String orgId, String role, String userId, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
        ensureOrgNotSuspended(orgId);
        Employee actor = resolveActor(orgId, role, userId);
        if (actor == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active employee profile not found.");
        Project project = projectRepository.findByIdAndOrgId(str(payload, "projectId", ""), orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid project."));

        String workDate = str(payload, "date", LocalDate.now().toString());
        LocalDate parsed;
        try {
            parsed = LocalDate.parse(workDate);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worklog date must use YYYY-MM-DD format.");
        }

        double hours;
        try {
            Object rawHours = payload != null ? payload.get("hours") : null;
            hours = rawHours instanceof Number n ? n.doubleValue() : Double.parseDouble(String.valueOf(rawHours != null ? rawHours : "0"));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Logged hours must be a valid number.");
        }
        String summary = str(payload, "summary", "");
        if (!Double.isFinite(hours) || hours < 0.25 || hours > 16.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Logged hours must be between 0.25 and 16 hours.");
        }
        if (summary.length() < 4) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a short summary of work completed.");

        String requestedTaskId = optionalId(payload, "taskId");
        TaskItem linkedTask = null;
        if (requestedTaskId != null) {
            linkedTask = taskItemRepository.findByIdAndOrgId(requestedTaskId, orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected task does not belong to this organization."));
            if (!project.getId().equals(linkedTask.getProjectId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected task does not belong to the chosen project.");
            }
        }

        LocalDate weekStart = parsed.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        TimesheetRecord ts = timesheetRepository.findByOrgIdAndEmployeeIdAndWeekStart(orgId, actor.getId(), weekStart.toString())
            .orElseGet(() -> {
                TimesheetRecord fresh = new TimesheetRecord();
                fresh.setId(nextId("ts"));
                fresh.setOrgId(orgId);
                fresh.setEmployeeId(actor.getId());
                fresh.setTeamId(actor.getTeamId());
                fresh.setWeekStart(weekStart.toString());
                fresh.setWeekEnd(weekEnd.toString());
                fresh.setStatus("DRAFT");
                return fresh;
            });
        if ("SUBMITTED".equals(ts.getStatus()) || "APPROVED".equals(ts.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot log new hours for week " + ts.getWeekStart() + " because the timesheet is already " + ts.getStatus().toLowerCase() + "."
            );
        }

        double existingDaily = worklogRepository.findByOrgIdAndEmployeeIdAndWorkDate(orgId, actor.getId(), workDate)
            .stream().mapToDouble(WorklogEntry::getHours).sum();
        if (existingDaily + hours > 24.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total hours on " + workDate + " cannot exceed 24h.");
        }

        WorklogEntry entry = new WorklogEntry();
        entry.setId(nextId("wl"));
        entry.setOrgId(orgId);
        entry.setEmployeeId(actor.getId());
        entry.setProjectId(project.getId());
        entry.setTaskId(linkedTask != null ? linkedTask.getId() : null);
        entry.setWorkDate(workDate);
        entry.setHours(Math.round(hours * 100.0) / 100.0);
        entry.setBillable(payload == null || !Boolean.FALSE.equals(payload.get("billable")));
        entry.setSummary(summary);
        entry.setStatus("LOGGED");
        entry.setCreatedAt(Instant.now().toString());
        WorklogEntry saved = worklogRepository.save(entry);

        if (linkedTask != null) {
            linkedTask.setLoggedHours(Math.round((linkedTask.getLoggedHours() + saved.getHours()) * 100.0) / 100.0);
            taskItemRepository.save(linkedTask);
        }

        ts.setTotalHours(Math.round((ts.getTotalHours() + saved.getHours()) * 100.0) / 100.0);
        if (saved.isBillable()) ts.setBillableHours(Math.round((ts.getBillableHours() + saved.getHours()) * 100.0) / 100.0);
        ts.setEntriesCount(ts.getEntriesCount() + 1);
        timesheetRepository.save(ts);

        recordActivity(orgId, actor, role, "TIMESHEET", "Logged " + saved.getHours() + "h on " + project.getCode(), saved.getSummary());
        return saved;
    }

    @Transactional
    public TimesheetRecord submitTimesheet(String orgId, String role, String userId, String id) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD", "PROFESSIONAL", "EMPLOYEE");
        ensureOrgNotSuspended(orgId);
        Employee actor = resolveActor(orgId, role, userId);
        TimesheetRecord ts = timesheetRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found."));
        if (actor == null || !actor.getId().equals(ts.getEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: you can only submit your own timesheet.");
        }
        if (!"DRAFT".equals(ts.getStatus()) && !"REJECTED".equals(ts.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Timesheet is already " + ts.getStatus().toLowerCase() + ".");
        }
        if (ts.getTotalHours() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Log at least one worklog entry before submitting.");
        }
        ts.setStatus("SUBMITTED");
        ts.setSubmittedAt(Instant.now().toString());
        ts.setReviewerNote(null);
        TimesheetRecord saved = timesheetRepository.save(ts);

        for (WorklogEntry w : worklogRepository.findByOrgIdAndEmployeeIdAndStatusAndWorkDateBetween(
            orgId, actor.getId(), "LOGGED", ts.getWeekStart(), ts.getWeekEnd()
        )) {
            if (isDateWithinRange(w.getWorkDate(), ts.getWeekStart(), ts.getWeekEnd())) {
                w.setStatus("SUBMITTED");
                worklogRepository.save(w);
            }
        }
        recordActivity(orgId, actor, role, "TIMESHEET", "Submitted weekly timesheet (" + ts.getTotalHours() + "h)", ts.getWeekStart() + " - " + ts.getWeekEnd());
        return saved;
    }

    @Transactional
    public TimesheetRecord reviewTimesheet(String orgId, String role, String userId, String id, Map<String, Object> payload) {
        requireRole(role, "ORG_ADMIN", "TEAM_LEAD");
        ensureOrgNotSuspended(orgId);
        TimesheetRecord ts = timesheetRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found."));
        if (!"SUBMITTED".equals(ts.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only submitted timesheets can be reviewed.");
        }
        String decision = str(payload, "decision", "").toUpperCase();
        String note = str(payload, "note", "");
        if (!"APPROVED".equals(decision) && !"REJECTED".equals(decision)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be APPROVED or REJECTED.");
        }
        if ("REJECTED".equals(decision) && note.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Include a rejection note (at least 4 characters).");
        }
        Employee reviewer = resolveActor(orgId, role, userId);
        if ("TEAM_LEAD".equalsIgnoreCase(role) && reviewer != null && reviewer.getId().equals(ts.getEmployeeId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Team Leads cannot review their own timesheets.");
        }
        ts.setStatus(decision);
        ts.setReviewerId(reviewer != null ? reviewer.getId() : null);
        ts.setReviewerNote(note.isEmpty() ? "Verified and approved." : note);
        ts.setReviewedAt(Instant.now().toString());
        TimesheetRecord saved = timesheetRepository.save(ts);

        for (WorklogEntry w : worklogRepository.findByOrgIdAndEmployeeIdAndStatusAndWorkDateBetween(
            orgId, ts.getEmployeeId(), "SUBMITTED", ts.getWeekStart(), ts.getWeekEnd()
        )) {
            if (isDateWithinRange(w.getWorkDate(), ts.getWeekStart(), ts.getWeekEnd())) {
                w.setStatus(decision);
                worklogRepository.save(w);
            }
        }
        recordActivity(orgId, reviewer, role, "APPROVAL", decision + " timesheet (" + ts.getTotalHours() + "h)", ts.getWeekStart() + " - " + ts.getWeekEnd());
        pushNotification(orgId, ts.getEmployeeId(), "Timesheet " + decision.toLowerCase(),
            (reviewer != null ? reviewer.getName() : "Reviewer") + " " + decision.toLowerCase() + " your timesheet. " + saved.getReviewerNote(), "APPROVAL");
        return saved;
    }

    @Transactional
    public WorkspaceNotification markNotificationRead(String orgId, String role, String userId, String id) {
        ensureOrgNotSuspended(orgId);
        WorkspaceNotification ntf = notificationRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        boolean isAdmin = "ORG_ADMIN".equalsIgnoreCase(role);
        Employee actor = resolveActor(orgId, role, userId);
        if (!isAdmin && (actor == null || !actor.getId().equals(ntf.getRecipientId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: you can only mark your own notifications as read.");
        }
        ntf.setReadFlag(true);
        return notificationRepository.save(ntf);
    }

    @Transactional
    public Map<String, Object> markAllNotificationsRead(String orgId, String role, String userId) {
        ensureOrgNotSuspended(orgId);
        Employee actor = resolveActor(orgId, role, userId);
        List<WorkspaceNotification> items = "ORG_ADMIN".equalsIgnoreCase(role)
            ? notificationRepository.findByOrgIdOrderByCreatedAtDesc(orgId)
            : (actor != null ? notificationRepository.findByOrgIdAndRecipientIdOrderByCreatedAtDesc(orgId, actor.getId()) : List.of());
        for (WorkspaceNotification n : items) {
            if (!n.isReadFlag()) {
                n.setReadFlag(true);
                notificationRepository.save(n);
            }
        }
        return Map.of("ok", true);
    }
}
