package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(
    name = "worklogs",
    indexes = {
        @Index(name = "idx_wl_org", columnList = "org_id"),
        @Index(name = "idx_wl_emp_date", columnList = "org_id, employee_id, work_date")
    }
)
public class WorklogEntry {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    @Column(name = "task_id", length = 64)
    private String taskId;

    @JsonProperty("date")
    @Column(name = "work_date", nullable = false, length = 20)
    private String workDate;

    @Column(nullable = false)
    private double hours;

    @Column(nullable = false)
    private boolean billable = true;

    @Column(nullable = false, length = 600)
    private String summary;

    @Column(nullable = false, length = 24)
    private String status = "LOGGED";

    @Column(name = "created_at", length = 40)
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getWorkDate() { return workDate; }
    public void setWorkDate(String workDate) { this.workDate = workDate; }
    public double getHours() { return hours; }
    public void setHours(double hours) { this.hours = hours; }
    public boolean isBillable() { return billable; }
    public void setBillable(boolean billable) { this.billable = billable; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
