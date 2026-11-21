package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "invitations",
    indexes = {
        @Index(name = "idx_inv_org", columnList = "org_id"),
        @Index(name = "idx_inv_email", columnList = "org_id, email")
    }
)
public class Invitation {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(nullable = false, length = 180)
    private String email;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 32)
    private String role;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(nullable = false, length = 24)
    private String status = "PENDING";

    @Column(name = "invited_by", length = 140)
    private String invitedBy;

    @Column(name = "invited_at", length = 40)
    private String invitedAt;

    @Column(name = "last_sent_at", length = 40)
    private String lastSentAt;

    @Column(name = "expires_at", length = 20)
    private String expiresAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }
    public String getInvitedAt() { return invitedAt; }
    public void setInvitedAt(String invitedAt) { this.invitedAt = invitedAt; }
    public String getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(String lastSentAt) { this.lastSentAt = lastSentAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
}
