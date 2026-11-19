package com.srhcodeverse.backend.controller.admin;

import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.Locale;

/** Super-admin platform APIs. User projections never expose credential fields. */
@RestController
@RequestMapping("/api/admin/platform")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PlatformAdminController {
    private final UserRepository users;
    private final RoleRepository roles;
    private final CourseRepository courses;
    private final ProblemRepository problems;
    private final SubmissionRepository submissions;
    private final PlatformAuditLogRepository auditLogs;
    private final PlatformOrganizationRepository organizations;

    public PlatformAdminController(UserRepository users, RoleRepository roles, CourseRepository courses,
            ProblemRepository problems, SubmissionRepository submissions, PlatformAuditLogRepository auditLogs,
            PlatformOrganizationRepository organizations) {
        this.users = users; this.roles = roles; this.courses = courses;
        this.problems = problems; this.submissions = submissions; this.auditLogs = auditLogs;
        this.organizations = organizations;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        Map<String, Long> roleCounts = new LinkedHashMap<>();
        for (String roleName : List.of("STUDENT", "TRAINER", "ADMIN", "ORG_ADMIN", "SUPER_ADMIN")) {
            roleCounts.put(roleName, roles.findByName(roleName).map(users::countByRole).orElse(0L));
        }
        return Map.of("totalUsers", users.count(), "roleCounts", roleCounts,
                "totalCourses", courses.count(), "totalProblems", problems.count(),
                "totalSubmissions", submissions.count(), "totalOrganizations", organizations.count());
    }

    /** Legacy list endpoint retained for compatibility; use /users/page for scalable browsing. */
    @GetMapping("/users")
    public List<Map<String, Object>> userDirectory(@RequestParam(required = false) String q) {
        String query = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return users.findAll().stream()
                .filter(u -> query.isEmpty() || safe(u.getUsername()).toLowerCase(Locale.ROOT).contains(query)
                        || safe(u.getEmail()).toLowerCase(Locale.ROOT).contains(query))
                .sorted(Comparator.comparing(User::getId)).map(this::safeUser).toList();
    }

    @GetMapping("/users/page")
    public Map<String, Object> userDirectoryPage(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "id"));
        String query = q == null ? "" : q.trim();
        var result = query.isBlank() ? users.findAll(pageable)
                : users.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable);
        return Map.of("items", result.getContent().stream().map(this::safeUser).toList(),
                "page", result.getNumber(), "size", result.getSize(), "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages());
    }

    @GetMapping("/users/{id}")
    public Map<String, Object> userDetails(@PathVariable Long id) {
        return users.findById(id).map(this::safeUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform user not found"));
    }

    @GetMapping("/audit-logs")
    public Map<String, Object> auditLogPage(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        var result = auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(safePage, safeSize));
        return Map.of("items", result.getContent().stream().map(log -> Map.of(
                "id", log.getId(), "actorUserId", log.getActorUserId() == null ? 0L : log.getActorUserId(),
                "actorUsername", safe(log.getActorUsername()), "action", safe(log.getAction()),
                "targetType", safe(log.getTargetType()), "targetId", log.getTargetId() == null ? 0L : log.getTargetId(),
                "details", safe(log.getDetails()), "createdAt", log.getCreatedAt().toString())).toList(),
                "page", result.getNumber(), "size", result.getSize(), "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages());
    }


    @PutMapping("/users/{id}/role")
    public Map<String, Object> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body,
            Authentication authentication) {
        String roleName = body == null ? null : body.get("role");
        if (roleName == null || !Set.of("STUDENT", "TRAINER", "ADMIN", "ORG_ADMIN", "SUPER_ADMIN").contains(roleName))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported role");
        User target = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Role nextRole = roles.findByName(roleName).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is not configured"));
        String oldRole = target.getRole() == null ? "UNKNOWN" : target.getRole().getName();
        if (oldRole.equals(roleName)) return safeUser(target);
        if ("SUPER_ADMIN".equals(oldRole) && !"SUPER_ADMIN".equals(roleName)) {
            long superAdmins = roles.findByName("SUPER_ADMIN").map(users::countByRole).orElse(0L);
            if (superAdmins <= 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot demote the last Super Admin");
            if (authentication != null && authentication.getName().equals(target.getUsername()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot remove your own Super Admin role");
        }
        target.setRole(nextRole);
        User saved = users.save(target);
        writeAudit(authentication, "USER_ROLE_CHANGED", "USER", id, "Role changed from " + oldRole + " to " + roleName);
        return safeUser(saved);
    }

    // Organization administration: lifecycle state is persisted independently of demo workspace data.
    @GetMapping("/organizations")
    public Map<String, Object> organizationDirectory(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        String query = q == null ? "" : q.trim();
        var result = query.isBlank() ? organizations.findAll(pageable)
                : organizations.findByNameContainingIgnoreCaseOrSlugContainingIgnoreCase(query, query, pageable);
        return Map.of("items", result.getContent().stream().map(this::organizationView).toList(),
                "page", result.getNumber(), "size", result.getSize(), "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages());
    }


    @PostMapping("/organizations")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createOrganization(@RequestBody Map<String, String> body, Authentication authentication) {
        String name = body == null ? null : body.get("name");
        String description = body == null ? "" : body.getOrDefault("description", "");
        if (name == null || name.trim().length() < 2 || name.trim().length() > 160)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization name must be 2-160 characters");
        String slug = slugify(body.getOrDefault("slug", name));
        if (slug.length() < 2 || slug.length() > 180)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slug must be 2-180 characters");
        if (organizations.existsBySlug(slug)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Organization slug already exists");
        if (description.length() > 1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is too long");
        PlatformOrganization org = organizations.save(PlatformOrganization.builder().name(name.trim()).slug(slug)
                .description(description.trim()).status("PENDING").build());
        writeAudit(authentication, "ORGANIZATION_CREATED", "ORGANIZATION", org.getId(), "Created organization " + org.getName());
        return organizationView(org);
    }

    @GetMapping("/organizations/{id}")
    public Map<String, Object> organizationDetails(@PathVariable Long id) {
        return organizations.findById(id).map(this::organizationView)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));
    }

    @PatchMapping("/organizations/{id}/status")
    public Map<String, Object> updateOrganizationStatus(@PathVariable Long id, @RequestBody Map<String, String> body,
            Authentication authentication) {
        String status = body == null ? null : body.get("status");
        if (status == null || !Set.of("PENDING", "ACTIVE", "SUSPENDED", "REJECTED").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported organization status");
        PlatformOrganization org = organizations.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));
        String previous = org.getStatus();
        if (!previous.equals(status)) {
            org.setStatus(status);
            org = organizations.save(org);
            writeAudit(authentication, "ORGANIZATION_STATUS_CHANGED", "ORGANIZATION", id,
                    "Status changed from " + previous + " to " + status);
        }
        return organizationView(org);
    }

    private Map<String, Object> organizationView(PlatformOrganization org) {
        return Map.of("id", org.getId(), "name", safe(org.getName()), "slug", safe(org.getSlug()),
                "description", safe(org.getDescription()), "status", safe(org.getStatus()),
                "createdAt", org.getCreatedAt() == null ? "" : org.getCreatedAt().toString(),
                "updatedAt", org.getUpdatedAt() == null ? "" : org.getUpdatedAt().toString());
    }
    private void writeAudit(Authentication authentication, String action, String targetType, Long targetId, String details) {
        String actorName = authentication == null ? "unknown" : authentication.getName();
        Long actorId = users.findByUsername(actorName).map(User::getId).orElse(null);
        auditLogs.save(PlatformAuditLog.builder().actorUserId(actorId).actorUsername(actorName)
                .action(action).targetType(targetType).targetId(targetId).details(details).build());
    }
    private Map<String, Object> safeUser(User u) {
        return Map.of("id", u.getId(), "username", safe(u.getUsername()), "email", safe(u.getEmail()),
                "role", u.getRole() == null ? "UNKNOWN" : safe(u.getRole().getName()),
                "createdAt", u.getCreatedAt() == null ? "" : u.getCreatedAt().toString());
    }
    private static String slugify(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
    private static String safe(String value) { return value == null ? "" : value; }
}
