package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "leave_requests",
    indexes = {
        @Index(name = "idx_leave_org", columnList = "org_id"),
        @Index(name = "idx_leave_emp", columnList = "employee_id")
    }
)
public class LeaveRequest {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(nullable = false, length = 24)
    private String type; // ANNUAL, SICK, PERSONAL, UNPAID

    @Column(name = "start_date", nullable = false, length = 16)
    private String startDate;

    @Column(name = "end_date", nullable = false, length = 16)
    private String endDate;

    @Column(nullable = false)
    private int days;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 24)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "reviewer_id", length = 64)
    private String reviewerId;

    @Column(name = "reviewer_note", length = 500)
    private String reviewerNote;

    @Column(name = "created_at", length = 40)
    private String createdAt;

    @Column(name = "reviewed_at", length = 40)
    private String reviewedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerNote() { return reviewerNote; }
    public void setReviewerNote(String reviewerNote) { this.reviewerNote = reviewerNote; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; }
}
