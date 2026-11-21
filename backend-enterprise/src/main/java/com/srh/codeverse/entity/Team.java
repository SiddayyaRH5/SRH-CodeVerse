package com.srh.codeverse.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "teams",
    indexes = @Index(name = "idx_team_org", columnList = "org_id")
)
public class Team {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "lead_id", length = 64)
    private String leadId;

    @Column(length = 500)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "team_members", joinColumns = @JoinColumn(name = "team_id"))
    @Column(name = "employee_id", length = 64)
    private List<String> memberIds = new ArrayList<>();

    @Column(name = "capacity_hours_per_week")
    private int capacityHoursPerWeek = 40;

    @Column(name = "created_at", length = 20)
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getMemberIds() { return memberIds; }
    public void setMemberIds(List<String> memberIds) { this.memberIds = memberIds != null ? new ArrayList<>(memberIds) : new ArrayList<>(); }
    public int getCapacityHoursPerWeek() { return capacityHoursPerWeek; }
    public void setCapacityHoursPerWeek(int capacityHoursPerWeek) { this.capacityHoursPerWeek = capacityHoursPerWeek; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
