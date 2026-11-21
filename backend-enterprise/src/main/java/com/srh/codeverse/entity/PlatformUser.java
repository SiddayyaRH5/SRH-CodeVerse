package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(
    name = "platform_users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"email"}),
    indexes = @Index(name = "idx_puser_role_status", columnList = "platform_role, status")
)
public class PlatformUser {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 180)
    private String email;

    @Column(nullable = false, length = 140)
    private String name;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 120)
    private String passwordHash;

    @Column(name = "platform_role", nullable = false, length = 32)
    private String platformRole = "USER"; // SUPER_ADMIN or USER

    @Column(nullable = false, length = 24)
    private String status = "ACTIVE"; // ACTIVE or SUSPENDED

    @Column(name = "created_at", nullable = false, length = 40)
    private String createdAt;

    @Column(name = "last_login_at", length = 40)
    private String lastLoginAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getPlatformRole() { return platformRole; }
    public void setPlatformRole(String platformRole) { this.platformRole = platformRole; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(String lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
