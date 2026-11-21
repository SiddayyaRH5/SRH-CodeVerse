package com.srh.codeverse.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "projects",
    indexes = @Index(name = "idx_proj_org", columnList = "org_id")
)
public class Project {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 600)
    private String description;

    @Column(nullable = false, length = 24)
    private String status = "ACTIVE";

    @Column(name = "department_id", length = 64)
    private String departmentId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(name = "lead_id", length = 64)
    private String leadId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_members", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "employee_id", length = 64)
    private List<String> memberIds = new ArrayList<>();

    @Column(name = "start_date", length = 20)
    private String startDate;

    @Column(name = "due_date", length = 20)
    private String dueDate;

    @Column(nullable = false, length = 24)
    private String priority = "MEDIUM";

    @Column(name = "budget_hours")
    private int budgetHours = 160;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }
    public List<String> getMemberIds() { return memberIds; }
    public void setMemberIds(List<String> memberIds) { this.memberIds = memberIds != null ? new ArrayList<>(memberIds) : new ArrayList<>(); }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public int getBudgetHours() { return budgetHours; }
    public void setBudgetHours(int budgetHours) { this.budgetHours = budgetHours; }
}
