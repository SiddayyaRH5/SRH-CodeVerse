package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "workspace_sessions",
    indexes = {
        @Index(name = "idx_wsess_emp_revoked", columnList = "employee_id, revoked"),
        @Index(name = "idx_wsess_expires", columnList = "expires_at")
    }
)
public class WorkspaceSession {

    @Id
    @Column(name = "token_hash", length = 128)
    private String tokenHash;

    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "created_at", nullable = false, length = 40)
    private String createdAt;

    @Column(name = "expires_at", nullable = false, length = 40)
    private String expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }
}