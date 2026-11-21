package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "departments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "code"}),
    indexes = @Index(name = "idx_dept_org", columnList = "org_id")
)
public class Department {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(name = "head_id", length = 64)
    private String headId;

    @Column(length = 500)
    private String description;

    @Column(name = "budget_code", length = 40)
    private String budgetCode;

    @Column(name = "created_at", length = 20)
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getHeadId() { return headId; }
    public void setHeadId(String headId) { this.headId = headId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBudgetCode() { return budgetCode; }
    public void setBudgetCode(String budgetCode) { this.budgetCode = budgetCode; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
