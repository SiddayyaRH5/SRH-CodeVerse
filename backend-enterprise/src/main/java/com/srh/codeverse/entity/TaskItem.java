package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(
    name = "tasks",
    uniqueConstraints = @UniqueConstraint(name = "uk_task_org_key", columnNames = {"org_id", "task_key"}),
    indexes = {
        @Index(name = "idx_task_org", columnList = "org_id"),
        @Index(name = "idx_task_org_project", columnList = "org_id, project_id"),
        @Index(name = "idx_task_assignee", columnList = "assignee_id")
    }
)
public class TaskItem {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @JsonProperty("key")
    @Column(name = "task_key", nullable = false, length = 24)
    private String taskKey;

    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(length = 800)
    private String description;

    @Column(nullable = false, length = 24)
    private String status = "TODO";

    @Column(nullable = false, length = 24)
    private String priority = "MEDIUM";

    @Column(name = "assignee_id", nullable = false, length = 64)
    private String assigneeId;

    @Column(name = "reporter_id", length = 64)
    private String reporterId;

    @Column(name = "due_date", length = 20)
    private String dueDate;

    @Column(name = "estimated_hours")
    private double estimatedHours = 6;

    @Column(name = "logged_hours")
    private double loggedHours = 0;

    @Column(nullable = false)
    private int progress = 0;

    @Column(name = "updated_at", length = 40)
    private String updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getAssigneeId() { return assigneeId; }
    public void setAssigneeId(String assigneeId) { this.assigneeId = assigneeId; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(double estimatedHours) { this.estimatedHours = estimatedHours; }
    public double getLoggedHours() { return loggedHours; }
    public void setLoggedHours(double loggedHours) { this.loggedHours = loggedHours; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
