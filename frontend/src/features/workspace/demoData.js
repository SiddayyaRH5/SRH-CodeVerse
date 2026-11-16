export const PORTALS = {
  student: {
    role: "STUDENT",
    label: "Student",
    description: "Learning, practice, and progress",
    dashboardPath: "dashboard",
  },
  trainer: {
    role: "TRAINER",
    label: "Trainer",
    description: "Classes, assignments, and evaluations",
    dashboardPath: "dashboard",
  },
  employee: {
    role: "EMPLOYEE",
    // "Professional" is the user-facing portal name (employees, freelancers,
    // independent developers, small project teams). The internal role stays
    // EMPLOYEE; DEVELOPER is a separate concept and is not merged into it.
    label: "Professional",
    description: "Projects, tasks, and team collaboration",
    dashboardPath: "dashboard",
  },
  organization: {
    role: "ORG_ADMIN",
    label: "Organization admin",
    description: "People, teams, and organization operations",
    dashboardPath: "dashboard",
  },
  superadmin: {
    role: "SUPER_ADMIN",
    label: "Super admin",
    description: "Platform operations and organization approvals",
    dashboardPath: "dashboard",
  },
}

export const PORTAL_NAVIGATION = {
  student: [
    ["Overview", "dashboard"],
    ["My courses", "courses"],
    ["Learning resources", "resources"],
    ["Coding practice", "practice"],
    ["Submission history", "submissions"],
    ["Learning paths", "learning-paths"],
    ["Assignments", "assignments"],
    ["Learning progress", "progress"],
    ["Certificates", "certificates"],
    ["Verify a certificate", "certificate-verification"],
    ["Announcements", "announcements"],
    ["Notifications", "notifications"],
    ["Messages", "messages"],
    ["Calendar", "calendar"],
    ["Help & support", "support"],
    ["My profile", "profile"],
    ["Settings", "settings"],
  ],
  trainer: [
    ["Overview", "dashboard"],
    ["My profile", "profile"],
    ["Student directory", "students"],
    ["Batches", "batches"],
    ["Courses", "courses"],
    ["Curriculum", "curriculum"],
    ["Learning materials", "materials"],
    ["Assignments", "assignments"],
    ["Submissions", "submissions"],
    ["Grading & feedback", "evaluation"],
    ["Attendance", "attendance"],
    ["Class schedule", "schedule"],
    ["Calendar", "calendar"],
    ["Learning paths", "learning-paths"],
    ["Announcements", "announcements"],
    ["Performance reports", "reports"],
    ["Messages", "messages"],
    ["Notifications", "notifications"],
    ["Settings", "settings"],
  ],
  employee: [
    ["Overview", "dashboard"],
    ["My profile", "profile"],
    ["Employee directory", "directory"],
    ["My projects", "projects"],
    ["My tasks", "tasks"],
    ["Task list", "task-list"],
    ["Teams", "teams"],
    ["Work logs", "worklogs"],
    ["Timesheets & reports", "timesheets"],
    ["Attendance", "attendance"],
    ["Attendance history", "attendance-history"],
    ["Leave requests", "leave"],
    ["Leave balance", "leave-balance"],
    ["Company calendar", "calendar"],
    ["Meetings", "meetings"],
    ["Announcements", "announcements"],
    ["Notifications", "notifications"],
    ["Documents", "documents"],
    ["Policies", "policies"],
    ["Messages", "messages"],
    ["Channels", "channels"],
    ["Developer workspace", "developer"],
    ["GitHub integration", "github"],
    ["Goals & feedback", "goals"],
    ["Training", "training"],
    ["Help & support", "help"],
    ["Settings", "settings"],
  ],
  organization: [
    ["Overview", "dashboard"],
    ["Organization profile", "settings"],
    ["Employees", "employees"],
    ["Invitations", "invitations"],
    ["Departments", "departments"],
    ["Teams", "teams"],
    ["Roles & permissions", "roles"],
    ["Projects", "projects"],
    ["Tasks", "tasks"],
    ["Work logs & timesheets", "timesheets"],
    ["Attendance", "attendance"],
    ["Leave management", "leave"],
    ["Holidays & calendar", "holidays"],
    ["Training management", "training"],
    ["Courses & batches", "courses"],
    ["Assignments", "assignments"],
    ["Reports & analytics", "reports"],
    ["Organization analytics", "analytics"],
    ["Announcements", "announcements"],
    ["Notifications", "notifications"],
    ["Documents", "documents"],
    ["Policies", "policies"],
    ["Channels & messaging", "channels"],
    ["Activity & audit log", "audit"],
    ["Access controls", "access"],
    ["Register an organization", "registration"],
    ["Application status", "application-status"],
  ],
  superadmin: [
    ["Platform overview", "dashboard"],
    ["Organization applications", "applications"],
    ["Platform announcements", "announcements"],
    ["Support requests", "support"],
    ["Active organizations", "organizations"],
    ["Suspended organizations", "suspended"],
    ["Platform users", "users"],
    ["Platform roles", "roles"],
    ["Audit log", "audit"],
    ["Security activity", "security"],
    ["System analytics", "analytics"],
    ["Platform configuration", "configuration"],
  ],
}

export const DEMO_ORGANIZATIONS = [
  {
    id: "org-northstar",
    name: "Northstar Labs",
    type: "Company",
    status: "ACTIVE",
    domain: "northstar.example",
    employees: 86,
    students: 24,
    plan: "Demo workspace",
  },
  {
    id: "org-bluepeak",
    name: "BluePeak Academy",
    type: "Education",
    status: "ACTIVE",
    domain: "bluepeak.example",
    employees: 34,
    students: 318,
    plan: "Demo workspace",
  },
  {
    id: "org-cedar",
    name: "Cedar & Co.",
    type: "Company",
    status: "PENDING",
    domain: "cedar.example",
    employees: 0,
    students: 0,
    plan: "Application review",
  },
  {
    id: "org-orbit",
    name: "Orbit Systems",
    type: "Company",
    status: "SUSPENDED",
    domain: "orbit.example",
    employees: 52,
    students: 0,
    plan: "Demo workspace",
  },
]

export const DEMO_EMPLOYEES = [
  { id: "emp-1", name: "Avery Morgan", email: "avery@northstar.example", department: "Engineering", team: "Platform", role: "EMPLOYEE", status: "ACTIVE", orgId: "org-northstar" },
  { id: "emp-2", name: "Jordan Lee", email: "jordan@northstar.example", department: "Product", team: "Growth", role: "TEAM_LEAD", status: "ACTIVE", orgId: "org-northstar" },
  { id: "emp-3", name: "Taylor Kim", email: "taylor@northstar.example", department: "Engineering", team: "Platform", role: "EMPLOYEE", status: "ACTIVE", orgId: "org-northstar" },
  { id: "emp-4", name: "Morgan Patel", email: "morgan@bluepeak.example", department: "Instruction", team: "Java cohort", role: "TRAINER", status: "ACTIVE", orgId: "org-bluepeak" },
  { id: "emp-5", name: "Sam Rivera", email: "sam@bluepeak.example", department: "Instruction", team: "Web cohort", role: "TRAINER", status: "ACTIVE", orgId: "org-bluepeak" },
  { id: "emp-6", name: "Casey Chen", email: "casey@bluepeak.example", department: "Operations", team: "Student success", role: "EMPLOYEE", status: "INVITED", orgId: "org-bluepeak" },
]

export const DEMO_TEAMS = [
  { id: "team-platform", name: "Platform", department: "Engineering", lead: "Jordan Lee", members: 8, orgId: "org-northstar" },
  { id: "team-growth", name: "Growth", department: "Product", lead: "Avery Morgan", members: 6, orgId: "org-northstar" },
  { id: "team-java", name: "Java cohort", department: "Instruction", lead: "Morgan Patel", members: 12, orgId: "org-bluepeak" },
  { id: "team-web", name: "Web cohort", department: "Instruction", lead: "Sam Rivera", members: 10, orgId: "org-bluepeak" },
]

export const DEMO_DEPARTMENTS = [
  { id: "dept-eng", name: "Engineering", owner: "Avery Morgan", members: 22, orgId: "org-northstar" },
  { id: "dept-product", name: "Product", owner: "Jordan Lee", members: 14, orgId: "org-northstar" },
  { id: "dept-instruction", name: "Instruction", owner: "Morgan Patel", members: 19, orgId: "org-bluepeak" },
  { id: "dept-ops", name: "Operations", owner: "Casey Chen", members: 8, orgId: "org-bluepeak" },
]

export const DEMO_PROJECTS = [
  { id: "project-1", name: "Learning platform refresh", owner: "Avery Morgan", members: "Avery Morgan, Taylor Kim, Demo User", startDate: "2026-10-01", milestones: "Discovery complete; accessibility review; rollout", status: "IN_PROGRESS", progress: 68, dueDate: "2026-12-12", orgId: "org-northstar" },
  { id: "project-2", name: "Mobile onboarding", owner: "Jordan Lee", members: "Jordan Lee", startDate: "2026-11-01", milestones: "Prototype; usability review; launch", status: "PLANNING", progress: 24, dueDate: "2027-01-08", orgId: "org-northstar" },
  { id: "project-3", name: "Winter Java cohort", owner: "Morgan Patel", members: "Morgan Patel, Quinn Ellis, Demo User", startDate: "2026-10-15", milestones: "Orientation; collections; final project", status: "IN_PROGRESS", progress: 54, dueDate: "2026-12-20", orgId: "org-bluepeak" },
  { id: "project-4", name: "Course content migration", owner: "Sam Rivera", members: "Sam Rivera, Reese Taylor", startDate: "2026-09-10", milestones: "Inventory; migrate; quality review", status: "REVIEW", progress: 91, dueDate: "2026-11-30", orgId: "org-bluepeak" },
]

export const DEMO_TASKS = [
  { id: "task-demo-assigned", title: "Update my weekly progress", projectId: "project-1", assignee: "Demo User", priority: "LOW", status: "TODO", dueDate: "2026-11-26", description: "Add a short update for the team.", comments: [], orgId: "org-northstar" },
  { id: "task-1", title: "Review onboarding flow", projectId: "project-1", assignee: "Avery Morgan", priority: "HIGH", status: "TODO", dueDate: "2026-11-22", description: "Collect feedback from the latest onboarding walkthrough.", attachmentUrl: "https://example.test/onboarding-notes", comments: [{ author: "Jordan Lee", text: "Please include the mobile screenshots." }], orgId: "org-northstar" },
  { id: "task-2", title: "Add course progress summary", projectId: "project-1", assignee: "Taylor Kim", priority: "MEDIUM", status: "IN_PROGRESS", dueDate: "2026-11-25", description: "Show the learner's completed lessons and next recommended step.", comments: [], orgId: "org-northstar" },
  { id: "task-3", title: "Validate accessibility states", projectId: "project-2", assignee: "Jordan Lee", priority: "LOW", status: "REVIEW", dueDate: "2026-11-21", description: "Review keyboard access, labels, and focus states.", comments: [], orgId: "org-northstar" },
  { id: "task-4", title: "Publish Java cohort rubric", projectId: "project-3", assignee: "Morgan Patel", priority: "HIGH", status: "TODO", dueDate: "2026-11-28", description: "Prepare the grading rubric for the upcoming assignment.", comments: [], orgId: "org-bluepeak" },
  { id: "task-5", title: "Review lesson examples", projectId: "project-4", assignee: "Sam Rivera", priority: "MEDIUM", status: "COMPLETED", dueDate: "2026-11-16", description: "Check examples against the current course objectives.", comments: [], orgId: "org-bluepeak" },
]

export const DEMO_APPLICATIONS = [
  { id: "app-1", organizationName: "Cedar & Co.", type: "Company", contactName: "Riley Brooks", contactEmail: "riley@cedar.example", requestedAt: "2026-11-14", status: "PENDING", reason: "" },
  { id: "app-2", organizationName: "Pioneer Learning", type: "Education", contactName: "Alex Dawson", contactEmail: "alex@pioneer.example", requestedAt: "2026-11-12", status: "PENDING", reason: "" },
  { id: "app-3", organizationName: "Summit Works", type: "Company", contactName: "Jamie Park", contactEmail: "jamie@summit.example", requestedAt: "2026-11-09", status: "PENDING", reason: "" },
]

export const DEMO_COURSES = [
  { id: "course-1", name: "Java Foundations", category: "Backend", level: "Beginner", lessons: 18, progress: 72, orgId: "org-bluepeak" },
  { id: "course-2", name: "Modern React", category: "Frontend", level: "Intermediate", lessons: 22, progress: 38, orgId: "org-bluepeak" },
  { id: "course-3", name: "Data Structures & Algorithms", category: "Computer science", level: "Intermediate", lessons: 30, progress: 16, orgId: "org-bluepeak" },
  { id: "course-4", name: "Secure API Design", category: "Backend", level: "Advanced", lessons: 12, progress: 0, orgId: "org-northstar" },
]

export const DEMO_ANNOUNCEMENTS = [
  { id: "announcement-1", title: "Sprint planning moved to Monday", audience: "Platform team", author: "Jordan Lee", date: "2026-11-14", orgId: "org-northstar" },
  { id: "announcement-2", title: "Winter cohort orientation", audience: "All learners", author: "Morgan Patel", date: "2026-11-13", orgId: "org-bluepeak" },
]

export const DEMO_DOCUMENTS = [
  { id: "doc-1", name: "Engineering handbook", category: "Handbook", owner: "People Ops", updatedAt: "2026-11-10", orgId: "org-northstar" },
  { id: "doc-2", name: "Project kickoff template", category: "Template", owner: "Product", project: "Learning platform refresh", updatedAt: "2026-11-08", orgId: "org-northstar" },
  { id: "doc-3", name: "Java cohort syllabus", category: "Learning", owner: "Instruction", project: "Winter Java cohort", updatedAt: "2026-11-11", orgId: "org-bluepeak" },
]

export const DEMO_MESSAGES = [
  { id: "message-1", channel: "general", author: "Jordan Lee", text: "Welcome to the workspace demo.", time: "09:18", orgId: "org-northstar" },
  { id: "message-2", channel: "general", author: "Avery Morgan", text: "The platform refresh board is ready for review.", time: "09:42", orgId: "org-northstar" },
  { id: "message-3", channel: "java-cohort", author: "Morgan Patel", text: "This week's practice set is available.", time: "10:05", orgId: "org-bluepeak" },
  { id: "message-4", channel: "direct-avery", author: "Avery Morgan", text: "I added the project notes to the demo workspace.", time: "10:12", orgId: "org-northstar" },
]

export const DEMO_ASSIGNMENTS = [
  { id: "assignment-1", title: "Collections practice", course: "Java Foundations", instructions: "Implement collection-based operations and explain the time complexity of each method.", dueDate: "2026-11-24", submissions: 18, status: "OPEN", orgId: "org-bluepeak" },
  { id: "assignment-2", title: "Build a responsive catalog", course: "Modern React", instructions: "Create a responsive catalog layout and document its keyboard interactions.", dueDate: "2026-11-28", submissions: 12, status: "OPEN", orgId: "org-bluepeak" },
  { id: "assignment-3", title: "Algorithm analysis", course: "Data Structures & Algorithms", instructions: "Submit a solution and a short complexity analysis.", dueDate: "2026-11-20", submissions: 23, status: "REVIEW", orgId: "org-bluepeak" },
]

export const DEMO_STUDENTS = [
  { id: "student-1", name: "Quinn Ellis", cohort: "Java cohort", progress: "78%", lastActive: "Today", status: "ACTIVE", orgId: "org-bluepeak" },
  { id: "student-2", name: "Dakota Lane", cohort: "Java cohort", progress: "64%", lastActive: "Today", status: "ACTIVE", orgId: "org-bluepeak" },
  { id: "student-3", name: "Reese Taylor", cohort: "Web cohort", progress: "52%", lastActive: "Yesterday", status: "ACTIVE", orgId: "org-bluepeak" },
  { id: "student-4", name: "Skyler Reed", cohort: "Web cohort", progress: "31%", lastActive: "Nov 12", status: "NEEDS SUPPORT", orgId: "org-bluepeak" },
]

export const DEMO_CALENDAR_EVENTS = [
  { id: "event-1", title: "Platform sprint review", date: "2026-11-18", time: "10:00", type: "Team meeting", orgId: "org-northstar" },
  { id: "event-2", title: "1:1 with team lead", date: "2026-11-19", time: "14:30", type: "Meeting", orgId: "org-northstar" },
  { id: "event-3", title: "Java cohort office hours", date: "2026-11-20", time: "13:00", type: "Learning", orgId: "org-bluepeak" },
]

export const DEMO_CHALLENGES = [
  { id: "challenge-1", title: "Array rotation", difficulty: "Easy", track: "Arrays", progress: "Completed" },
  { id: "challenge-2", title: "Balanced brackets", difficulty: "Medium", track: "Stacks", progress: "In progress" },
  { id: "challenge-3", title: "Shortest path", difficulty: "Hard", track: "Graphs", progress: "Not started" },
]

export const DEMO_CERTIFICATES = [
  { id: "certificate-1", name: "Java Foundations", issued: "2026-08-20", credential: "CV-DEMO-001" },
  { id: "certificate-2", name: "Web Development Basics", issued: "2026-10-04", credential: "CV-DEMO-002" },
]

export const DEMO_PROFILE = {
  displayName: "Demo User",
  email: "demo@example.test",
  title: "Workspace member",
  department: "Product and learning",
  location: "Remote",
  bio: "Exploring the SRH CodeVerse demo workspace.",
}

export const DEMO_CHANNELS = ["general", "platform", "java-cohort", "direct-avery"]

export const DEMO_ROLE_PERMISSIONS = [
  "View employee directory",
  "Manage teams",
  "Create projects",
  "Review reports",
  "Manage access",
]

export const DEMO_DASHBOARD_METRICS = {
  independentCourses: 3,
  studentProgress: "64%",
  trainerAttendance: "92%",
  organizationAttendance: "94%",
  employeeWeeklyHours: 28,
  studentCertificates: 2,
}

export const DEMO_AUDIT_EVENTS = [
  { id: "audit-1", actor: "Platform Admin", action: "Reviewed organization application", target: "Cedar & Co.", date: "2026-11-14 14:32", result: "PENDING" },
  { id: "audit-2", actor: "Jordan Lee", action: "Updated project status", target: "Learning platform refresh", date: "2026-11-14 11:10", result: "SUCCESS", orgId: "org-northstar" },
  { id: "audit-3", actor: "Platform Admin", action: "Suspended organization", target: "Orbit Systems", date: "2026-11-10 16:45", result: "SUCCESS" },
]

export const DEMO_SUBMISSIONS = [
  { id: "submission-1", assignmentId: "assignment-1", assignment: "Collections practice", student: "Quinn Ellis", content: "Implemented the requested collection operations and documented complexity.", link: "https://example.test/submissions/quinn-collections", submittedAt: "2026-11-18", status: "SUBMITTED", grade: "", feedback: "", orgId: "org-bluepeak" },
  { id: "submission-2", assignmentId: "assignment-2", assignment: "Build a responsive catalog", student: "Reese Taylor", content: "Completed the responsive catalog and keyboard review.", link: "https://example.test/submissions/reese-catalog", submittedAt: "2026-11-17", status: "REVIEW", grade: "", feedback: "", orgId: "org-bluepeak" },
]

export const DEMO_NOTIFICATIONS = [
  { id: "notification-1", title: "Workspace demo is ready", description: "Explore your role-specific tools and sample records.", date: "2026-11-14", status: "UNREAD", orgId: "org-northstar" },
  { id: "notification-2", title: "New learning activity", description: "A new item is available in your workspace.", date: "2026-11-13", status: "READ", orgId: "org-bluepeak" },
]

export const DEMO_POLICIES = [
  { id: "policy-1", title: "Acceptable use policy", category: "Security", owner: "People Operations", updatedAt: "2026-11-10", orgId: "org-northstar" },
  { id: "policy-2", title: "Flexible work guidelines", category: "People", owner: "People Operations", updatedAt: "2026-11-05", orgId: "org-northstar" },
]

export const DEMO_GOALS = [
  { id: "goal-1", title: "Complete platform onboarding", owner: "Demo User", period: "Q4 2026", progress: 60, status: "IN_PROGRESS", orgId: "org-northstar" },
  { id: "goal-2", title: "Share a weekly project update", owner: "Demo User", period: "Q4 2026", progress: 100, status: "COMPLETED", orgId: "org-northstar" },
]

export const DEMO_SUPPORT_REQUESTS = [
  { id: "support-1", subject: "Workspace access question", category: "Access", status: "OPEN", createdAt: "2026-11-14", description: "Demo support request. No real support system is connected.", orgId: "org-northstar" },
]

export const DEMO_MEETINGS = [
  { id: "meeting-1", title: "Weekly team sync", date: "2026-11-19", time: "14:00", type: "Team", attendees: "Avery Morgan, Jordan Lee, Taylor Kim", agenda: "Project updates; blockers; next actions.", status: "SCHEDULED", orgId: "org-northstar" },
  { id: "meeting-2", title: "Project review", date: "2026-11-20", time: "10:30", type: "Project", attendees: "Jordan Lee, Demo User", agenda: "Review milestones and confirm handoff.", status: "SCHEDULED", orgId: "org-northstar" },
]

export const DEMO_REPOSITORIES = [
  { id: "repo-1", name: "learning-platform", provider: "GitHub demo", branch: "main", visibility: "Private", status: "PREVIEW ONLY", orgId: "org-northstar" },
  { id: "repo-2", name: "course-content", provider: "GitHub demo", branch: "main", visibility: "Private", status: "PREVIEW ONLY", orgId: "org-bluepeak" },
]

export const DEMO_REPOSITORY_ACTIVITY = [
  {
    repositoryId: "repo-1",
    orgId: "org-northstar",
    branches: ["main", "feature/progress-summary"],
    commits: [
      { id: "commit-1", hash: "a1b2c3d", message: "Add course progress summary", author: "Avery Morgan", date: "2026-11-14" },
      { id: "commit-2", hash: "d4e5f6a", message: "Improve keyboard focus states", author: "Taylor Kim", date: "2026-11-13" },
    ],
    issues: [{ id: "issue-1", number: 12, title: "Review mobile onboarding flow", status: "OPEN", assignee: "Jordan Lee" }],
    pullRequests: [{ id: "pr-1", number: 8, title: "Add learner progress overview", status: "OPEN", author: "Avery Morgan", branch: "feature/progress-summary" }],
  },
  {
    repositoryId: "repo-2",
    orgId: "org-bluepeak",
    branches: ["main", "feature/java-rubric"],
    commits: [
      { id: "commit-3", hash: "7b8c9d0", message: "Add Java collection examples", author: "Morgan Patel", date: "2026-11-12" },
    ],
    issues: [{ id: "issue-2", number: 5, title: "Refresh course reference links", status: "OPEN", assignee: "Quinn Ellis" }],
    pullRequests: [{ id: "pr-2", number: 3, title: "Publish Java cohort rubric", status: "REVIEW", author: "Morgan Patel", branch: "feature/java-rubric" }],
  },
]

export const DEMO_HOLIDAYS = [
  { id: "holiday-1", title: "Winter break", date: "2026-12-24", region: "Organization-wide", status: "PLANNED", orgId: "org-northstar" },
  { id: "holiday-2", title: "New year holiday", date: "2027-01-01", region: "Organization-wide", status: "PLANNED", orgId: "org-northstar" },
]

export const DEMO_TRAINING = [
  { id: "training-1", title: "Secure development basics", category: "Security", audience: "All employees", status: "AVAILABLE", dueDate: "2026-12-15", orgId: "org-northstar" },
  { id: "training-2", title: "Java cohort fundamentals", category: "Learning", audience: "Java cohort", status: "IN_PROGRESS", dueDate: "2026-12-20", orgId: "org-bluepeak" },
]

export const DEMO_COURSE_RESOURCES = [
  { id: "resource-1", title: "Java collections reference", course: "Java Foundations", type: "Article", url: "https://example.test/java-collections", updatedAt: "2026-11-12", orgId: "org-bluepeak" },
  { id: "resource-2", title: "React component workshop", course: "Modern React", type: "Video", url: "https://example.test/react-workshop", updatedAt: "2026-11-10", orgId: "org-bluepeak" },
]

export const DEMO_CURRICULUM = [
  { id: "lesson-1", title: "Collections overview", course: "Java Foundations", order: 1, status: "PUBLISHED", orgId: "org-bluepeak" },
  { id: "lesson-2", title: "Functional components", course: "Modern React", order: 1, status: "PUBLISHED", orgId: "org-bluepeak" },
]

export const DEMO_LEARNING_PATHS = [
  { id: "path-1", title: "Java Backend Developer", level: "Beginner", progress: 42, milestones: "Java basics, Spring Boot, REST APIs", status: "PUBLISHED", orgId: "org-bluepeak" },
  { id: "path-2", title: "Frontend Foundations", level: "Intermediate", progress: 25, milestones: "HTML, React, accessibility", status: "PUBLISHED", orgId: "org-bluepeak" },
]

export const DEMO_ATTENDANCE = [
  { id: "attendance-1", employee: "Avery Morgan", date: "2026-11-14", checkIn: "09:02", checkOut: "17:14", status: "PRESENT", orgId: "org-northstar" },
  { id: "attendance-2", employee: "Jordan Lee", date: "2026-11-14", checkIn: "09:18", checkOut: "", status: "PRESENT", orgId: "org-northstar" },
  { id: "attendance-3", employee: "Morgan Patel", date: "2026-11-14", checkIn: "08:56", checkOut: "16:45", status: "PRESENT", orgId: "org-bluepeak" },
]

export const DEMO_LEAVE_BALANCES = [
  { id: "balance-1", employee: "Demo User", category: "Annual leave", available: 12, used: 4, orgId: "org-northstar" },
  { id: "balance-2", employee: "Demo User", category: "Personal leave", available: 5, used: 1, orgId: "org-northstar" },
  { id: "balance-3", employee: "Demo User", category: "Annual leave", available: 12, used: 2, orgId: "org-bluepeak" },
]

export const DEMO_SECURITY_EVENTS = [
  { id: "security-1", date: "2026-11-14 08:42", actor: "Platform Admin", action: "Reviewed organization application", result: "SUCCESS" },
  { id: "security-2", date: "2026-11-13 15:20", actor: "System", action: "Demo account status updated", result: "SUCCESS" },
]

export const DEMO_PLATFORM_ANNOUNCEMENTS = [
  { id: "platform-announcement-1", title: "Platform maintenance window", audience: "All organizations", author: "Platform Admin", date: "2026-11-14" },
]

export const DEMO_MEMBERSHIPS = {
  student: ["org-bluepeak", "org-northstar"],
  trainer: ["org-bluepeak"],
  employee: ["org-northstar", "org-bluepeak"],
  organization: ["org-northstar"],
  superadmin: DEMO_ORGANIZATIONS.map((organization) => organization.id),
}
