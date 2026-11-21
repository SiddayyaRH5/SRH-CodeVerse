package com.srh.codeverse.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "audit_activities",
    indexes = @Index(name = "idx_act_org_ts", columnList = "org_id, timestamp")
)
public class AuditActivity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "org_id", nullable = false, length = 64)
    private String orgId;

    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "actor_name", length = 140)
    private String actorName;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 300)
    private String action;

    @Column(length = 200)
    private String target;

    @Column(nullable = false, length = 40)
    private String timestamp;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrgId() { return orgId; }
    public void setOrgId(String orgId) { this.orgId = orgId; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
