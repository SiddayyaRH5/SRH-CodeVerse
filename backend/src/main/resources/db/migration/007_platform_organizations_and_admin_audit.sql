-- SRH CodeVerse Stage 7/8: persistent platform organization registry and audit table.
-- Run once against the production MySQL database before deploying the admin endpoints.
CREATE TABLE IF NOT EXISTS platform_organizations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_platform_organizations_slug (slug),
    KEY idx_platform_org_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    actor_username VARCHAR(120) NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NULL,
    target_id BIGINT NULL,
    details VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_platform_audit_created (created_at),
    KEY idx_platform_audit_actor (actor_user_id)
) ENGINE=InnoDB;
