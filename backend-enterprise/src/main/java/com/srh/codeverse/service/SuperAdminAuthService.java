package com.srh.codeverse.service;

import com.srh.codeverse.entity.PlatformSession;
import com.srh.codeverse.entity.PlatformUser;
import com.srh.codeverse.repository.PlatformSessionRepository;
import com.srh.codeverse.repository.PlatformUserRepository;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SuperAdminAuthService {

    private static final long SESSION_TTL_SECONDS = 8 * 60 * 60;

    private final PlatformUserRepository platformUserRepository;
    private final PlatformSessionRepository platformSessionRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminAuthService(
        PlatformUserRepository platformUserRepository,
        PlatformSessionRepository platformSessionRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.platformUserRepository = platformUserRepository;
        this.platformSessionRepository = platformSessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
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
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank() || password == null || password.isBlank()) {
            recordFailure(ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        PlatformUser user = platformUserRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> { recordFailure(ipAddress); return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials."); });

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Platform account is not active.");
        }
        if (!"SUPER_ADMIN".equalsIgnoreCase(user.getPlatformRole())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super Admin access required.");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            recordFailure(ipAddress); throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        String rawToken = generateToken();
        String tokenHash = sha256Hex(rawToken);
        Instant now = Instant.now();
        PlatformSession session = new PlatformSession();
        session.setTokenHash(tokenHash);
        session.setPlatformUserId(user.getId());
        session.setCreatedAt(now.toString());
        session.setExpiresAt(now.plusSeconds(SESSION_TTL_SECONDS).toString());
        session.setRevoked(false);
        platformSessionRepository.save(session);
        resetAttempts(ipAddress);

        user.setLastLoginAt(now.toString());
        platformUserRepository.save(user);

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("token", rawToken);
        response.put("user", sanitizeUser(user));
        return response;
    }

    @Transactional
    public Map<String, Object> logout(String authorization, String ipAddress) {
        String token = extractBearerToken(authorization);
        if (token != null && !token.isBlank()) {
            String tokenHash = sha256Hex(token);
            platformSessionRepository.findByTokenHashAndRevokedFalse(tokenHash).ifPresent(session -> {
                session.setRevoked(true);
                platformSessionRepository.save(session);
            });
        }
        return Map.of("loggedOut", true);
    }

    @Transactional(readOnly = true)
    public PlatformUser requireSuperAdmin(String authorization) {
        String token = extractBearerToken(authorization);
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        String tokenHash = sha256Hex(token);
        PlatformSession session = platformSessionRepository.findByTokenHashAndRevokedFalse(tokenHash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired session."));

        Instant now = Instant.now();
        try {
            Instant expires = Instant.parse(session.getExpiresAt());
            if (expires.isBefore(now)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired.");
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session expiry.");
        }

        PlatformUser user = platformUserRepository.findById(session.getPlatformUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus()) || !"SUPER_ADMIN".equalsIgnoreCase(user.getPlatformRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super Admin access required.");
        }
        return user;
    }

    @Transactional
    public void revokeAllSessionsForUser(String userId) {
        if (userId == null || userId.isBlank()) return;
        for (PlatformSession session : platformSessionRepository.findByPlatformUserIdAndRevokedFalse(userId)) {
            session.setRevoked(true);
            platformSessionRepository.save(session);
        }
    }

    public Map<String, Object> sanitizeUser(PlatformUser user) {
        Map<String, Object> sanitized = new java.util.LinkedHashMap<>();
        sanitized.put("id", user.getId());
        sanitized.put("email", user.getEmail());
        sanitized.put("name", user.getName());
        sanitized.put("platformRole", user.getPlatformRole());
        sanitized.put("status", user.getStatus());
        sanitized.put("createdAt", user.getCreatedAt());
        sanitized.put("lastLoginAt", user.getLastLoginAt());
        return sanitized;
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