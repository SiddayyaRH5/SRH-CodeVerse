package com.srh.codeverse.config;

import com.srh.codeverse.entity.PlatformAuditLog;
import com.srh.codeverse.entity.PlatformUser;
import com.srh.codeverse.repository.PlatformAuditLogRepository;
import com.srh.codeverse.repository.PlatformUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Controlled, opt-in bootstrap for the initial platform SUPER_ADMIN account.
 * Never creates hardcoded default credentials. Provisioning occurs ONLY when:
 * 1) SUPER_ADMIN_BOOTSTRAP_EMAIL and SUPER_ADMIN_BOOTSTRAP_PASSWORD (min 12 chars) are configured, AND
 * 2) Zero SUPER_ADMIN rows currently exist in MySQL platform_users.
 */
@Component
public class SuperAdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrapRunner.class);

    private final PlatformUserRepository platformUserRepository;
    private final PlatformAuditLogRepository platformAuditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.super-admin.bootstrap-email:}")
    private String bootstrapEmail;

    @Value("${app.super-admin.bootstrap-password:}")
    private String bootstrapPassword;

    @Value("${app.super-admin.bootstrap-name:Platform Super Admin}")
    private String bootstrapName;

    public SuperAdminBootstrapRunner(
        PlatformUserRepository platformUserRepository,
        PlatformAuditLogRepository platformAuditLogRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.platformUserRepository = platformUserRepository;
        this.platformAuditLogRepository = platformAuditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank() || bootstrapPassword == null || bootstrapPassword.isBlank()) {
            return;
        }
        if (platformUserRepository.countByPlatformRole("SUPER_ADMIN") > 0) {
            return;
        }
        String normalizedEmail = bootstrapEmail.trim().toLowerCase();
        if (bootstrapPassword.length() < 12) {
            log.warn("Skipping Super Admin bootstrap: SUPER_ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
            return;
        }
        if (platformUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Skipping Super Admin bootstrap: email already exists in platform_users.");
            return;
        }

        String now = Instant.now().toString();
        PlatformUser admin = new PlatformUser();
        admin.setId("pu-" + UUID.randomUUID().toString().substring(0, 8));
        admin.setEmail(normalizedEmail);
        admin.setName(bootstrapName != null && !bootstrapName.isBlank() ? bootstrapName.trim() : "Platform Super Admin");
        admin.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
        admin.setPlatformRole("SUPER_ADMIN");
        admin.setStatus("ACTIVE");
        admin.setCreatedAt(now);
        try {
            platformUserRepository.saveAndFlush(admin);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.info("Skipping Super Admin bootstrap: initial account was concurrently provisioned.");
            return;
        }

        PlatformAuditLog audit = new PlatformAuditLog();
        audit.setId("pal-" + UUID.randomUUID().toString().substring(0, 8));
        audit.setActorUserId("system-bootstrap");
        audit.setActorEmail("system@platform");
        audit.setAction("BOOTSTRAP_SUPER_ADMIN");
        audit.setTargetType("PLATFORM_USER");
        audit.setTargetId(admin.getId());
        audit.setDetails("Provisioned initial SUPER_ADMIN account via environment bootstrap.");
        audit.setIpAddress("127.0.0.1");
        audit.setCreatedAt(now);
        platformAuditLogRepository.save(audit);

        log.info("Provisioned initial platform SUPER_ADMIN account (id={}).", admin.getId());
    }
}
