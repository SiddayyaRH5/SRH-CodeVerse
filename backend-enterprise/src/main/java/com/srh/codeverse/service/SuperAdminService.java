package com.srh.codeverse.service;

import com.srh.codeverse.entity.*;
import com.srh.codeverse.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Platform-level governance service for the hidden Super Admin workspace.
 * Operates exclusively on real MySQL data through Spring Data JPA repositories.
 * Records an immutable PlatformAuditLog row for every administrative mutation.
 */
@Service
public class SuperAdminService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final Set<String> VALID_PLATFORM_ROLES = Set.of("SUPER_ADMIN", "USER");
    private static final Set<String> VALID_USER_STATUSES = Set.of("ACTIVE", "SUSPENDED");

    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final TaskItemRepository taskItemRepository;
    private final AuditActivityRepository auditActivityRepository;
    private final PlatformUserRepository platformUserRepository;
    private final PlatformAuditLogRepository platformAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SuperAdminAuthService superAdminAuthService;
    private final WorkspaceSessionRepository workspaceSessionRepository;

    public SuperAdminService(
        OrganizationRepository organizationRepository,
        DepartmentRepository departmentRepository,
        TeamRepository teamRepository,
        EmployeeRepository employeeRepository,
        ProjectRepository projectRepository,
        TaskItemRepository taskItemRepository,
        AuditActivityRepository auditActivityRepository,
        PlatformUserRepository platformUserRepository,
        PlatformAuditLogRepository platformAuditLogRepository,
        PasswordEncoder passwordEncoder,
        SuperAdminAuthService superAdminAuthService,
        WorkspaceSessionRepository workspaceSessionRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.taskItemRepository = taskItemRepository;
        this.auditActivityRepository = auditActivityRepository;
        this.platformUserRepository = platformUserRepository;
        this.platformAuditLogRepository = platformAuditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.superAdminAuthService = superAdminAuthService;
        this.workspaceSessionRepository = workspaceSessionRepository;
    }

    private String nextId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        if (payload == null) return fallback;
        Object val = payload.get(key);
        if (val == null) return fallback;
        String s = String.valueOf(val).trim();
        return s.isEmpty() ? fallback : s;
    }

    private String rawStr(Map<String, Object> payload, String key) {
        if (payload == null) return "";
        Object val = payload.get(key);
        return val == null ? "" : String.valueOf(val);
    }

    private String normalizeSlug(String raw, String fallbackName) {
        String source = (raw != null && !raw.isBlank()) ? raw : fallbackName;
        String cleaned = source.trim().toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");
        return cleaned;
    }

    private void recordAudit(PlatformUser actor, String action, String targetType, String targetId, String details, String ipAddress) {
        PlatformAuditLog log = new PlatformAuditLog();
        log.setId(nextId("pal"));
        log.setActorUserId(actor.getId());
        log.setActorEmail(actor.getEmail());
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        log.setIpAddress(ipAddress != null && !ipAddress.isBlank() ? ipAddress : "unknown");
        log.setCreatedAt(Instant.now().toString());
        platformAuditLogRepository.save(log);
    }

    private Map<String, Object> enrichOrganizationSummary(Organization org) {
        String orgId = org.getId();
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", orgId);
        row.put("name", org.getName());
        row.put("slug", org.getSlug());
        row.put("industry", org.getIndustry());
        row.put("domain", org.getDomain());
        row.put("timezone", org.getTimezone());
        row.put("location", org.getLocation());
        row.put("workWeek", org.getWorkWeek());
        row.put("plan", org.getPlan());
        row.put("status", org.getStatus() != null ? org.getStatus() : "ACTIVE");
        row.put("suspendedAt", org.getSuspendedAt());
        row.put("suspensionReason", org.getSuspensionReason());
        row.put("createdAt", org.getCreatedAt());
        row.put("updatedAt", org.getUpdatedAt());
        row.put("attendancePolicy", org.getAttendancePolicy());
        row.put("employeeCount", employeeRepository.countByOrgId(orgId));
        row.put("departmentCount", departmentRepository.countByOrgId(orgId));
        row.put("teamCount", teamRepository.countByOrgId(orgId));
        row.put("projectCount", projectRepository.countByOrgId(orgId));
        row.put("taskCount", taskItemRepository.countByOrgId(orgId));
        row.put("adminCount", employeeRepository.countByOrgIdAndRole(orgId, "ORG_ADMIN"));
        return row;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOverview(PlatformUser actor) {
        List<Organization> orgs = organizationRepository.findAllByOrderByCreatedAtDesc();
        long totalOrgs = orgs.size();
        long activeOrgs = orgs.stream().filter(o -> !"SUSPENDED".equalsIgnoreCase(o.getStatus())).count();
        long suspendedOrgs = totalOrgs - activeOrgs;

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalOrganizations", totalOrgs);
        metrics.put("activeOrganizations", activeOrgs);
        metrics.put("suspendedOrganizations", suspendedOrgs);
        metrics.put("totalPlatformUsers", platformUserRepository.count());
        metrics.put("activeSuperAdmins", platformUserRepository.countByPlatformRoleAndStatus("SUPER_ADMIN", "ACTIVE"));
        metrics.put("totalEmployees", employeeRepository.count());
        metrics.put("totalTeams", teamRepository.count());
        metrics.put("totalProjects", projectRepository.count());
        metrics.put("totalTasks", taskItemRepository.count());

        List<Map<String, Object>> recentOrganizations = orgs.stream()
            .limit(8)
            .map(this::enrichOrganizationSummary)
            .toList();

        List<PlatformAuditLog> recentAuditLogs = platformAuditLogRepository.findTop100ByOrderByCreatedAtDesc()
            .stream()
            .limit(12)
            .toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("actor", superAdminAuthService.sanitizeUser(actor));
        payload.put("metrics", metrics);
        payload.put("recentOrganizations", recentOrganizations);
        payload.put("recentAuditLogs", recentAuditLogs);
        return payload;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOrganizations(String query, String statusFilter) {
        String q = query != null ? query.trim().toLowerCase() : "";
        String sf = statusFilter != null ? statusFilter.trim().toUpperCase() : "";

        return organizationRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(org -> {
                String st = org.getStatus() != null ? org.getStatus().toUpperCase() : "ACTIVE";
                if (!sf.isEmpty() && !"ALL".equals(sf) && !st.equals(sf)) {
                    return false;
                }
                if (q.isEmpty()) return true;
                String hay = (
                    (org.getName() != null ? org.getName() : "") + " " +
                    (org.getSlug() != null ? org.getSlug() : "") + " " +
                    (org.getIndustry() != null ? org.getIndustry() : "") + " " +
                    (org.getDomain() != null ? org.getDomain() : "") + " " +
                    (org.getLocation() != null ? org.getLocation() : "")
                ).toLowerCase();
                return hay.contains(q);
            })
            .map(this::enrichOrganizationSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrganizationDetails(String orgId) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found."));

        // Expose only organizational governance metadata for ORG_ADMINs (no private phone numbers or personal balances)
        List<Map<String, Object>> orgAdmins = employeeRepository.findByOrgIdAndRole(orgId, "ORG_ADMIN").stream()
            .map(emp -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", emp.getId());
                row.put("name", emp.getName());
                row.put("email", emp.getEmail());
                row.put("title", emp.getTitle());
                row.put("status", emp.getStatus());
                row.put("joinedAt", emp.getJoinedAt());
                return row;
            }).toList();

        List<AuditActivity> recentOrgActivity = auditActivityRepository.findTop15ByOrgIdOrderByTimestampDesc(orgId);
        List<PlatformAuditLog> governanceHistory = platformAuditLogRepository.findTop50ByTargetIdOrderByCreatedAtDesc(orgId);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("organization", enrichOrganizationSummary(org));
        detail.put("administrators", orgAdmins);
        detail.put("recentOrgActivity", recentOrgActivity);
        detail.put("governanceHistory", governanceHistory);
        return detail;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> createOrganization(PlatformUser actor, Map<String, Object> payload, String ipAddress) {
        String name = str(payload, "name", "");
        if (name.length() < 2 || name.length() > 140) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization name must be between 2 and 140 characters.");
        }
        String rawSlug = str(payload, "slug", "");
        String slug = normalizeSlug(rawSlug, name);
        if (slug.length() < 2 || !SLUG_PATTERN.matcher(slug).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization slug must contain lowercase letters, numbers, and hyphens.");
        }
        if (organizationRepository.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An organization with slug '" + slug + "' already exists.");
        }

        Organization org = new Organization();
        org.setId(nextId("org"));
        org.setName(name);
        org.setSlug(slug);
        org.setIndustry(str(payload, "industry", ""));
        org.setDomain(str(payload, "domain", ""));
        org.setTimezone(str(payload, "timezone", "UTC"));
        org.setLocation(str(payload, "location", ""));
        org.setWorkWeek(str(payload, "workWeek", "Mon - Fri"));
        org.setPlan(str(payload, "plan", "Enterprise Workspace"));
        org.setStatus("ACTIVE");
        org.setCreatedAt(LocalDate.now().toString());
        org.setUpdatedAt(Instant.now().toString());

        if (payload.get("attendancePolicy") instanceof Map<?, ?> policy) {
            if (policy.get("standardStart") instanceof String s && !s.isBlank()) org.setStandardStart(s.trim());
            if (policy.get("standardEnd") instanceof String s && !s.isBlank()) org.setStandardEnd(s.trim());
            if (policy.get("graceMinutes") instanceof Number n) org.setGraceMinutes(Math.max(0, Math.min(60, n.intValue())));
            if (policy.get("allowRemoteCheckIn") instanceof Boolean b) org.setAllowRemoteCheckIn(b);
        }

        Organization saved = organizationRepository.save(org);
        recordAudit(
            actor,
            "ORG_CREATED",
            "ORGANIZATION",
            saved.getId(),
            "Created organization '" + saved.getName() + "' (slug: " + saved.getSlug() + ").",
            ipAddress
        );
        return enrichOrganizationSummary(saved);
    }

    @Transactional
    public Map<String, Object> updateOrganization(PlatformUser actor, String orgId, Map<String, Object> payload, String ipAddress) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found."));

        if (payload.get("name") instanceof String name) {
            if (name.trim().length() < 2 || name.trim().length() > 140) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization name must be between 2 and 140 characters.");
            }
            org.setName(name.trim());
        }
        if (payload.get("slug") instanceof String rawSlug && !rawSlug.isBlank()) {
            String nextSlug = normalizeSlug(rawSlug, org.getName());
            if (nextSlug.length() < 2 || !SLUG_PATTERN.matcher(nextSlug).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid organization slug format.");
            }
            if (!nextSlug.equalsIgnoreCase(org.getSlug()) && organizationRepository.existsBySlugIgnoreCase(nextSlug)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug '" + nextSlug + "' is already in use.");
            }
            org.setSlug(nextSlug);
        }
        if (payload.get("industry") instanceof String v) org.setIndustry(v.trim());
        if (payload.get("domain") instanceof String v) org.setDomain(v.trim());
        if (payload.get("timezone") instanceof String v) org.setTimezone(v.trim());
        if (payload.get("location") instanceof String v) org.setLocation(v.trim());
        if (payload.get("workWeek") instanceof String v) org.setWorkWeek(v.trim());
        if (payload.get("plan") instanceof String v && !v.isBlank()) org.setPlan(v.trim());
        if (payload.get("attendancePolicy") instanceof Map<?, ?> policy) {
            if (policy.get("standardStart") instanceof String s && !s.isBlank()) org.setStandardStart(s.trim());
            if (policy.get("standardEnd") instanceof String s && !s.isBlank()) org.setStandardEnd(s.trim());
            if (policy.get("graceMinutes") instanceof Number n) org.setGraceMinutes(Math.max(0, Math.min(60, n.intValue())));
            if (policy.get("allowRemoteCheckIn") instanceof Boolean b) org.setAllowRemoteCheckIn(b);
        }
        org.setUpdatedAt(Instant.now().toString());

        Organization saved = organizationRepository.save(org);
        recordAudit(
            actor,
            "ORG_UPDATED",
            "ORGANIZATION",
            saved.getId(),
            "Updated profile/plan settings for '" + saved.getName() + "'.",
            ipAddress
        );
        return enrichOrganizationSummary(saved);
    }

    @Transactional
    public Map<String, Object> activateOrganization(PlatformUser actor, String orgId, String ipAddress) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found."));
        org.setStatus("ACTIVE");
        org.setSuspendedAt(null);
        org.setSuspensionReason(null);
        org.setUpdatedAt(Instant.now().toString());
        Organization saved = organizationRepository.save(org);

        recordAudit(
            actor,
            "ORG_ACTIVATED",
            "ORGANIZATION",
            saved.getId(),
            "Activated organization '" + saved.getName() + "'.",
            ipAddress
        );
        return enrichOrganizationSummary(saved);
    }

    @Transactional
    public Map<String, Object> suspendOrganization(PlatformUser actor, String orgId, String rawReason, String ipAddress) {
        String reason = rawReason != null ? rawReason.trim() : "";
        if (reason.length() < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Suspension reason must be at least 5 characters.");
        }
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found."));
        String now = Instant.now().toString();
        org.setStatus("SUSPENDED");
        org.setSuspendedAt(now);
        org.setSuspensionReason(reason);
        org.setUpdatedAt(now);
        Organization saved = organizationRepository.save(org);

        if (workspaceSessionRepository != null) {
            for (Employee emp : employeeRepository.findByOrgId(orgId)) {
                for (com.srh.codeverse.entity.WorkspaceSession s : workspaceSessionRepository.findByEmployeeIdAndRevokedFalse(emp.getId())) {
                    s.setRevoked(true);
                    workspaceSessionRepository.save(s);
                }
            }
        }

        recordAudit(
            actor,
            "ORG_SUSPENDED",
            "ORGANIZATION",
            saved.getId(),
            "Suspended organization '" + saved.getName() + "'. Reason: " + reason,
            ipAddress
        );
        return enrichOrganizationSummary(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPlatformUsers(String query, String roleFilter, String statusFilter) {
        String q = query != null ? query.trim().toLowerCase() : "";
        String rf = roleFilter != null ? roleFilter.trim().toUpperCase() : "";
        String sf = statusFilter != null ? statusFilter.trim().toUpperCase() : "";

        return platformUserRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(u -> {
                if (!rf.isEmpty() && !"ALL".equals(rf) && !rf.equalsIgnoreCase(u.getPlatformRole())) return false;
                if (!sf.isEmpty() && !"ALL".equals(sf) && !sf.equalsIgnoreCase(u.getStatus())) return false;
                if (q.isEmpty()) return true;
                String hay = (u.getName() + " " + u.getEmail() + " " + u.getPlatformRole()).toLowerCase();
                return hay.contains(q);
            })
            .map(superAdminAuthService::sanitizeUser)
            .toList();
    }

    @Transactional
    public Map<String, Object> createPlatformUser(PlatformUser actor, Map<String, Object> payload, String ipAddress) {
        String name = str(payload, "name", "");
        String email = str(payload, "email", "").toLowerCase();
        String password = rawStr(payload, "password");
        String role = str(payload, "platformRole", "USER").toUpperCase();

        if (name.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name must be at least 2 characters.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        if (password.length() < 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 12 characters.");
        }
        if (!VALID_PLATFORM_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid platform role. Allowed: SUPER_ADMIN, USER.");
        }
        if (platformUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A platform account with this email already exists.");
        }

        PlatformUser user = new PlatformUser();
        user.setId(nextId("pu"));
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setPlatformRole(role);
        user.setStatus("ACTIVE");
        user.setCreatedAt(Instant.now().toString());
        PlatformUser saved = platformUserRepository.save(user);

        recordAudit(
            actor,
            "PLATFORM_USER_CREATED",
            "PLATFORM_USER",
            saved.getId(),
            "Provisioned platform account " + saved.getEmail() + " (" + saved.getPlatformRole() + ").",
            ipAddress
        );
        return superAdminAuthService.sanitizeUser(saved);
    }

    @Transactional
    public Map<String, Object> updatePlatformUser(PlatformUser actor, String targetId, Map<String, Object> payload, String ipAddress) {
        PlatformUser target = platformUserRepository.findById(targetId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform user not found."));

        String nextRole = payload.get("platformRole") instanceof String r && !r.isBlank()
            ? r.trim().toUpperCase()
            : target.getPlatformRole();
        String nextStatus = payload.get("status") instanceof String s && !s.isBlank()
            ? s.trim().toUpperCase()
            : target.getStatus();

        if (!VALID_PLATFORM_ROLES.contains(nextRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid platform role.");
        }
        if (!VALID_USER_STATUSES.contains(nextStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status. Allowed: ACTIVE, SUSPENDED.");
        }

        boolean isSelf = actor.getId().equals(target.getId());
        if (isSelf && (!"SUPER_ADMIN".equals(nextRole) || !"ACTIVE".equals(nextStatus))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot suspend or demote your own Super Admin account.");
        }

        boolean wasActiveSuperAdmin = "SUPER_ADMIN".equals(target.getPlatformRole()) && "ACTIVE".equals(target.getStatus());
        boolean remainsActiveSuperAdmin = "SUPER_ADMIN".equals(nextRole) && "ACTIVE".equals(nextStatus);
        if (wasActiveSuperAdmin && !remainsActiveSuperAdmin) {
            if (platformUserRepository.countByPlatformRoleAndStatus("SUPER_ADMIN", "ACTIVE") <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Platform must retain at least one active SUPER_ADMIN.");
            }
        }

        if (payload.get("name") instanceof String n && n.trim().length() >= 2) {
            target.setName(n.trim());
        }
        target.setPlatformRole(nextRole);
        target.setStatus(nextStatus);

        PlatformUser saved = platformUserRepository.save(target);

        if (!remainsActiveSuperAdmin) {
            superAdminAuthService.revokeAllSessionsForUser(saved.getId());
        }

        recordAudit(
            actor,
            "PLATFORM_USER_UPDATED",
            "PLATFORM_USER",
            saved.getId(),
            "Updated platform account " + saved.getEmail() + " -> role=" + saved.getPlatformRole() + ", status=" + saved.getStatus() + ".",
            ipAddress
        );
        return superAdminAuthService.sanitizeUser(saved);
    }

    @Transactional(readOnly = true)
    public List<PlatformAuditLog> listAuditLogs(String query, String actionFilter) {
        String q = query != null ? query.trim().toLowerCase() : "";
        String af = actionFilter != null ? actionFilter.trim().toUpperCase() : "";

        return platformAuditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
            .filter(log -> {
                if (!af.isEmpty() && !"ALL".equals(af) && !af.equalsIgnoreCase(log.getAction())) return false;
                if (q.isEmpty()) return true;
                String hay = (
                    (log.getActorEmail() != null ? log.getActorEmail() : "") + " " +
                    (log.getAction() != null ? log.getAction() : "") + " " +
                    (log.getTargetType() != null ? log.getTargetType() : "") + " " +
                    (log.getTargetId() != null ? log.getTargetId() : "") + " " +
                    (log.getDetails() != null ? log.getDetails() : "")
                ).toLowerCase();
                return hay.contains(q);
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics() {
        List<Organization> orgs = organizationRepository.findAllByOrderByCreatedAtDesc();

        // Organization creation growth grouped by YYYY-MM
        Map<String, Long> monthlyCounts = new TreeMap<>();
        for (Organization org : orgs) {
            String created = org.getCreatedAt();
            String bucket = (created != null && created.length() >= 7) ? created.substring(0, 7) : "Unknown";
            monthlyCounts.merge(bucket, 1L, Long::sum);
        }
        List<Map<String, Object>> organizationGrowth = monthlyCounts.entrySet().stream()
            .map(e -> Map.<String, Object>of("month", e.getKey(), "count", e.getValue()))
            .toList();

        long activeOrgs = orgs.stream().filter(o -> !"SUSPENDED".equalsIgnoreCase(o.getStatus())).count();
        long suspendedOrgs = orgs.size() - activeOrgs;
        List<Map<String, Object>> organizationStatusBreakdown = List.of(
            Map.of("status", "ACTIVE", "count", activeOrgs),
            Map.of("status", "SUSPENDED", "count", suspendedOrgs)
        );

        List<Map<String, Object>> organizationFootprint = orgs.stream().map(org -> {
            String orgId = org.getId();
            long totalTasks = taskItemRepository.countByOrgId(orgId);
            long doneTasks = taskItemRepository.countByOrgIdAndStatus(orgId, "DONE");
            int completionRate = totalTasks > 0 ? (int) Math.round((doneTasks * 100.0) / totalTasks) : 0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("orgId", orgId);
            row.put("name", org.getName());
            row.put("slug", org.getSlug());
            row.put("status", org.getStatus() != null ? org.getStatus() : "ACTIVE");
            row.put("employees", employeeRepository.countByOrgId(orgId));
            row.put("teams", teamRepository.countByOrgId(orgId));
            row.put("projects", projectRepository.countByOrgId(orgId));
            row.put("totalTasks", totalTasks);
            row.put("completedTasks", doneTasks);
            row.put("completionRate", completionRate);
            row.put("activityEvents", auditActivityRepository.countByOrgId(orgId));
            return row;
        }).toList();

        // Monthly user growth from real employee joinedAt + platform_users createdAt records
        Map<String, Long> userMonthlyCounts = new TreeMap<>();
        for (Employee emp : employeeRepository.findAll()) {
            String joined = emp.getJoinedAt();
            String bucket = (joined != null && joined.length() >= 7) ? joined.substring(0, 7) : "Unknown";
            userMonthlyCounts.merge(bucket, 1L, Long::sum);
        }
        for (PlatformUser pu : platformUserRepository.findAll()) {
            String created = pu.getCreatedAt();
            String bucket = (created != null && created.length() >= 7) ? created.substring(0, 7) : "Unknown";
            userMonthlyCounts.merge(bucket, 1L, Long::sum);
        }
        List<Map<String, Object>> userGrowth = userMonthlyCounts.entrySet().stream()
            .map(e -> Map.<String, Object>of("month", e.getKey(), "count", e.getValue()))
            .toList();

        List<Map<String, Object>> projectStatusBreakdown = List.of("PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED").stream()
            .map(st -> Map.<String, Object>of("status", st, "count", projectRepository.countByStatus(st)))
            .toList();

        List<Map<String, Object>> platformAccountBreakdown = List.of(
            Map.of("label", "Active Super Admins", "count", platformUserRepository.countByPlatformRoleAndStatus("SUPER_ADMIN", "ACTIVE")),
            Map.of("label", "Suspended Super Admins", "count", platformUserRepository.countByPlatformRoleAndStatus("SUPER_ADMIN", "SUSPENDED")),
            Map.of("label", "Active Standard Accounts", "count", platformUserRepository.countByPlatformRoleAndStatus("USER", "ACTIVE")),
            Map.of("label", "Suspended Standard Accounts", "count", platformUserRepository.countByPlatformRoleAndStatus("USER", "SUSPENDED"))
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("organizationGrowth", organizationGrowth);
        payload.put("userGrowth", userGrowth);
        payload.put("organizationStatusBreakdown", organizationStatusBreakdown);
        payload.put("projectStatusBreakdown", projectStatusBreakdown);
        payload.put("organizationFootprint", organizationFootprint);
        payload.put("platformAccountBreakdown", platformAccountBreakdown);
        payload.put("totalOrganizationActivityEvents", auditActivityRepository.count());
        return payload;
    }
}
