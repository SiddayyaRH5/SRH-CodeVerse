package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.Map;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(length = 120)
    private String industry;

    @Column(length = 120)
    private String domain;

    @Column(length = 80)
    private String timezone;

    @Column(length = 120)
    private String location;

    @Column(name = "work_week", length = 64)
    private String workWeek;

    @Column(name = "standard_start", length = 10)
    private String standardStart = "09:30";

    @Column(name = "standard_end", length = 10)
    private String standardEnd = "18:30";

    @Column(name = "grace_minutes")
    private int graceMinutes = 15;

    @Column(name = "allow_remote_check_in")
    private boolean allowRemoteCheckIn = true;

    @Column(length = 64)
    private String plan = "Enterprise Workspace";

    @Column(nullable = false, length = 24)
    private String status = "ACTIVE"; // ACTIVE or SUSPENDED

    @Column(name = "suspended_at", length = 40)
    private String suspendedAt;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @Column(name = "created_at", length = 20)
    private String createdAt;

    @Column(name = "updated_at", length = 40)
    private String updatedAt;

    @JsonProperty("attendancePolicy")
    public Map<String, Object> getAttendancePolicy() {
        return Map.of(
            "standardStart", standardStart != null ? standardStart : "09:30",
            "standardEnd", standardEnd != null ? standardEnd : "18:30",
            "graceMinutes", graceMinutes,
            "allowRemoteCheckIn", allowRemoteCheckIn
        );
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getWorkWeek() { return workWeek; }
    public void setWorkWeek(String workWeek) { this.workWeek = workWeek; }
    public String getStandardStart() { return standardStart; }
    public void setStandardStart(String standardStart) { this.standardStart = standardStart; }
    public String getStandardEnd() { return standardEnd; }
    public void setStandardEnd(String standardEnd) { this.standardEnd = standardEnd; }
    public int getGraceMinutes() { return graceMinutes; }
    public void setGraceMinutes(int graceMinutes) { this.graceMinutes = graceMinutes; }
    public boolean isAllowRemoteCheckIn() { return allowRemoteCheckIn; }
    public void setAllowRemoteCheckIn(boolean allowRemoteCheckIn) { this.allowRemoteCheckIn = allowRemoteCheckIn; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(String suspendedAt) { this.suspendedAt = suspendedAt; }
    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
