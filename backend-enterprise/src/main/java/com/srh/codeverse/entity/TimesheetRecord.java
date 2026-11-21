package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "timesheets",
    uniqueConstraints = @UniqueConstraint(name = "uk_ts_org_emp_week", columnNames = {"org_id", "employee_id", "week_start"}),
    indexes = {
        @Index(name = "idx_ts_org", columnList = "org_id"),
        @Index(name = "idx_ts_emp_week", columnList = "org_id, employee_id, week_start")
    }
)
public class TimesheetRecord {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(name = "week_start", nullable = false, length = 20)
    private String weekStart;

    @Column(name = "week_end", nullable = false, length = 20)
    private String weekEnd;

    @Column(name = "total_hours")
    private double totalHours;

    @Column(name = "billable_hours")
    private double billableHours;

    @Column(name = "entries_count")
    private int entriesCount;

    @Column(nullable = false, length = 24)
    private String status = "DRAFT";

    @Column(name = "submitted_at", length = 40)
    private String submittedAt;

    @Column(name = "reviewer_id", length = 64)
    private String reviewerId;

    @Column(name = "reviewer_note", length = 500)
    private String reviewerNote;

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
    public String getWeekStart() { return weekStart; }
    public void setWeekStart(String weekStart) { this.weekStart = weekStart; }
    public String getWeekEnd() { return weekEnd; }
    public void setWeekEnd(String weekEnd) { this.weekEnd = weekEnd; }
    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }
    public double getBillableHours() { return billableHours; }
    public void setBillableHours(double billableHours) { this.billableHours = billableHours; }
    public int getEntriesCount() { return entriesCount; }
    public void setEntriesCount(int entriesCount) { this.entriesCount = entriesCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerNote() { return reviewerNote; }
    public void setReviewerNote(String reviewerNote) { this.reviewerNote = reviewerNote; }
    public String getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; }
}
