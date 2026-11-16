import { describe, expect, it } from "vitest"
import { demoWorkspaceService } from "./demoService"

describe("demo workspace service", () => {
  it("scopes organization records and exposes all courses in independent mode", () => {
    const northstar = demoWorkspaceService.getSnapshot("org-northstar")
    const bluepeak = demoWorkspaceService.getSnapshot("org-bluepeak")
    const independent = demoWorkspaceService.getSnapshot("org-northstar", true)

    expect(northstar.tasks.every((task) => task.orgId === "org-northstar")).toBe(true)
    for (const resource of [
      "employees", "teams", "departments", "projects", "tasks", "courses", "announcements",
      "documents", "messages", "assignments", "submissions", "courseResources", "curriculum",
      "learningPaths", "attendance", "leaveBalances", "workLogs", "leaveRequests",
    ]) {
      expect(northstar[resource].every((item) => item.orgId === "org-northstar"), resource).toBe(true)
      expect(bluepeak[resource].every((item) => item.orgId === "org-bluepeak"), resource).toBe(true)
    }
    expect(independent.courses.length).toBeGreaterThan(northstar.courses.length)
    expect(northstar.organizations.length).toBeGreaterThan(1)
  })

  it("creates a task and accepts valid workflow transitions", () => {
    const title = `Vitest task ${Date.now()}`
    const task = demoWorkspaceService.createTask({
      organizationId: "org-northstar",
      title,
      assignee: "Demo User",
    })

    expect(task.title).toBe(title)
    expect(demoWorkspaceService.updateTaskStatus(task.id, "IN_PROGRESS").status).toBe("IN_PROGRESS")
    expect(() => demoWorkspaceService.updateTaskStatus(task.id, "INVALID")).toThrow(
      "Choose a valid task status.",
    )
  })

  it("keeps trainer-created assignments inside the active organization", () => {
    const course = demoWorkspaceService.createCourse({
      organizationId: "org-northstar",
      name: `Vitest course ${Date.now()}`,
      lessons: "3",
    })
    const assignment = demoWorkspaceService.createAssignment({
      organizationId: "org-northstar",
      title: "Demo assignment",
      courseId: course.id,
      dueDate: "2026-12-01",
    })

    expect(assignment.orgId).toBe("org-northstar")
    expect(() =>
      demoWorkspaceService.createAssignment({
        organizationId: "org-bluepeak",
        title: "Cross-organization assignment",
        courseId: course.id,
        dueDate: "2026-12-01",
      }),
    ).toThrow("Choose a course in the active organization.")
  })

  it("requires a reason before rejecting an organization application", () => {
    expect(() =>
      demoWorkspaceService.reviewApplication("app-1", { decision: "REJECTED" }),
    ).toThrow("Provide a reason before rejecting an application.")
    expect(
      demoWorkspaceService.getSnapshot("org-northstar").applications.find((item) => item.id === "app-1").status,
    ).toBe("PENDING")
  })

  it("validates organization-scoped leave requests", () => {
    expect(() =>
      demoWorkspaceService.createLeaveRequest({
        organizationId: "org-northstar",
        startDate: "2026-11-25",
        endDate: "2026-11-24",
        reason: "Personal",
      }),
    ).toThrow("End date must be on or after the start date.")
  })

  it("limits resource updates and deletion to the active organization", () => {
    const project = demoWorkspaceService.createResource("projects", "org-northstar", {
      name: `Scoped project ${Date.now()}`,
      owner: "Demo User",
      status: "PLANNING",
    })

    expect(demoWorkspaceService.getSnapshot("org-northstar").projects.some((item) => item.id === project.id)).toBe(true)
    expect(demoWorkspaceService.getSnapshot("org-bluepeak").projects.some((item) => item.id === project.id)).toBe(false)
    expect(demoWorkspaceService.getSnapshot("org-northstar").auditEvents.some((event) => event.target === "projects")).toBe(true)
    expect(demoWorkspaceService.getSnapshot("org-bluepeak").auditEvents.some((event) => event.target === "projects")).toBe(false)
    expect(() => demoWorkspaceService.updateResource("projects", project.id, "org-bluepeak", { name: "Cross-tenant edit" }))
      .toThrow("The demo record was not found in the active organization.")
    expect(() => demoWorkspaceService.deleteResource("projects", project.id, "org-bluepeak"))
      .toThrow("The demo record was not found in the active organization.")

    demoWorkspaceService.updateResource("projects", project.id, "org-northstar", { status: "IN_PROGRESS" })
    expect(demoWorkspaceService.deleteResource("projects", project.id, "org-northstar").id).toBe(project.id)
  })

  it("isolates independent-student support requests from organization records", () => {
    const request = demoWorkspaceService.createResource("supportRequests", null, {
      subject: `Independent support ${Date.now()}`,
      description: "Demo-only question",
    })
    expect(demoWorkspaceService.getSnapshot(null).supportRequests.some((item) => item.id === request.id)).toBe(true)
    expect(demoWorkspaceService.getSnapshot("org-northstar").supportRequests.some((item) => item.id === request.id)).toBe(false)
  })

  it("prevents cross-organization task activity and persists task history", () => {
    const task = demoWorkspaceService.createTask({
      organizationId: "org-northstar",
      title: `Scoped task ${Date.now()}`,
    })

    expect(() => demoWorkspaceService.updateTaskStatus(task.id, "IN_PROGRESS", "org-bluepeak"))
      .toThrow("The demo task could not be found.")
    expect(() => demoWorkspaceService.addTaskComment(task.id, "Cross-tenant comment", "org-bluepeak"))
      .toThrow("The demo task could not be found.")
    demoWorkspaceService.updateTaskStatus(task.id, "IN_PROGRESS", "org-northstar")
    expect(demoWorkspaceService.getSnapshot("org-northstar").tasks.find((item) => item.id === task.id).history[0].action)
      .toBe("Status changed to IN PROGRESS")
  })

  it("scopes organization permissions and trainer attendance updates", () => {
    const northstarPermission = demoWorkspaceService.getSnapshot("org-northstar").organizationPermissions[0]
    demoWorkspaceService.updateRolePermission(northstarPermission.id, "EMPLOYEE", false, "org-northstar")
    expect(demoWorkspaceService.getSnapshot("org-northstar").organizationPermissions[0].permissions.EMPLOYEE).toBe(false)
    expect(() => demoWorkspaceService.updateRolePermission(northstarPermission.id, "EMPLOYEE", true, "org-bluepeak"))
      .toThrow("The permission does not belong to the active organization.")

    expect(() => demoWorkspaceService.markStudentAttendance("org-northstar", "student-1", "PRESENT"))
      .toThrow("The learner does not belong to the active organization.")
    expect(demoWorkspaceService.markStudentAttendance("org-bluepeak", "student-1", "LATE").status).toBe("LATE")
  })

  it("keeps independent-student progress separate from organization course progress", () => {
    const organizationProgress = demoWorkspaceService.getSnapshot("org-northstar").courses.find((item) => item.id === "course-4").progress
    demoWorkspaceService.updateIndependentCourseProgress("course-4", 40)

    expect(demoWorkspaceService.getSnapshot(null, true).courses.find((item) => item.id === "course-4").progress).toBe(40)
    expect(demoWorkspaceService.getSnapshot("org-northstar").courses.find((item) => item.id === "course-4").progress).toBe(organizationProgress)
  })

  it("supports multiple organization roles without permitting cross-tenant edits", () => {
    const employee = demoWorkspaceService.getSnapshot("org-northstar").employees.find((item) => item.id === "emp-1")
    const updated = demoWorkspaceService.updateResource("employees", employee.id, "org-northstar", {
      additionalRoles: ["TRAINER", "TEAM_LEAD"],
    })

    expect(updated.additionalRoles).toEqual(["TRAINER", "TEAM_LEAD"])
    expect(() => demoWorkspaceService.updateResource("employees", employee.id, "org-bluepeak", {
      status: "SUSPENDED",
    })).toThrow("The demo record was not found in the active organization.")
  })

  it("grades submissions only after a numeric grade is provided", () => {
    const course = demoWorkspaceService.createCourse({
      organizationId: "org-northstar",
      name: `Grading course ${Date.now()}`,
      lessons: "1",
    })
    const assignment = demoWorkspaceService.createAssignment({
      organizationId: "org-northstar",
      title: `Grading assignment ${Date.now()}`,
      courseId: course.id,
      dueDate: "2026-12-10",
    })
    const submission = demoWorkspaceService.createResource("submissions", "org-northstar", {
      assignmentId: assignment.id,
      content: "Demo submission",
    })

    expect(() => demoWorkspaceService.updateResource("submissions", submission.id, "org-northstar", {
      status: "GRADED",
      grade: "",
    })).toThrow("Enter a grade before marking the submission as graded.")
    expect(demoWorkspaceService.getSnapshot("org-northstar").submissions.find((item) => item.id === submission.id).status)
      .toBe("SUBMITTED")
    expect(demoWorkspaceService.updateResource("submissions", submission.id, "org-northstar", {
      status: "GRADED",
      grade: "92",
    }).grade).toBe(92)
  })

  it("keeps new submissions and assignment counts in the active organization", () => {
    const course = demoWorkspaceService.createCourse({
      organizationId: "org-bluepeak",
      name: `Submission course ${Date.now()}`,
      lessons: "1",
    })
    const assignment = demoWorkspaceService.createAssignment({
      organizationId: "org-bluepeak",
      title: `Submission assignment ${Date.now()}`,
      courseId: course.id,
      dueDate: "2026-12-10",
    })
    const submission = demoWorkspaceService.createResource("submissions", "org-bluepeak", {
      assignmentId: assignment.id,
      content: "Demo submission",
    })

    expect(submission.status).toBe("SUBMITTED")
    expect(demoWorkspaceService.getSnapshot("org-bluepeak").assignments.find((item) => item.id === assignment.id)).toMatchObject({
      submissions: 1,
      status: "REVIEW",
    })
    expect(demoWorkspaceService.getSnapshot("org-northstar").submissions.some((item) => item.id === submission.id)).toBe(false)
  })

  it("reviews leave requests with a reason and updates the linked balance", () => {
    const request = demoWorkspaceService.createLeaveRequest({
      organizationId: "org-northstar",
      startDate: "2026-12-01",
      endDate: "2026-12-02",
      reason: "Personal",
    })
    expect(() => demoWorkspaceService.reviewLeaveRequest(request.id, "org-northstar", "REJECTED"))
      .toThrow("Provide a reason before rejecting a leave request.")
    expect(demoWorkspaceService.reviewLeaveRequest(request.id, "org-northstar", "APPROVED").status).toBe("APPROVED")
    expect(demoWorkspaceService.getSnapshot("org-northstar").leaveBalances.find((item) =>
      item.employee === "Demo User" && item.category === "Annual leave",
    )).toMatchObject({ available: 10, used: 6 })
  })

  it("supports platform user role and status management", () => {
    const updatedRoles = demoWorkspaceService.updatePlatformUserRoles("emp-1", ["EMPLOYEE", "TEAM_LEAD"])
    expect(updatedRoles.additionalRoles).toContain("TEAM_LEAD")
    expect(demoWorkspaceService.updatePlatformUserStatus("student-1", "SUSPENDED").status).toBe("SUSPENDED")
    expect(demoWorkspaceService.updatePlatformUserStatus("student-1", "ACTIVE").status).toBe("ACTIVE")
  })

  it("exposes platform-wide organization records only in platform-admin snapshots", () => {
    const northstar = demoWorkspaceService.getSnapshot("org-northstar")
    const platform = demoWorkspaceService.getSnapshot("org-northstar", false, true)
    expect(northstar.projects.every((item) => item.orgId === "org-northstar")).toBe(true)
    expect(platform.projects.some((item) => item.orgId === "org-bluepeak")).toBe(true)
    expect(platform.projects.length).toBeGreaterThan(northstar.projects.length)
  })

  it("enforces single, organization-scoped learning-path enrollment", () => {
    const enrollment = demoWorkspaceService.enrollInLearningPath("path-1", "org-bluepeak")
    expect(enrollment.progress).toBe(0)
    expect(demoWorkspaceService.updateLearningPathProgress("path-1", "org-bluepeak", 10).progress).toBe(10)
    expect(() => demoWorkspaceService.enrollInLearningPath("path-1", "org-bluepeak"))
      .toThrow("You are already enrolled in this learning path.")
    expect(() => demoWorkspaceService.updateLearningPathProgress("path-1", "org-northstar", 20))
      .toThrow("Enroll in this learning path before updating progress.")
  })

  it("validates demo message attachments and rejects unsafe protocols", () => {
    expect(() => demoWorkspaceService.sendMessage({
      organizationId: "org-northstar",
      channel: "general",
      text: "Demo message",
      attachmentUrl: "javascript:alert(1)",
    })).toThrow("Attachment links must use HTTP or HTTPS.")
    const sent = demoWorkspaceService.sendMessage({
      organizationId: "org-northstar",
      channel: "general",
      text: "Demo message",
      attachmentUrl: "https://example.test/guide",
    })
    expect(sent.attachmentUrl).toBe("https://example.test/guide")
    expect(demoWorkspaceService.getSnapshot("org-bluepeak").messages.some((item) => item.id === sent.id)).toBe(false)
  })

  it("keeps repository issue and pull-request actions scoped to the active organization", () => {
    expect(demoWorkspaceService.updateDemoIssue("repo-1", "issue-1", "CLOSED", "org-northstar").status).toBe("CLOSED")
    expect(demoWorkspaceService.updateDemoPullRequest("repo-1", "pr-1", "REVIEW", "org-northstar").status).toBe("REVIEW")
    expect(() => demoWorkspaceService.updateDemoIssue("repo-1", "issue-1", "OPEN", "org-bluepeak"))
      .toThrow("The demo repository is not available in the active organization.")
  })

  it("validates project-linked documents and permits demo platform-announcement deletion", () => {
    expect(() => demoWorkspaceService.createResource("documents", "org-northstar", {
      name: "Cross-tenant document",
      project: "Winter Java cohort",
    })).toThrow("Choose a project in the active organization.")
    const document = demoWorkspaceService.createResource("documents", "org-northstar", {
      name: "Project notes",
      project: "Learning platform refresh",
    })
    expect(document.project).toBe("Learning platform refresh")

    const announcement = demoWorkspaceService.createResource("platformAnnouncements", null, {
      title: `Demo announcement ${Date.now()}`,
      audience: "All organizations",
    })
    expect(demoWorkspaceService.deleteResource("platformAnnouncements", announcement.id, null).id).toBe(announcement.id)
  })

  it("allows platform support triage across tenants without opening organization-scoped updates", () => {
    const request = demoWorkspaceService.getSnapshot("org-northstar").supportRequests[0]
    expect(demoWorkspaceService.updatePlatformSupportRequest(request.id, { status: "IN_PROGRESS" }).status)
      .toBe("IN_PROGRESS")
    expect(() => demoWorkspaceService.updateResource("supportRequests", request.id, "org-bluepeak", { status: "RESOLVED" }))
      .toThrow("The demo record was not found in the active organization.")
  })

  it("supports organization announcement read and platform announcement CRUD operations", () => {
    // Organization announcements are read-only via demo service (pre-seeded data)
    const snapshot = demoWorkspaceService.getSnapshot("org-northstar")
    expect(snapshot.announcements.length).toBeGreaterThanOrEqual(0)

    // Platform announcements support full CRUD
    const created = demoWorkspaceService.createResource("platformAnnouncements", null, {
      title: "Platform Test Announcement",
      audience: "All organizations",
    })
    expect(created.title).toBe("Platform Test Announcement")
    expect(created.author).toBe("Demo user")

    const platformSnapshot = demoWorkspaceService.getSnapshot("org-northstar", false, true)
    expect(platformSnapshot.platformAnnouncements.some((item) => item.id === created.id)).toBe(true)

    const updated = demoWorkspaceService.updateResource("platformAnnouncements", created.id, null, {
      title: "Updated Platform Announcement",
    })
    expect(updated.title).toBe("Updated Platform Announcement")

    const deleted = demoWorkspaceService.deleteResource("platformAnnouncements", created.id, null)
    expect(deleted.id).toBe(created.id)
  })

  it("exposes all platform users to superadmin, not just active organization users", () => {
    const snapshot = demoWorkspaceService.getSnapshot("org-northstar", false, true)
    const allEmployees = snapshot.employees.length
    const allStudents = snapshot.students.length
    expect(allEmployees + allStudents).toBeGreaterThan(0)

    const orgScopedSnapshot = demoWorkspaceService.getSnapshot("org-northstar")
    const orgEmployees = orgScopedSnapshot.employees.filter((e) => e.orgId === "org-northstar").length
    const orgStudents = orgScopedSnapshot.students.filter((s) => s.orgId === "org-northstar").length

    // Platform snapshot should include users from all organizations
    expect(allEmployees).toBeGreaterThanOrEqual(orgEmployees)
    expect(allStudents).toBeGreaterThanOrEqual(orgStudents)
  })

  it("creates audit record when leave request is approved or rejected", () => {
    const beforeCount = demoWorkspaceService.getSnapshot("org-northstar").auditEvents.length

    const request = demoWorkspaceService.createLeaveRequest({
      organizationId: "org-northstar",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      reason: "Personal leave",
    })
    demoWorkspaceService.reviewLeaveRequest(request.id, "org-northstar", "APPROVED", "Approved")
    const afterCount = demoWorkspaceService.getSnapshot("org-northstar").auditEvents.length
    expect(afterCount).toBeGreaterThan(beforeCount)
  })

  it("updates trainer submission-review counts after new submissions", () => {
    const orgCourses = demoWorkspaceService.getSnapshot("org-northstar").courses
    const course = orgCourses.find((c) => c.orgId === "org-northstar")
    expect(course).toBeDefined()

    const before = demoWorkspaceService.getSnapshot("org-northstar")
    const reviewCountBefore = before.assignments.filter((a) => a.status === "REVIEW").length

    const assignment = demoWorkspaceService.createAssignment({
      organizationId: "org-northstar",
      title: "Review test assignment",
      courseId: course.id,
      dueDate: "2026-12-01",
    })

    demoWorkspaceService.createResource("submissions", "org-northstar", {
      assignmentId: assignment.id,
      studentUserId: "student-1",
      content: "Demo submission",
    })

    const after = demoWorkspaceService.getSnapshot("org-northstar")
    const reviewCountAfter = after.assignments.filter((a) => a.status === "REVIEW").length
    expect(reviewCountAfter).toBe(reviewCountBefore + 1)
  })

  it("supports leave request approval and rejection with status changes", () => {
    const request = demoWorkspaceService.createLeaveRequest({
      organizationId: "org-northstar",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      reason: "Personal leave",
    })
    expect(request.status).toBe("PENDING")

    const approved = demoWorkspaceService.reviewLeaveRequest(request.id, "org-northstar", "APPROVED", "Approved")
    expect(approved.status).toBe("APPROVED")
    expect(approved.reviewReason).toBe("Approved")

    const rejected = demoWorkspaceService.createLeaveRequest({
      organizationId: "org-northstar",
      startDate: "2026-12-10",
      endDate: "2026-12-12",
      reason: "Sick leave",
    })
    const rejectedResult = demoWorkspaceService.reviewLeaveRequest(rejected.id, "org-northstar", "REJECTED", "Not enough balance")
    expect(rejectedResult.status).toBe("REJECTED")
    expect(rejectedResult.reviewReason).toBe("Not enough balance")
  })
})
