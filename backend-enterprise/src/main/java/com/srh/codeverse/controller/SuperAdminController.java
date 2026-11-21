package com.srh.codeverse.controller;

import com.srh.codeverse.entity.PlatformAuditLog;
import com.srh.codeverse.entity.PlatformUser;
import com.srh.codeverse.service.SuperAdminAuthService;
import com.srh.codeverse.service.SuperAdminService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Protected platform-level REST API for the hidden Super Admin console.
 * Every endpoint except /auth/login and /auth/logout requires a server-verified
 * SUPER_ADMIN bearer session backed by MySQL platform_sessions + platform_users.
 */
@RestController
@RequestMapping("/api/super-admin")
public class SuperAdminController {

    private final SuperAdminAuthService authService;
    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminAuthService authService, SuperAdminService superAdminService) {
        this.authService = authService;
        this.superAdminService = superAdminService;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        Map<String, Object> body = payload != null ? payload : Map.of();
        String email = body.get("email") != null ? String.valueOf(body.get("email")) : "";
        String password = body.get("password") != null ? String.valueOf(body.get("password")) : "";
        return authService.login(email, password, resolveClientIp(request));
    }

    @PostMapping("/auth/logout")
    public Map<String, Object> logout(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        HttpServletRequest request
    ) {
        return authService.logout(authorization, resolveClientIp(request));
    }

    @GetMapping("/session")
    public Map<String, Object> getSession(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        PlatformUser user = authService.requireSuperAdmin(authorization);
        return Map.of("authenticated", true, "user", authService.sanitizeUser(user));
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.getOverview(actor);
    }

    @GetMapping("/organizations")
    public List<Map<String, Object>> listOrganizations(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(value = "q", required = false) String q,
        @RequestParam(value = "status", required = false) String status
    ) {
        authService.requireSuperAdmin(authorization);
        return superAdminService.listOrganizations(q, status);
    }

    @PostMapping("/organizations")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createOrganization(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.createOrganization(actor, payload != null ? payload : Map.of(), resolveClientIp(request));
    }

    @GetMapping("/organizations/{orgId}")
    public Map<String, Object> getOrganizationDetails(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String orgId
    ) {
        authService.requireSuperAdmin(authorization);
        return superAdminService.getOrganizationDetails(orgId);
    }

    @PatchMapping("/organizations/{orgId}")
    public Map<String, Object> updateOrganization(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String orgId,
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.updateOrganization(actor, orgId, payload != null ? payload : Map.of(), resolveClientIp(request));
    }

    @PostMapping("/organizations/{orgId}/activate")
    public Map<String, Object> activateOrganization(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String orgId,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.activateOrganization(actor, orgId, resolveClientIp(request));
    }

    @PostMapping("/organizations/{orgId}/suspend")
    public Map<String, Object> suspendOrganization(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String orgId,
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        String reason = payload != null && payload.get("reason") != null ? String.valueOf(payload.get("reason")) : "";
        return superAdminService.suspendOrganization(actor, orgId, reason, resolveClientIp(request));
    }

    @GetMapping("/users")
    public List<Map<String, Object>> listPlatformUsers(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(value = "q", required = false) String q,
        @RequestParam(value = "role", required = false) String role,
        @RequestParam(value = "status", required = false) String status
    ) {
        authService.requireSuperAdmin(authorization);
        return superAdminService.listPlatformUsers(q, role, status);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createPlatformUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.createPlatformUser(actor, payload != null ? payload : Map.of(), resolveClientIp(request));
    }

    @PatchMapping("/users/{userId}")
    public Map<String, Object> updatePlatformUser(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String userId,
        @RequestBody(required = false) Map<String, Object> payload,
        HttpServletRequest request
    ) {
        PlatformUser actor = authService.requireSuperAdmin(authorization);
        return superAdminService.updatePlatformUser(actor, userId, payload != null ? payload : Map.of(), resolveClientIp(request));
    }

    @GetMapping("/audit-logs")
    public List<PlatformAuditLog> listAuditLogs(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(value = "q", required = false) String q,
        @RequestParam(value = "action", required = false) String action
    ) {
        authService.requireSuperAdmin(authorization);
        return superAdminService.listAuditLogs(q, action);
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        authService.requireSuperAdmin(authorization);
        return superAdminService.getAnalytics();
    }
}
