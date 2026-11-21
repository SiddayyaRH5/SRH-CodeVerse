package com.srh.codeverse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(
    name = "attendance_records",
    uniqueConstraints = @UniqueConstraint(name = "uk_att_org_emp_date", columnNames = {"org_id", "employee_id", "work_date"}),
    indexes = @Index(name = "idx_att_org_date", columnList = "org_id, work_date")
)
public class AttendanceRecord {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @JsonProperty("date")
    @Column(name = "work_date", nullable = false, length = 16)
    private String workDate;

    @Column(name = "check_in", length = 10)
    private String checkIn;

    @Column(name = "check_out", length = 10)
    private String checkOut;

    @Column(name = "work_mode", nullable = false, length = 24)
    private String workMode = "OFFICE";

    @Column(nullable = false, length = 24)
    private String status = "CHECKED_IN";

    @Column(name = "hours_worked")
    private double hoursWorked;

    @Column(length = 300)
    private String notes;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getWorkDate() { return workDate; }
    public void setWorkDate(String workDate) { this.workDate = workDate; }
    public String getCheckIn() { return checkIn; }
    public void setCheckIn(String checkIn) { this.checkIn = checkIn; }
    public String getCheckOut() { return checkOut; }
    public void setCheckOut(String checkOut) { this.checkOut = checkOut; }
    public String getWorkMode() { return workMode; }
    public void setWorkMode(String workMode) { this.workMode = workMode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(double hoursWorked) { this.hoursWorked = hoursWorked; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
