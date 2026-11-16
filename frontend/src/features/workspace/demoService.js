import {
  DEMO_ANNOUNCEMENTS,
  DEMO_APPLICATIONS,
  DEMO_ASSIGNMENTS,
  DEMO_AUDIT_EVENTS,
  DEMO_CALENDAR_EVENTS,
  DEMO_CHALLENGES,
  DEMO_CERTIFICATES,
  DEMO_COURSES,
  DEMO_COURSE_RESOURCES,
  DEMO_CURRICULUM,
  DEMO_DEPARTMENTS,
  DEMO_DOCUMENTS,
  DEMO_EMPLOYEES,
  DEMO_ATTENDANCE,
  DEMO_GOALS,
  DEMO_HOLIDAYS,
  DEMO_LEARNING_PATHS,
  DEMO_LEAVE_BALANCES,
  DEMO_MESSAGES,
  DEMO_MEETINGS,
  DEMO_NOTIFICATIONS,
  DEMO_ORGANIZATIONS,
  DEMO_PLATFORM_ANNOUNCEMENTS,
  DEMO_POLICIES,
  DEMO_PROJECTS,
  DEMO_ROLE_PERMISSIONS,
  DEMO_SECURITY_EVENTS,
  DEMO_SUBMISSIONS,
  DEMO_SUPPORT_REQUESTS,
  DEMO_STUDENTS,
  DEMO_TASKS,
  DEMO_TEAMS,
  DEMO_TRAINING,
  DEMO_REPOSITORIES,
  DEMO_REPOSITORY_ACTIVITY,
  DEMO_DASHBOARD_METRICS,
  DEMO_PROFILE,
} from "./demoData"

const copy = (value) => structuredClone(value)

const state = {
  organizations: copy(DEMO_ORGANIZATIONS),
  employees: copy(DEMO_EMPLOYEES.map((employee) => ({ ...employee, additionalRoles: employee.additionalRoles ?? [] }))),
  teams: copy(DEMO_TEAMS),
  departments: copy(DEMO_DEPARTMENTS),
  projects: copy(DEMO_PROJECTS),
  tasks: copy(DEMO_TASKS),
  applications: copy(DEMO_APPLICATIONS),
  courses: copy(DEMO_COURSES),
  independentCourseProgress: {},
  students: copy(DEMO_STUDENTS),
  calendarEvents: copy(DEMO_CALENDAR_EVENTS),
  announcements: copy(DEMO_ANNOUNCEMENTS),
  documents: copy(DEMO_DOCUMENTS),
  messages: copy(DEMO_MESSAGES),
  assignments: copy(DEMO_ASSIGNMENTS),
  challenges: copy(DEMO_CHALLENGES),
  certificates: copy(DEMO_CERTIFICATES),
  submissions: copy(DEMO_SUBMISSIONS),
  courseResources: copy(DEMO_COURSE_RESOURCES),
  curriculum: copy(DEMO_CURRICULUM),
  learningPaths: copy(DEMO_LEARNING_PATHS),
  learningPathEnrollments: [],
  notifications: copy(DEMO_NOTIFICATIONS),
  policies: copy(DEMO_POLICIES),
  goals: copy(DEMO_GOALS),
  supportRequests: copy(DEMO_SUPPORT_REQUESTS),
  meetings: copy(DEMO_MEETINGS),
  repositories: copy(DEMO_REPOSITORIES),
  repositoryActivity: copy(DEMO_REPOSITORY_ACTIVITY),
  holidays: copy(DEMO_HOLIDAYS),
  training: copy(DEMO_TRAINING),
  attendance: copy(DEMO_ATTENDANCE),
  leaveBalances: copy(DEMO_LEAVE_BALANCES),
  securityEvents: copy(DEMO_SECURITY_EVENTS),
  platformAnnouncements: copy(DEMO_PLATFORM_ANNOUNCEMENTS),
  rolePermissions: copy(DEMO_ROLE_PERMISSIONS.map((name) => ({ id: `platform-role-${name}`, name, scope: "Platform", status: "ENABLED" }))),
  organizationPermissions: copy(DEMO_ROLE_PERMISSIONS.flatMap((name, index) => ["org-northstar", "org-bluepeak"].map((organizationId, organizationIndex) => ({
    id: `org-permission-${index}-${organizationIndex}`,
    name,
    orgId: organizationId,
    permissions: { EMPLOYEE: index === 0, TEAM_LEAD: index < 3, ORG_ADMIN: true },
  })))),
  profile: copy(DEMO_PROFILE),
  dashboardMetrics: copy(DEMO_DASHBOARD_METRICS),
  auditEvents: copy(DEMO_AUDIT_EVENTS),
  platformConfiguration: { approvalRequired: true, invitationsEnabled: true, auditRetention: "90" },
  workLogs: [],
  leaveRequests: [],
  nextId: 1,
}

const organizationItems = (items, organizationId) =>
  items.filter((item) => organizationId ? item.orgId === organizationId : !item.orgId)

const belongsToOrganization = (item, organizationId) =>
  organizationId ? item.orgId === organizationId : !item.orgId

function recordAudit(organizationId, action, target) {
  state.auditEvents.unshift({
    id: `audit-demo-${Date.now()}-${state.nextId++}`,
    actor: "Demo user",
    action,
    target,
    date: new Date().toISOString(),
    result: "SUCCESS",
    ...(organizationId ? { orgId: organizationId } : {}),
  })
}

const GLOBAL_RESOURCES = new Set([
  "organizations",
  "applications",
  "challenges",
  "certificates",
  "auditEvents",
  "securityEvents",
  "rolePermissions",
  "platformAnnouncements",
])

const EDITABLE_FIELDS = {
  assignments: ["title", "course", "dueDate", "instructions", "submissions", "status"],
  attendance: ["employee", "date", "checkIn", "checkOut", "status"],
  calendarEvents: ["date", "time", "title", "type"],
  courseResources: ["title", "course", "type", "url", "updatedAt"],
  courses: ["name", "category", "level", "lessons", "progress"],
  curriculum: ["title", "course", "order", "status"],
  departments: ["name", "owner", "members"],
  documents: ["name", "category", "owner", "project", "updatedAt"],
  employees: ["name", "email", "department", "team", "role", "additionalRoles", "status"],
  goals: ["title", "owner", "period", "progress", "status"],
  holidays: ["title", "date", "region", "status"],
  learningPaths: ["title", "level", "progress", "milestones", "status"],
  leaveBalances: ["employee", "category", "available", "used"],
  leaveRequests: ["employee", "startDate", "endDate", "reason", "status"],
  meetings: ["title", "date", "time", "type", "attendees", "agenda", "status"],
  messages: ["channel", "author", "text", "time"],
  notifications: ["title", "description", "date", "status"],
  platformAnnouncements: ["title", "audience", "author", "date"],
  policies: ["title", "category", "owner", "updatedAt"],
  projects: ["name", "owner", "members", "startDate", "milestones", "status", "progress", "dueDate", "description"],
  repositories: ["name", "provider", "branch", "visibility", "status"],
  students: ["name", "cohort", "progress", "lastActive", "status"],
  submissions: ["assignmentId", "assignment", "student", "submittedAt", "status", "grade", "feedback", "content", "link"],
  supportRequests: ["subject", "category", "status", "createdAt", "description"],
  tasks: ["title", "projectId", "assignee", "priority", "status", "dueDate", "description", "attachmentUrl"],
  teams: ["name", "department", "lead", "members"],
  training: ["title", "category", "audience", "status", "dueDate"],
  workLogs: ["project", "hours", "note", "date", "status"],
}

const REQUIRED_FIELDS = {
  announcements: ["title"],
  assignments: ["title", "course"],
  calendarEvents: ["date", "title"],
  courseResources: ["title", "course"],
  courses: ["name"],
  curriculum: ["title", "course"],
  departments: ["name"],
  documents: ["name"],
  goals: ["title"],
  holidays: ["title", "date"],
  learningPaths: ["title"],
  leaveRequests: ["startDate", "endDate", "reason"],
  meetings: ["title", "date"],
  platformAnnouncements: ["title"],
  policies: ["title"],
  projects: ["name"],
  students: ["name"],
  submissions: ["assignmentId", "content"],
  supportRequests: ["subject", "description"],
  tasks: ["title"],
  teams: ["name"],
  training: ["title"],
  workLogs: ["hours"],
}

const NUMERIC_FIELDS = new Set(["available", "grade", "hours", "lessons", "members", "order", "progress", "submissions", "used"])

function normalizeResourceValues(resource, values) {
  const allowedFields = EDITABLE_FIELDS[resource]
  if (!allowedFields) throw new Error("This demo resource cannot be changed.")
  const normalized = {}
  for (const key of allowedFields) {
    if (values[key] === undefined) continue
    const value = Array.isArray(values[key])
      ? values[key].map((item) => String(item).trim()).filter(Boolean)
      : typeof values[key] === "string" ? values[key].trim() : values[key]
    normalized[key] = NUMERIC_FIELDS.has(key) && value !== "" ? Number(value) : value
  }
  if (resource === "employees" && Array.isArray(normalized.additionalRoles) && normalized.role) {
    normalized.additionalRoles = normalized.additionalRoles.filter((role) => role !== normalized.role)
  }
  for (const key of REQUIRED_FIELDS[resource] ?? []) {
    if (normalized[key] === undefined || normalized[key] === "") {
      throw new Error(`${key} is required.`)
    }
  }
  if (resource === "workLogs" && (!Number.isFinite(normalized.hours) || normalized.hours <= 0 || normalized.hours > 24)) {
    throw new Error("Enter a duration between 0 and 24 hours.")
  }
  if (resource === "projects" && normalized.progress !== undefined && (normalized.progress < 0 || normalized.progress > 100)) {
    throw new Error("Progress must be between 0 and 100.")
  }
  if (resource === "submissions" && normalized.grade !== undefined && normalized.grade !== "" &&
    (!Number.isFinite(normalized.grade) || normalized.grade < 0 || normalized.grade > 100)) {
    throw new Error("Grade must be between 0 and 100.")
  }
  if (resource === "tasks" && normalized.attachmentUrl) {
    let attachmentUrl
    try {
      attachmentUrl = new URL(normalized.attachmentUrl)
    } catch {
      throw new Error("Enter a valid attachment link.")
    }
    if (!["http:", "https:"].includes(attachmentUrl.protocol)) {
      throw new Error("Attachment links must use HTTP or HTTPS.")
    }
  }
  if (resource === "courseResources" && normalized.url) {
    let resourceUrl
    try {
      resourceUrl = new URL(normalized.url)
    } catch {
      throw new Error("Enter a valid resource link.")
    }
    if (!["http:", "https:"].includes(resourceUrl.protocol)) {
      throw new Error("Resource links must use HTTP or HTTPS.")
    }
  }
  return normalized
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function validateResourceOrganization(resource, values, organizationId) {
  if (resource === "documents" && values.project && !state.projects.some((item) =>
    item.orgId === organizationId && item.name === values.project,
  )) {
    throw new Error("Choose a project in the active organization.")
  }
  if (resource === "tasks" && values.projectId && !state.projects.some((item) =>
    item.id === values.projectId && item.orgId === organizationId,
  )) {
    throw new Error("Choose a project in the active organization.")
  }
}

export const demoWorkspaceService = {
  getSnapshot(organizationId, includeAllCourses = false, includePlatformData = false) {
    const visibleItems = (items) =>
      includePlatformData ? items : organizationItems(items, organizationId)
    return copy({
      organizations: state.organizations,
      employees: visibleItems(state.employees),
      teams: visibleItems(state.teams),
      departments: visibleItems(state.departments),
      projects: visibleItems(state.projects),
      tasks: visibleItems(state.tasks),
      applications: state.applications,
      courses: includePlatformData
        ? state.courses
        : includeAllCourses
        ? state.courses.map((course) => ({ ...course, progress: state.independentCourseProgress[course.id] ?? 0 }))
        : organizationItems(state.courses, organizationId),
      students: visibleItems(state.students),
      calendarEvents: visibleItems(state.calendarEvents),
      announcements: visibleItems(state.announcements),
      documents: visibleItems(state.documents),
      messages: visibleItems(state.messages),
      assignments: visibleItems(state.assignments),
      challenges: state.challenges,
      certificates: state.certificates,
      submissions: visibleItems(state.submissions),
      courseResources: visibleItems(state.courseResources),
      curriculum: visibleItems(state.curriculum),
      learningPaths: visibleItems(state.learningPaths),
      learningPathEnrollments: visibleItems(state.learningPathEnrollments),
      notifications: visibleItems(state.notifications),
      policies: visibleItems(state.policies),
      goals: visibleItems(state.goals),
      supportRequests: visibleItems(state.supportRequests),
      meetings: visibleItems(state.meetings),
      repositories: visibleItems(state.repositories),
      repositoryActivity: visibleItems(state.repositoryActivity),
      holidays: visibleItems(state.holidays),
      training: visibleItems(state.training),
      attendance: visibleItems(state.attendance),
      leaveBalances: visibleItems(state.leaveBalances),
      securityEvents: state.securityEvents,
      platformAnnouncements: state.platformAnnouncements,
      rolePermissions: state.rolePermissions,
      organizationPermissions: organizationItems(state.organizationPermissions, organizationId),
      platformConfiguration: state.platformConfiguration,
      profile: state.profile,
      dashboardMetrics: state.dashboardMetrics,
      auditEvents: includePlatformData ? state.auditEvents : organizationItems(state.auditEvents, organizationId),
      workLogs: visibleItems(state.workLogs),
      leaveRequests: visibleItems(state.leaveRequests),
    })
  },

  createResource(resource, organizationId, values) {
    const collection = state[resource]
    if (!Array.isArray(collection)) throw new Error("The requested demo resource is unavailable.")
    if (GLOBAL_RESOURCES.has(resource) && resource !== "platformAnnouncements") {
      throw new Error("This demo resource is read-only.")
    }
    const normalized = normalizeResourceValues(resource, values)
    validateResourceOrganization(resource, normalized, organizationId)
    const now = new Date()
    if (resource === "submissions") {
      normalized.student = normalized.student || "Demo User"
      normalized.submittedAt = now.toISOString().slice(0, 10)
      normalized.status = "SUBMITTED"
      const assignment = state.assignments.find((item) =>
        item.id === normalized.assignmentId && belongsToOrganization(item, organizationId),
      )
      if (!assignment) throw new Error("Choose an assignment in the active organization.")
      assignment.submissions = Number(assignment.submissions ?? 0) + 1
      assignment.status = "REVIEW"
    }
    if (resource === "supportRequests") {
      normalized.status = "OPEN"
      normalized.createdAt = now.toISOString().slice(0, 10)
    }
    if (resource === "workLogs") {
      normalized.date = now.toISOString().slice(0, 10)
      normalized.status = "DRAFT"
    }
    if (resource === "leaveRequests") {
      if (!isValidDateString(normalized.startDate) || !isValidDateString(normalized.endDate)) {
        throw new Error("Enter valid leave request dates.")
      }
      if (normalized.endDate < normalized.startDate) {
        throw new Error("End date must be on or after the start date.")
      }
      normalized.employee = "Demo User"
      normalized.status = "PENDING"
    }
    if (resource === "projects") {
      normalized.owner = normalized.owner || "Demo User"
      normalized.members = normalized.members || "Demo User"
    }
    if (resource === "tasks" && !normalized.projectId) {
      normalized.projectId = state.projects.find((item) => item.orgId === organizationId)?.id ?? ""
    }
    if (resource === "announcements" || resource === "platformAnnouncements") {
      normalized.author = "Demo user"
      normalized.date = now.toISOString().slice(0, 10)
    }
    if (resource === "courses") {
      normalized.progress = 0
      normalized.status = "PUBLISHED"
    }
    if (resource === "assignments") {
      normalized.submissions = Number(normalized.submissions ?? 0)
      normalized.status = normalized.status || "OPEN"
    }
    if (resource === "meetings") normalized.status = "SCHEDULED"
    if (resource === "projects") normalized.progress = Number(normalized.progress ?? 0)
    if (resource === "teams" || resource === "departments") normalized.members = Number(normalized.members ?? 0)
    if (resource === "learningPaths") normalized.progress = Number(normalized.progress ?? 0)
    if (resource === "documents" || resource === "policies" || resource === "courseResources") {
      normalized.updatedAt = now.toISOString().slice(0, 10)
    }
    if (resource === "tasks") {
      normalized.comments = []
      normalized.history = [{ action: "Task created", actor: "Demo User", at: now.toISOString() }]
    }
    const record = {
      ...normalized,
      id: `${resource}-demo-${Date.now()}-${state.nextId++}`,
      ...(GLOBAL_RESOURCES.has(resource) ? {} : { orgId: organizationId }),
    }
    collection.unshift(record)
    recordAudit(GLOBAL_RESOURCES.has(resource) ? null : organizationId, "Created demo record", resource)
    return copy(record)
  },

  updateResource(resource, recordId, organizationId, values) {
    if (GLOBAL_RESOURCES.has(resource) && resource !== "platformAnnouncements") {
      throw new Error("This demo resource is read-only.")
    }
    const collection = state[resource]
    const record = Array.isArray(collection) && collection.find((item) =>
      item.id === recordId && (GLOBAL_RESOURCES.has(resource) || belongsToOrganization(item, organizationId)),
    )
    if (!record) throw new Error("The demo record was not found in the active organization.")
    const normalized = normalizeResourceValues(resource, { ...record, ...values })
    validateResourceOrganization(resource, normalized, organizationId)
    if (resource === "submissions" && normalized.assignmentId !== record.assignmentId) {
      throw new Error("A submission cannot be moved to another assignment.")
    }
    if (resource === "submissions" && normalized.status === "GRADED" && !Number.isFinite(normalized.grade)) {
      throw new Error("Enter a grade before marking the submission as graded.")
    }
    const changed = Object.keys(normalized).some((key) => normalized[key] !== record[key])
    Object.assign(record, normalized)
    if (resource === "tasks" && changed) {
      if (!record.history) record.history = []
      record.history.unshift({ action: "Task details updated", actor: "Demo User", at: new Date().toISOString() })
    }
    if (resource === "submissions" && changed) {
      const assignment = state.assignments.find((item) => item.id === record.assignmentId)
      if (assignment) {
        assignment.status = state.submissions.some((item) =>
          item.assignmentId === assignment.id && item.status !== "GRADED",
        ) ? "REVIEW" : "CLOSED"
      }
    }
    recordAudit(GLOBAL_RESOURCES.has(resource) ? null : organizationId, "Updated demo record", resource)
    return copy(record)
  },

  deleteResource(resource, recordId, organizationId) {
    if (GLOBAL_RESOURCES.has(resource) && resource !== "platformAnnouncements") {
      throw new Error("This demo resource cannot be deleted.")
    }
    const collection = state[resource]
    if (!Array.isArray(collection)) throw new Error("The requested demo resource is unavailable.")
    const index = collection.findIndex((item) =>
      item.id === recordId &&
      (resource === "platformAnnouncements" || belongsToOrganization(item, organizationId)),
    )
    if (index < 0) throw new Error("The demo record was not found in the active organization.")
    const [record] = collection.splice(index, 1)
    if (resource === "submissions") {
      const assignment = state.assignments.find((item) => item.id === record.assignmentId)
      if (assignment) {
        assignment.submissions = Math.max(0, Number(assignment.submissions ?? 0) - 1)
        assignment.status = state.submissions.some((item) =>
          item.assignmentId === assignment.id && item.status !== "GRADED",
        ) ? "REVIEW" : "OPEN"
      }
    }
    if (resource === "assignments") {
      state.submissions = state.submissions.filter((item) => item.assignmentId !== record.id)
    }
    recordAudit(GLOBAL_RESOURCES.has(resource) ? null : organizationId, "Deleted demo record", resource)
    return copy(record)
  },

  updateProfile(values) {
    const displayName = String(values.displayName ?? "").trim()
    const email = String(values.email ?? "").trim()
    if (!displayName || !email) throw new Error("Name and email are required.")
    state.profile = { ...state.profile, displayName, email }
    recordAudit(null, "Updated demo profile", "profile")
    return copy(state.profile)
  },

  updateIndependentCourseProgress(courseId, progress) {
    const course = state.courses.find((item) => item.id === courseId)
    if (!course) throw new Error("The demo course could not be found.")
    const nextProgress = Number(progress)
    if (!Number.isInteger(nextProgress) || nextProgress < 0 || nextProgress > 100) {
      throw new Error("Course progress must be between 0 and 100.")
    }
    state.independentCourseProgress[courseId] = nextProgress
    recordAudit(null, "Updated independent learning progress", "course progress")
    return { courseId, progress: nextProgress }
  },

  enrollInLearningPath(pathId, organizationId) {
    const path = state.learningPaths.find((item) =>
      item.id === pathId && belongsToOrganization(item, organizationId),
    )
    if (!path) throw new Error("The learning path is not available in the active organization.")
    const existing = state.learningPathEnrollments.find((item) =>
      item.pathId === pathId && item.orgId === organizationId && item.student === "Demo User",
    )
    if (existing) throw new Error("You are already enrolled in this learning path.")
    const enrollment = {
      id: `path-enrollment-demo-${Date.now()}-${state.nextId++}`,
      pathId,
      student: "Demo User",
      progress: 0,
      orgId: organizationId,
    }
    state.learningPathEnrollments.unshift(enrollment)
    recordAudit(organizationId, "Enrolled in learning path", "learning path")
    return copy(enrollment)
  },

  updateLearningPathProgress(pathId, organizationId, progress) {
    const enrollment = state.learningPathEnrollments.find((item) =>
      item.pathId === pathId && item.orgId === organizationId && item.student === "Demo User",
    )
    if (!enrollment) throw new Error("Enroll in this learning path before updating progress.")
    const nextProgress = Number(progress)
    if (!Number.isInteger(nextProgress) || nextProgress < enrollment.progress || nextProgress > 100) {
      throw new Error("Learning path progress must advance from its current value through 100.")
    }
    enrollment.progress = nextProgress
    recordAudit(organizationId, "Updated learning path progress", "learning path")
    return copy(enrollment)
  },

  updateRolePermission(permissionId, role, enabled, organizationId) {
    if (!["EMPLOYEE", "TEAM_LEAD", "ORG_ADMIN"].includes(role)) {
      throw new Error("Choose a valid organization role.")
    }
    const permission = state.organizationPermissions.find((item) =>
      item.id === permissionId && item.orgId === organizationId,
    )
    if (!permission) throw new Error("The permission does not belong to the active organization.")
    permission.permissions[role] = Boolean(enabled)
    recordAudit(organizationId, "Updated role capability", "organization permissions")
    return copy(permission)
  },

  updatePlatformConfiguration(values) {
    const allowed = ["approvalRequired", "invitationsEnabled", "auditRetention"]
    const keys = Object.keys(values)
    if (keys.some((key) => !allowed.includes(key))) {
      throw new Error("The requested platform setting cannot be changed.")
    }
    if (values.approvalRequired !== undefined && typeof values.approvalRequired !== "boolean") {
      throw new Error("Organization approval must be enabled or disabled.")
    }
    if (values.invitationsEnabled !== undefined && typeof values.invitationsEnabled !== "boolean") {
      throw new Error("Invitation availability must be enabled or disabled.")
    }
    if (values.auditRetention !== undefined) {
      const retention = Number(values.auditRetention)
      if (!Number.isInteger(retention) || retention < 1 || retention > 3650) {
        throw new Error("Audit retention must be between 1 and 3650 days.")
      }
      state.platformConfiguration.auditRetention = String(retention)
    }
    if (values.approvalRequired !== undefined) state.platformConfiguration.approvalRequired = values.approvalRequired
    if (values.invitationsEnabled !== undefined) state.platformConfiguration.invitationsEnabled = values.invitationsEnabled
    recordAudit(null, "Updated platform configuration", "platform settings")
    return copy(state.platformConfiguration)
  },

  createTask({ organizationId, title, assignee, priority, dueDate, description }) {
    if (!title?.trim()) throw new Error("A task title is required.")
    const task = {
      id: `task-demo-${Date.now()}`,
      title: title.trim(),
      projectId: state.projects.find((project) => project.orgId === organizationId)?.id ?? "",
      assignee: assignee?.trim() || "Demo user",
      priority: priority || "MEDIUM",
      status: "TODO",
      dueDate: dueDate || "",
      description: description?.trim() || "",
      comments: [],
      history: [{ action: "Task created", actor: "Demo User", at: new Date().toISOString() }],
      orgId: organizationId,
    }
    state.tasks.unshift(task)
    recordAudit(organizationId, "Created task", "task")
    return copy(task)
  },

  createCourse({ organizationId, name, category, level, lessons }) {
    if (!name?.trim()) throw new Error("A course name is required.")
    const lessonCount = Number(lessons)
    if (!Number.isInteger(lessonCount) || lessonCount < 1) {
      throw new Error("Enter at least one lesson.")
    }
    const course = {
      id: `course-demo-${Date.now()}`,
      name: name.trim(),
      category: category?.trim() || "General",
      level: level || "Beginner",
      lessons: lessonCount,
      progress: 0,
      orgId: organizationId,
    }
    state.courses.unshift(course)
    recordAudit(organizationId, "Created course", "course")
    return copy(course)
  },

  createAssignment({ organizationId, title, courseId, dueDate }) {
    if (!title?.trim() || !courseId || !dueDate) {
      throw new Error("Assignment title, course, and due date are required.")
    }
    const course = state.courses.find(
      (item) => item.id === courseId && item.orgId === organizationId,
    )
    if (!course) throw new Error("Choose a course in the active organization.")
    const assignment = {
      id: `assignment-demo-${Date.now()}`,
      title: title.trim(),
      course: course.name,
      dueDate,
      submissions: 0,
      status: "OPEN",
      orgId: organizationId,
    }
    state.assignments.unshift(assignment)
    recordAudit(organizationId, "Created assignment", "assignment")
    return copy(assignment)
  },

  updateTaskStatus(taskId, status, organizationId) {
    const task = state.tasks.find((item) =>
      item.id === taskId && (!organizationId || item.orgId === organizationId),
    )
    if (!task) throw new Error("The demo task could not be found.")
    if (!["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"].includes(status)) {
      throw new Error("Choose a valid task status.")
    }
    if (task.status !== status) {
      if (!task.history) task.history = []
      task.history.unshift({ action: `Status changed to ${status.replaceAll("_", " ")}`, actor: "Demo User", at: new Date().toISOString() })
    }
    task.status = status
    recordAudit(organizationId || task.orgId, "Updated task status", "task")
    return copy(task)
  },

  addTaskComment(taskId, text, organizationId) {
    const task = state.tasks.find((item) =>
      item.id === taskId && (!organizationId || item.orgId === organizationId),
    )
    if (!task) throw new Error("The demo task could not be found.")
    if (!text?.trim()) throw new Error("A comment cannot be empty.")
    task.comments.push({ author: "Demo user", text: text.trim() })
    if (!task.history) task.history = []
    task.history.unshift({ action: "Comment added", actor: "Demo User", at: new Date().toISOString() })
    recordAudit(organizationId || task.orgId, "Added task comment", "task")
    return copy(task)
  },

  reviewApplication(applicationId, { decision, reason = "" }) {
    const application = state.applications.find((item) => item.id === applicationId)
    if (!application) throw new Error("The demo application could not be found.")
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      throw new Error("Choose approve or reject.")
    }
    if (decision === "REJECTED" && !reason.trim()) {
      throw new Error("Provide a reason before rejecting an application.")
    }
    application.status = decision
    application.reason = reason.trim()
    const organization = state.organizations.find(
      (item) => item.name === application.organizationName,
    )
    if (organization) organization.status = decision === "APPROVED" ? "ACTIVE" : "REJECTED"
    else {
      state.organizations.push({
        id: `org-demo-${Date.now()}`,
        name: application.organizationName,
        type: application.type,
        status: decision === "APPROVED" ? "ACTIVE" : "REJECTED",
        domain: "",
        employees: 0,
        students: 0,
        plan: "Demo workspace",
      })
    }
    recordAudit(null, `Organization application ${decision.toLowerCase()}`, application.organizationName)
    return copy(application)
  },

  submitOrganizationApplication({ organizationName, type, contactName, contactEmail }) {
    if (!organizationName?.trim() || !contactName?.trim() || !contactEmail?.trim()) {
      throw new Error("Organization name, contact name, and email are required.")
    }
    const application = {
      id: `application-demo-${Date.now()}`,
      organizationName: organizationName.trim(),
      type: type || "Company",
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      requestedAt: new Date().toISOString().slice(0, 10),
      status: "PENDING",
      reason: "",
    }
    state.applications.unshift(application)
    recordAudit(null, "Submitted organization application", "organization application")
    return copy(application)
  },

  inviteEmployee({ organizationId, name, email, department }) {
    if (!name?.trim() || !email?.trim()) {
      throw new Error("Name and email are required.")
    }
    const employee = {
      id: `employee-demo-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      department: department?.trim() || "Unassigned",
      team: "Unassigned",
      role: "EMPLOYEE",
      status: "INVITED",
      orgId: organizationId,
    }
    state.employees.unshift(employee)
    recordAudit(organizationId, "Invited employee", "organization membership")
    return copy(employee)
  },

  updateOrganizationDetails({ organizationId, name, domain, type }) {
    const organization = state.organizations.find((item) => item.id === organizationId)
    if (!organization) throw new Error("The demo organization could not be found.")
    if (!name?.trim()) throw new Error("An organization name is required.")
    organization.name = name.trim()
    organization.domain = domain?.trim() || ""
    organization.type = type?.trim() || organization.type
    recordAudit(organizationId, "Updated organization profile", "organization")
    return copy(organization)
  },

  updateEmployee({ employeeId, role, status, organizationId }) {
    const employee = state.employees.find((item) =>
      item.id === employeeId && (!organizationId || item.orgId === organizationId),
    )
    if (!employee) throw new Error("The demo employee could not be found.")
    if (role) employee.role = role
    if (status) employee.status = status
    recordAudit(organizationId || employee.orgId, "Updated employee access", "organization membership")
    return copy(employee)
  },

  updatePlatformUserRoles(userId, roles) {
    const validRoles = new Set(["STUDENT", "TRAINER", "EMPLOYEE", "TEAM_LEAD", "ORG_ADMIN", "SUPER_ADMIN"])
    const normalizedRoles = [...new Set((roles ?? []).map((role) => String(role).trim()))]
    if (normalizedRoles.length === 0 || normalizedRoles.some((role) => !validRoles.has(role))) {
      throw new Error("Choose at least one valid platform role.")
    }
    const employee = state.employees.find((item) => item.id === userId)
    if (employee) {
      employee.role = normalizedRoles[0]
      employee.additionalRoles = normalizedRoles.slice(1)
    } else {
      const student = state.students.find((item) => item.id === userId)
      if (!student) throw new Error("The platform user could not be found.")
      student.roles = normalizedRoles
    }
    recordAudit(null, "Updated platform user roles", userId)
    return copy(employee ?? state.students.find((item) => item.id === userId))
  },

  updatePlatformUserStatus(userId, status) {
    if (!["ACTIVE", "INVITED", "SUSPENDED"].includes(status)) {
      throw new Error("Choose a valid platform user status.")
    }
    const user = state.employees.find((item) => item.id === userId) ??
      state.students.find((item) => item.id === userId)
    if (!user) throw new Error("The platform user could not be found.")
    user.status = status
    recordAudit(null, `Updated platform user status to ${status.toLowerCase()}`, userId)
    return copy(user)
  },

  updatePlatformSupportRequest(requestId, values) {
    const request = state.supportRequests.find((item) => item.id === requestId)
    if (!request) throw new Error("The platform support request could not be found.")
    const normalized = normalizeResourceValues("supportRequests", { ...request, ...values })
    Object.assign(request, normalized)
    recordAudit(null, "Updated platform support request", requestId)
    return copy(request)
  },

  updateDemoIssue(repositoryId, issueId, status, organizationId) {
    if (!["OPEN", "CLOSED"].includes(status)) throw new Error("Choose a valid issue status.")
    const repository = state.repositories.find((item) => item.id === repositoryId && item.orgId === organizationId)
    const activity = state.repositoryActivity.find((item) =>
      item.repositoryId === repositoryId && item.orgId === organizationId,
    )
    if (!repository || !activity) throw new Error("The demo repository is not available in the active organization.")
    const issue = activity.issues.find((item) => item.id === issueId)
    if (!issue) throw new Error("The demo issue could not be found.")
    issue.status = status
    recordAudit(organizationId, `Demo issue ${status.toLowerCase()}`, repository.name)
    return copy(issue)
  },

  updateDemoPullRequest(repositoryId, pullRequestId, status, organizationId) {
    if (!["OPEN", "REVIEW", "MERGED", "CLOSED"].includes(status)) {
      throw new Error("Choose a valid pull request status.")
    }
    const repository = state.repositories.find((item) => item.id === repositoryId && item.orgId === organizationId)
    const activity = state.repositoryActivity.find((item) =>
      item.repositoryId === repositoryId && item.orgId === organizationId,
    )
    if (!repository || !activity) throw new Error("The demo repository is not available in the active organization.")
    const pullRequest = activity.pullRequests.find((item) => item.id === pullRequestId)
    if (!pullRequest) throw new Error("The demo pull request could not be found.")
    pullRequest.status = status
    recordAudit(organizationId, `Demo pull request marked ${status.toLowerCase()}`, repository.name)
    return copy(pullRequest)
  },

  createTeam({ organizationId, name, department, lead }) {
    if (!name?.trim()) throw new Error("A team name is required.")
    const team = {
      id: `team-demo-${Date.now()}`,
      name: name.trim(),
      department: department?.trim() || "Unassigned",
      lead: lead?.trim() || "Unassigned",
      members: 0,
      orgId: organizationId,
    }
    state.teams.unshift(team)
    recordAudit(organizationId, "Created team", "team")
    return copy(team)
  },

  createDepartment({ organizationId, name, owner }) {
    if (!name?.trim()) throw new Error("A department name is required.")
    const department = {
      id: `department-demo-${Date.now()}`,
      name: name.trim(),
      owner: owner?.trim() || "Unassigned",
      members: 0,
      orgId: organizationId,
    }
    state.departments.unshift(department)
    recordAudit(organizationId, "Created department", "department")
    return copy(department)
  },

  createAnnouncement({ organizationId, title, audience }) {
    if (!title?.trim()) throw new Error("An announcement title is required.")
    const announcement = {
      id: `announcement-demo-${Date.now()}`,
      title: title.trim(),
      audience: audience?.trim() || "Everyone",
      author: "Demo user",
      date: new Date().toISOString().slice(0, 10),
      orgId: organizationId,
    }
    state.announcements.unshift(announcement)
    recordAudit(organizationId, "Published announcement", "announcement")
    return copy(announcement)
  },

  createWorkLog({ organizationId, project, hours, note }) {
    const numericHours = Number(hours)
    if (!Number.isFinite(numericHours) || numericHours <= 0 || numericHours > 24) {
      throw new Error("Enter a duration between 0 and 24 hours.")
    }
    const workLog = {
      id: `worklog-demo-${Date.now()}`,
      project: project?.trim() || "General",
      hours: numericHours,
      note: note?.trim() || "",
      date: new Date().toISOString().slice(0, 10),
      status: "DRAFT",
      orgId: organizationId,
    }
    state.workLogs.unshift(workLog)
    recordAudit(organizationId, "Created work log", "work log")
    return copy(workLog)
  },

  createLeaveRequest({ organizationId, startDate, endDate, reason }) {
    if (!startDate || !endDate || !reason?.trim()) {
      throw new Error("Start date, end date, and reason are required.")
    }
    if (endDate < startDate) throw new Error("End date must be on or after the start date.")
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      throw new Error("Enter valid leave request dates.")
    }
    const request = {
      id: `leave-demo-${Date.now()}`,
      employee: "Demo User",
      startDate,
      endDate,
      reason: reason.trim(),
      status: "PENDING",
      orgId: organizationId,
    }
    state.leaveRequests.unshift(request)
    recordAudit(organizationId, "Submitted leave request", "leave request")
    return copy(request)
  },

  reviewLeaveRequest(requestId, organizationId, decision, reason = "") {
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      throw new Error("Choose approve or reject.")
    }
    if (decision === "REJECTED" && !reason.trim()) {
      throw new Error("Provide a reason before rejecting a leave request.")
    }
    const request = state.leaveRequests.find((item) =>
      item.id === requestId && item.orgId === organizationId,
    )
    if (!request) throw new Error("The leave request was not found in the active organization.")
    if (request.status !== "PENDING") throw new Error("This leave request has already been reviewed.")
    if (decision === "APPROVED") {
      const days = Math.floor((Date.parse(request.endDate) - Date.parse(request.startDate)) / 86400000) + 1
      let balance = state.leaveBalances.find((item) =>
        item.employee === request.employee && item.orgId === organizationId && item.category === "Annual leave",
      )
      if (!balance) {
        balance = {
          id: `balance-demo-${Date.now()}`,
          employee: request.employee,
          category: "Annual leave",
          available: 12,
          used: 0,
          orgId: organizationId,
        }
        state.leaveBalances.unshift(balance)
      }
      if (balance.available < days) throw new Error("The employee does not have enough annual leave remaining.")
      balance.available -= days
      balance.used += days
    }
    request.status = decision
    request.reviewReason = reason.trim()
    request.reviewedAt = new Date().toISOString().slice(0, 10)
    recordAudit(organizationId, `Leave request ${decision.toLowerCase()}`, request.employee)
    return copy(request)
  },

  checkIn(organizationId) {
    const today = new Date().toISOString().slice(0, 10)
    const existing = state.attendance.find((item) =>
      item.employee === "Demo User" && item.date === today && item.orgId === organizationId,
    )
    if (existing) throw new Error("You are already checked in today.")
    const entry = {
      id: `attendance-demo-${Date.now()}-${state.nextId++}`,
      employee: "Demo User",
      date: today,
      checkIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      checkOut: "",
      status: "PRESENT",
      orgId: organizationId,
    }
    state.attendance.unshift(entry)
    recordAudit(organizationId, "Checked in", "attendance")
    return copy(entry)
  },

  checkOut(organizationId) {
    const today = new Date().toISOString().slice(0, 10)
    const entry = state.attendance.find((item) =>
      item.employee === "Demo User" && item.date === today && item.orgId === organizationId,
    )
    if (!entry?.checkIn) throw new Error("Check in before checking out.")
    if (entry.checkOut) throw new Error("You are already checked out today.")
    entry.checkOut = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    recordAudit(organizationId, "Checked out", "attendance")
    return copy(entry)
  },

  markStudentAttendance(organizationId, studentId, status) {
    if (!["PRESENT", "ABSENT", "LATE"].includes(status)) {
      throw new Error("Choose a valid attendance status.")
    }
    const student = state.students.find((item) =>
      item.id === studentId && item.orgId === organizationId,
    )
    if (!student) throw new Error("The learner does not belong to the active organization.")
    const date = new Date().toISOString().slice(0, 10)
    let entry = state.attendance.find((item) =>
      item.studentId === studentId && item.orgId === organizationId && item.date === date,
    )
    if (!entry) {
      entry = {
        id: `student-attendance-${Date.now()}-${state.nextId++}`,
        studentId,
        employee: student.name,
        date,
        checkIn: "",
        checkOut: "",
        status,
        orgId: organizationId,
      }
      state.attendance.unshift(entry)
    } else {
      entry.status = status
    }
    recordAudit(organizationId, "Updated learner attendance", "attendance")
    return copy(entry)
  },

  sendMessage({ organizationId, channel, text, replyTo, attachmentUrl }) {
    if (!text?.trim()) throw new Error("A message cannot be empty.")
    const normalizedAttachment = String(attachmentUrl ?? "").trim()
    if (normalizedAttachment) {
      let parsedUrl
      try {
        parsedUrl = new URL(normalizedAttachment)
      } catch {
        throw new Error("Enter a valid attachment link.")
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Attachment links must use HTTP or HTTPS.")
      }
    }
    const message = {
      id: `message-demo-${Date.now()}`,
      channel: channel || "general",
      author: "Demo user",
      text: text.trim(),
      replyTo: replyTo || "",
      attachmentUrl: normalizedAttachment,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orgId: organizationId,
    }
    state.messages.push(message)
    recordAudit(organizationId, "Sent demo message", "channel message")
    return copy(message)
  },

  updateOrganizationStatus(organizationId, status) {
    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      throw new Error("Choose a valid organization status.")
    }
    const organization = state.organizations.find((item) => item.id === organizationId)
    if (!organization) throw new Error("The demo organization could not be found.")
    organization.status = status
    recordAudit(null, "Changed organization status", "organization")
    return copy(organization)
  },
}
