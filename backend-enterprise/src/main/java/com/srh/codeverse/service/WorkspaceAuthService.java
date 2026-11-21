package com.srh.codeverse.service;

import com.srh.codeverse.entity.Employee;
import com.srh.codeverse.entity.Organization;
import com.srh.codeverse.entity.WorkspaceSession;
import com.srh.codeverse.repository.EmployeeRepository;
import com.srh.codeverse.repository.OrganizationRepository;
import com.srh.codeverse.repository.WorkspaceSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WorkspaceAuthService {

    private static final long SESSION_TTL_SECONDS = 8 * 60 * 60;

    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final WorkspaceSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    public WorkspaceAuthService(
        EmployeeRepository employeeRepository,
        OrganizationRepository organizationRepository,
        WorkspaceSessionRepository sessionRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.employeeRepository = employeeRepository;
        this.organizationRepository = organizationRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @org.springframework.beans.factory.annotation.Value("${app.security.rate-limit.max-attempts:10}")
    private int maxAttempts = 10;
    @org.springframework.beans.factory.annotation.Value("${app.security.rate-limit.window-seconds:900}")
    private long windowSeconds = 900;
    private long getWindowMs() { return windowSeconds * 1000L; }
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.List<Long>> failedAttempts = new java.util.concurrent.ConcurrentHashMap<>();

    private void checkRateLimit(String ip) {
        if (ip == null || ip.isBlank()) return;
        java.util.List<Long> attempts = failedAttempts.get(ip);
        if (attempts == null) return;
        long now = System.currentTimeMillis();
        long cutoff = now - getWindowMs();
        long recent = attempts.stream().filter(t -> t >= cutoff).count();
        if (recent >= maxAttempts) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Try again later.");
        }
    }

    private void recordFailure(String ip) {
        if (ip == null || ip.isBlank()) return;
        failedAttempts.computeIfAbsent(ip, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(System.currentTimeMillis());
    }

    private void resetAttempts(String ip) {
        if (ip == null || ip.isBlank()) return;
        failedAttempts.remove(ip);
    }

    @Transactional
    public Map<String, Object> login(String email, String password, String ipAddress) {
        checkRateLimit(ipAddress);
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isBlank() || password == null || password.isBlank()) {
            recordFailure(ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }
        Employee employee = employeeRepository.findFirstByEmailIgnoreCase(normalized)
            .orElseThrow(() -> { recordFailure(ipAddress); return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials."); });

        if (employee.getPasswordHash() == null || employee.getPasswordHash().isBlank()) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account has no password configured.");
        }
        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee account is not active.");
        }
        if (!passwordEncoder.matches(password, employee.getPasswordHash())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        Organization org = organizationRepository.findById(employee.getOrgId()).orElse(null);
        if (org != null && "SUSPENDED".equalsIgnoreCase(org.getStatus())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organization is currently suspended.");
        }

        String rawToken = generateToken();
        String tokenHash = sha256Hex(rawToken);
        Instant now = Instant.now();
        WorkspaceSession session = new WorkspaceSession();
        session.setTokenHash(tokenHash);
        session.setEmployeeId(employee.getId());
        session.setOrgId(employee.getOrgId());
        session.setCreatedAt(now.toString());
        session.setExpiresAt(now.plusSeconds(SESSION_TTL_SECONDS).toString());
        session.setRevoked(false);
        sessionRepository.save(session);
        resetAttempts(ipAddress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", rawToken);
        response.put("user", sanitizeUser(employee));
        return response;
    }

    @Transactional
    public Map<String, Object> logout(String authorization) {
        String token = extractBearerToken(authorization);
        if (token != null && !token.isBlank()) {
            sessionRepository.findByTokenHashAndRevokedFalse(sha256Hex(token)).ifPresent(s -> {
                s.setRevoked(true);
                sessionRepository.save(s);
            });
        }
        return Map.of("loggedOut", true);
    }

    @Transactional(readOnly = true)
    public Employee requireWorkspaceUser(String authorization) {
        String token = extractBearerToken(authorization);
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        WorkspaceSession session = sessionRepository.findByTokenHashAndRevokedFalse(sha256Hex(token))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired session."));

        try {
            Instant expires = Instant.parse(session.getExpiresAt());
            if (expires.isBefore(Instant.now())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired.");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session expiry.");
        }

        Employee employee = employeeRepository.findById(session.getEmployeeId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (!employee.getOrgId().equals(session.getOrgId()) || !"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workspace access denied.");
        }
        return employee;
    }

    @Transactional
    public void revokeAllSessionsForEmployee(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) return;
        for (WorkspaceSession s : sessionRepository.findByEmployeeIdAndRevokedFalse(employeeId)) {
            s.setRevoked(true);
            sessionRepository.save(s);
        }
    }

    public Map<String, Object> sanitizeUser(Employee employee) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", employee.getId());
        out.put("name", employee.getName());
        out.put("email", employee.getEmail());
        out.put("role", employee.getRole());
        out.put("orgId", employee.getOrgId());
        out.put("departmentId", employee.getDepartmentId());
        out.put("teamId", employee.getTeamId());
        out.put("title", employee.getTitle());
        out.put("status", employee.getStatus());
        return out;
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null) return null;
        String trimmed = authorization.trim();
        if (trimmed.toLowerCase().startsWith("bearer ")) {
            return trimmed.substring(7).trim();
        }
        return trimmed;
    }
}