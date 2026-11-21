package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(
    name = "employees",
    uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "email"}),
    indexes = {
        @Index(name = "idx_emp_org", columnList = "org_id"),
        @Index(name = "idx_emp_team", columnList = "team_id")
    }
)
public class Employee {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "employee_code", nullable = false, length = 32)
    private String employeeCode;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 180)
    private String email;

    @Column(length = 120)
    private String title;

    @Column(nullable = false, length = 32)
    private String role;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "team_id", length = 64)
    private String teamId;

    @Column(nullable = false, length = 24)
    private String status = "ACTIVE";

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "password_hash", length = 120)
    private String passwordHash;

    @Column(length = 120)
    private String location;

    @Column(length = 40)
    private String phone;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employee_skills", joinColumns = @JoinColumn(name = "employee_id"))
    @Column(name = "skill", length = 80)
    private List<String> skills = new ArrayList<>();

    @Column(name = "joined_at", length = 20)
    private String joinedAt;

    @Column(name = "weekly_capacity_hours")
    private int weeklyCapacityHours = 40;

    @Column(name = "annual_leave_balance")
    private int annualLeaveBalance = 15;

    @Column(name = "sick_leave_balance")
    private int sickLeaveBalance = 10;

    @Column(name = "personal_leave_balance")
    private int personalLeaveBalance = 4;

    @JsonProperty("leaveBalance")
    public Map<String, Integer> getLeaveBalance() {
        return Map.of(
            "annual", annualLeaveBalance,
            "sick", sickLeaveBalance,
            "personal", personalLeaveBalance
        );
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills != null ? new ArrayList<>(skills) : new ArrayList<>(); }
    public String getJoinedAt() { return joinedAt; }
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }
    public int getWeeklyCapacityHours() { return weeklyCapacityHours; }
    public void setWeeklyCapacityHours(int weeklyCapacityHours) { this.weeklyCapacityHours = weeklyCapacityHours; }
    public int getAnnualLeaveBalance() { return annualLeaveBalance; }
    public void setAnnualLeaveBalance(int annualLeaveBalance) { this.annualLeaveBalance = annualLeaveBalance; }
    public int getSickLeaveBalance() { return sickLeaveBalance; }
    public void setSickLeaveBalance(int sickLeaveBalance) { this.sickLeaveBalance = sickLeaveBalance; }
    public int getPersonalLeaveBalance() { return personalLeaveBalance; }
    public void setPersonalLeaveBalance(int personalLeaveBalance) { this.personalLeaveBalance = personalLeaveBalance; }
}
