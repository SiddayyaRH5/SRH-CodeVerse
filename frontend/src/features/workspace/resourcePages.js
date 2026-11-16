const select = (options) => options.map((value) => ({ value, label: value }))

const field = (name, label, options = {}) => ({ name, label, ...options })

const page = (title, description, resource, columns, fields = [], options = {}) => ({
  title,
  description,
  resource,
  columns,
  fields,
  allowCreate: false,
  allowUpdate: false,
  allowDelete: false,
  ...options,
})

const statusColumn = { key: "status", label: "Status", kind: "status" }
const dateField = (name, label, required = false) => field(name, label, { type: "date", required })
const textField = (name, label, required = false, wide = false) => field(name, label, { required, wide })

export const RESOURCE_PAGES = {
  student: {
    courses: page("My courses", "Explore your organization courses and open course details.", "courses", [
      { key: "name", label: "Course" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }, { key: "lessons", label: "Lessons" }, { key: "progress", label: "Progress" },
    ], [], { relatedLinks: [
      { label: "Learning resources", screen: "resources" },
      { label: "Assignments", screen: "assignments" },
    ] }),
    resources: page("Learning resources", "Browse course resources and reference materials.", "courseResources", [
      { key: "title", label: "Resource" }, { key: "course", label: "Course" }, { key: "type", label: "Type" }, { key: "updatedAt", label: "Updated" },
    ]),
    submissions: page("Submission history", "Review your demo assignment submissions.", "submissions", [
      { key: "assignment", label: "Assignment" }, { key: "submittedAt", label: "Submitted" }, statusColumn, { key: "grade", label: "Grade" },
    ]),
    "learning-paths": page("Learning paths", "Follow a guided path and open its learning milestones.", "learningPaths", [
      { key: "title", label: "Path" }, { key: "level", label: "Level" }, { key: "progress", label: "Progress" }, { key: "milestones", label: "Milestones" }, statusColumn,
    ]),
    assignments: page("Assignments", "Open an assignment to review instructions and submit demo work.", "assignments", [
      { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "dueDate", label: "Due date" }, statusColumn,
    ], [], {
      detailAction: {
        label: "Submit demo work",
        resource: "submissions",
        fields: [
          textField("content", "Submission notes", true, true),
          field("link", "Work URL (optional)", { type: "url" }),
        ],
        values: (record) => ({ assignmentId: record.id, assignment: record.title }),
      },
    }),
    certificates: page("Certificates", "Review demo credentials and open certificate details.", "certificates", [
      { key: "name", label: "Certificate" }, { key: "issued", label: "Issued" }, { key: "credential", label: "Credential" },
    ], [], { relatedLinks: [{ label: "Verify a certificate", screen: "certificate-verification" }] }),
    "certificate-verification": page("Certificate verification", "Look up a demo credential and verify its issued status.", "certificates", [
      { key: "credential", label: "Credential ID" }, { key: "name", label: "Certificate" }, { key: "issued", label: "Issued" },
    ]),
    announcements: page("Announcements", "Updates for your selected learning organization.", "announcements", [
      { key: "title", label: "Announcement" }, { key: "audience", label: "Audience" }, { key: "author", label: "Author" }, { key: "date", label: "Date" },
    ]),
    notifications: page("Notifications", "Review demo notifications for your active organization.", "notifications", [
      { key: "title", label: "Notification" }, { key: "description", label: "Details" }, { key: "date", label: "Date" }, statusColumn,
    ], [field("status", "Status", { options: select(["READ", "UNREAD"]) })], { allowUpdate: true }),
    calendar: page("Learning calendar", "See upcoming course and organization events.", "calendarEvents", [
      { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "title", label: "Event" }, { key: "type", label: "Type" },
    ]),
    support: page("Help and support", "Create a demo support request. No real support system is connected.", "supportRequests", [
      { key: "subject", label: "Subject" }, { key: "category", label: "Category" }, { key: "createdAt", label: "Created" }, statusColumn,
    ], [
      textField("subject", "Subject", true),
      field("category", "Category", { options: select(["Learning", "Access", "Technical", "Other"]) }),
      textField("description", "Describe the issue", true, true),
    ], { allowCreate: true }),
  },
  trainer: {
    students: page("Student directory", "Find learners and open individual progress details.", "students", [
      { key: "name", label: "Learner" }, { key: "cohort", label: "Cohort" }, { key: "progress", label: "Progress" }, { key: "lastActive", label: "Last active" }, statusColumn,
    ], [], { relatedLinks: [
      { label: "Attendance", screen: "attendance" },
      { label: "Submission review", screen: "submissions" },
    ] }),
    batches: page("Batches and classes", "Manage demo cohorts and their trainer assignments.", "teams", [
      { key: "name", label: "Batch" }, { key: "department", label: "Program" }, { key: "lead", label: "Trainer" }, { key: "members", label: "Learners" },
    ], [textField("name", "Batch name", true), textField("department", "Program"), textField("lead", "Trainer")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    courses: page("Course management", "Create, update, and review courses in this demo organization.", "courses", [
      { key: "name", label: "Course" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }, { key: "lessons", label: "Lessons" }, statusColumn,
    ], [
      textField("name", "Course name", true),
      textField("category", "Category", true),
      field("level", "Level", { options: select(["Beginner", "Intermediate", "Advanced"]) }),
      field("lessons", "Lesson count", { type: "number", min: "1", required: true }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true, relatedLinks: [
      { label: "Curriculum", screen: "curriculum" },
      { label: "Learning materials", screen: "materials" },
      { label: "Assignments", screen: "assignments" },
    ] }),
    curriculum: page("Course curriculum", "Organize course lesson outlines in the demo workspace.", "curriculum", [
      { key: "title", label: "Lesson" }, { key: "course", label: "Course" }, { key: "order", label: "Order" }, statusColumn,
    ], [
      textField("title", "Lesson title", true),
      textField("course", "Course", true),
      field("order", "Lesson order", { type: "number", min: "1", required: true }),
      field("status", "Status", { options: select(["DRAFT", "PUBLISHED"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    materials: page("Learning materials", "Manage demo links and materials attached to courses.", "courseResources", [
      { key: "title", label: "Material" }, { key: "course", label: "Course" }, { key: "type", label: "Type" }, { key: "updatedAt", label: "Updated" },
    ], [
      textField("title", "Title", true),
      textField("course", "Course", true),
      field("type", "Type", { options: select(["Video", "Article", "Document", "Link"]) }),
      field("url", "Resource URL", { type: "url" }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    assignments: page("Assignments", "Create and manage assignment instructions and due dates.", "assignments", [
      { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "dueDate", label: "Due" }, { key: "submissions", label: "Submissions" }, statusColumn,
    ], [
      textField("title", "Assignment title", true),
      textField("course", "Course", true),
      dateField("dueDate", "Due date", true),
      textField("instructions", "Instructions", false, true),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    submissions: page("Student submissions", "Open a submission to review work and leave feedback.", "submissions", [
      { key: "assignment", label: "Assignment" }, { key: "student", label: "Student" }, { key: "submittedAt", label: "Submitted" }, statusColumn, { key: "grade", label: "Grade" },
    ], [], { relatedLinks: [{ label: "Grade this submission", screen: "evaluation", detail: true }] }),
    evaluation: page("Grading and feedback", "Evaluate a submission and save demo feedback.", "submissions", [
      { key: "assignment", label: "Assignment" }, { key: "student", label: "Student" }, { key: "submittedAt", label: "Submitted" }, statusColumn,
    ], [
      field("grade", "Grade", { type: "number", min: "0", max: "100" }),
      textField("feedback", "Feedback", false, true),
      field("status", "Review status", { options: select(["SUBMITTED", "REVIEW", "GRADED"]) }),
    ], { allowUpdate: true }),
    "learning-paths": page("Learning path management", "Manage the demo learning path milestones.", "learningPaths", [
      { key: "title", label: "Path" }, { key: "level", label: "Level" }, { key: "progress", label: "Progress" }, statusColumn,
    ], [
      textField("title", "Path title", true),
      field("level", "Level", { options: select(["Beginner", "Intermediate", "Advanced"]) }),
      textField("milestones", "Milestones", false, true),
      field("status", "Status", { options: select(["DRAFT", "PUBLISHED"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    notifications: page("Notifications", "Review demo notifications for your active organization.", "notifications", [
      { key: "title", label: "Notification" }, { key: "description", label: "Details" }, { key: "date", label: "Date" }, statusColumn,
    ], [field("status", "Status", { options: select(["READ", "UNREAD"]) })], { allowUpdate: true }),
    announcements: page("Announcements", "Publish and manage demo announcements for learners.", "announcements", [
      { key: "title", label: "Announcement" }, { key: "audience", label: "Audience" }, { key: "author", label: "Author" }, { key: "date", label: "Date" },
    ], [textField("title", "Announcement", true), textField("audience", "Audience")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    schedule: page("Class schedule", "Review and manage demo classes and office hours.", "calendarEvents", [
      { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "title", label: "Class" }, { key: "type", label: "Type" },
    ], [
      dateField("date", "Date", true),
      field("time", "Time", { type: "time", required: true }),
      textField("title", "Class or office hour", true),
      field("type", "Type", { options: select(["Class", "Office hours", "Review"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    calendar: page("Trainer calendar", "Manage demo calendar events for classes and office hours.", "calendarEvents", [
      { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "title", label: "Event" }, { key: "type", label: "Type" },
    ], [
      dateField("date", "Date", true),
      field("time", "Time", { type: "time" }),
      textField("title", "Event title", true),
      field("type", "Type", { options: select(["Class", "Office hours", "Review"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
  },
  employee: {
    directory: page("Employee directory", "Browse organization coworkers and open demo profiles.", "employees", [
      { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "department", label: "Department" }, { key: "team", label: "Team" }, { key: "role", label: "Role" }, statusColumn,
    ]),
    projects: page("My projects", "Manage demo projects scoped to the active organization.", "projects", [
      { key: "name", label: "Project" }, { key: "owner", label: "Owner" }, statusColumn, { key: "progress", label: "Progress" }, { key: "dueDate", label: "Due date" },
    ], [
      textField("name", "Project name", true),
      textField("owner", "Project owner"),
      dateField("startDate", "Start date"),
      field("status", "Status", { options: select(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED"]) }),
      field("progress", "Progress (%)", { type: "number", min: "0", max: "100" }),
      dateField("dueDate", "Due date"),
      textField("members", "Project members"),
      textField("milestones", "Timeline and milestones", false, true),
      textField("description", "Description", false, true),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true, relatedLinks: [
      { label: "Related tasks", screen: "task-list" },
      { label: "Project documents", screen: "documents" },
    ] }),
    "task-list": page("Task list", "Search tasks and open details, updates, and comments.", "tasks", [
      { key: "title", label: "Task" }, { key: "assignee", label: "Assignee" }, { key: "priority", label: "Priority" }, { key: "dueDate", label: "Due date" }, statusColumn,
    ], [
      textField("title", "Task title", true),
      textField("assignee", "Assignee"),
      field("priority", "Priority", { options: select(["LOW", "MEDIUM", "HIGH"]) }),
      field("status", "Status", { options: select(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]) }),
      dateField("dueDate", "Due date"),
      textField("description", "Description", false, true),
      field("attachmentUrl", "Demo attachment link", { type: "url", wide: true }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    teams: page("Teams", "Browse your organization teams and open team details.", "teams", [
      { key: "name", label: "Team" }, { key: "department", label: "Department" }, { key: "lead", label: "Lead" }, { key: "members", label: "Members" },
    ]),
    timesheets: page("Timesheets and reports", "Review and update your own demo work logs.", "workLogs", [
      { key: "date", label: "Date" }, { key: "project", label: "Project" }, { key: "hours", label: "Hours" }, { key: "note", label: "Summary" }, statusColumn,
    ], [
      textField("project", "Project"),
      field("hours", "Hours", { type: "number", min: "0.25", max: "24", required: true }),
      textField("note", "Work summary", false, true),
      field("status", "Timesheet status", { options: select(["DRAFT", "SUBMITTED"]) }),
    ], { allowCreate: true, allowUpdate: true }),
    "attendance-history": page("Attendance history", "Review attendance entries in the active organization.", "attendance", [
      { key: "date", label: "Date" }, { key: "employee", label: "Employee" }, { key: "checkIn", label: "Check in" }, { key: "checkOut", label: "Check out" }, statusColumn,
    ]),
    leave: page("Leave requests", "Submit and track demo leave requests.", "leaveRequests", [
      { key: "startDate", label: "From" }, { key: "endDate", label: "To" }, { key: "reason", label: "Reason" }, statusColumn,
    ], [
      dateField("startDate", "Start date", true),
      dateField("endDate", "End date", true),
      textField("reason", "Reason", true, true),
    ], { allowCreate: true }),
    "leave-balance": page("Leave balance", "Review illustrative demo leave balances.", "leaveBalances", [
      { key: "employee", label: "Employee" }, { key: "category", label: "Category" }, { key: "available", label: "Available days" }, { key: "used", label: "Used days" },
    ]),
    calendar: page("Company calendar", "Browse organization events and create demo calendar entries.", "calendarEvents", [
      { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "title", label: "Event" }, { key: "type", label: "Type" },
    ], [
      dateField("date", "Date", true),
      field("time", "Time", { type: "time" }),
      textField("title", "Event title", true),
      field("type", "Type", { options: select(["Company", "Team", "Learning", "Meeting"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    meetings: page("Meetings", "Plan demo meetings. No video or voice service is connected.", "meetings", [
      { key: "title", label: "Meeting" }, { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "type", label: "Type" }, statusColumn,
    ], [
      textField("title", "Meeting title", true),
      dateField("date", "Date", true),
      field("time", "Time", { type: "time", required: true }),
      field("type", "Type", { options: select(["Team", "Project", "1:1"]) }),
      textField("attendees", "Attendees"),
      textField("agenda", "Agenda", false, true),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    documents: page("Shared documents", "Browse and manage demo document metadata; no files are uploaded.", "documents", [
      { key: "name", label: "Document" }, { key: "category", label: "Category" }, { key: "owner", label: "Owner" }, { key: "updatedAt", label: "Updated" },
    ], [
      textField("name", "Document name", true),
      field("category", "Category", { options: select(["Handbook", "Template", "Learning", "Policy"]) }),
      textField("owner", "Owner"),
      textField("project", "Related project"),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    policies: page("Policies", "Review demo organization policies and policy details.", "policies", [
      { key: "title", label: "Policy" }, { key: "category", label: "Category" }, { key: "owner", label: "Owner" }, { key: "updatedAt", label: "Updated" },
    ], [
      textField("title", "Policy title", true),
      field("category", "Category", { options: select(["Security", "People", "Operations"]) }),
      textField("owner", "Owner"),
    ], { allowCreate: true, allowUpdate: true }),
    channels: page("Channels", "Browse organization group messages and channel activity.", "messages", [
      { key: "channel", label: "Channel" }, { key: "author", label: "Author" }, { key: "text", label: "Message" }, { key: "time", label: "Time" },
    ]),
    goals: page("Goals and feedback", "Review and update demo goals and progress.", "goals", [
      { key: "title", label: "Goal" }, { key: "owner", label: "Owner" }, { key: "period", label: "Period" }, { key: "progress", label: "Progress" }, statusColumn,
    ], [
      textField("title", "Goal", true),
      textField("owner", "Owner"),
      textField("period", "Period"),
      field("progress", "Progress (%)", { type: "number", min: "0", max: "100" }),
      field("status", "Status", { options: select(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]) }),
    ], { allowCreate: true, allowUpdate: true }),
    training: page("Training", "Review available demo training and learning resources.", "training", [
      { key: "title", label: "Training" }, { key: "category", label: "Category" }, { key: "audience", label: "Audience" }, { key: "dueDate", label: "Due" }, statusColumn,
    ]),
    notifications: page("Notifications", "Review demo notifications for your active organization.", "notifications", [
      { key: "title", label: "Notification" }, { key: "description", label: "Details" }, { key: "date", label: "Date" }, statusColumn,
    ], [field("status", "Status", { options: select(["READ", "UNREAD"]) })], { allowUpdate: true }),
    help: page("Help and support", "Create a demo support request. No real support system is connected.", "supportRequests", [
      { key: "subject", label: "Subject" }, { key: "category", label: "Category" }, { key: "createdAt", label: "Created" }, statusColumn,
    ], [
      textField("subject", "Subject", true),
      field("category", "Category", { options: select(["Access", "Payroll", "Technical", "Other"]) }),
      textField("description", "Describe the request", true, true),
    ], { allowCreate: true }),
  },
  organization: {
    employees: page("Employee directory", "Manage organization employees and open profile details.", "employees", [
      { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "department", label: "Department" }, { key: "team", label: "Team" }, { key: "role", label: "Primary role" }, { key: "additionalRoles", label: "Additional roles" }, statusColumn,
    ], [
      textField("name", "Name", true),
      field("email", "Work email", { type: "email", required: true }),
      textField("department", "Department"),
      textField("team", "Team"),
      field("role", "Role", { options: select(["EMPLOYEE", "TEAM_LEAD", "TRAINER", "ORG_ADMIN"]) }),
      field("additionalRoles", "Additional roles", { multiple: true, options: select(["STUDENT", "TRAINER", "EMPLOYEE", "TEAM_LEAD", "ORG_ADMIN"]) }),
      field("status", "Status", { options: select(["ACTIVE", "INVITED", "SUSPENDED"]) }),
    ], { allowUpdate: true }),
    departments: page("Departments", "Create, edit, and review organization departments.", "departments", [
      { key: "name", label: "Department" }, { key: "owner", label: "Owner" }, { key: "members", label: "Members" },
    ], [textField("name", "Department name", true), textField("owner", "Department owner")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    teams: page("Teams", "Manage teams and their assigned leads.", "teams", [
      { key: "name", label: "Team" }, { key: "department", label: "Department" }, { key: "lead", label: "Team lead" }, { key: "members", label: "Members" },
    ], [textField("name", "Team name", true), textField("department", "Department"), textField("lead", "Team lead")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    projects: page("Organization projects", "Manage projects and their delivery status.", "projects", [
      { key: "name", label: "Project" }, { key: "owner", label: "Owner" }, statusColumn, { key: "progress", label: "Progress" }, { key: "dueDate", label: "Due" },
    ], [
      textField("name", "Project name", true),
      textField("owner", "Project owner"),
      field("status", "Status", { options: select(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED"]) }),
      field("progress", "Progress (%)", { type: "number", min: "0", max: "100" }),
      dateField("dueDate", "Due date"),
      textField("description", "Description", false, true),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    timesheets: page("Work logs and timesheets", "Review organization work-log records.", "workLogs", [
      { key: "date", label: "Date" }, { key: "project", label: "Project" }, { key: "hours", label: "Hours" }, { key: "note", label: "Summary" }, statusColumn,
    ], [field("status", "Review status", { options: select(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]) })], { allowUpdate: true }),
    leave: page("Leave management", "Review and decide demo leave requests.", "leaveRequests", [
      { key: "employee", label: "Employee" }, { key: "startDate", label: "From" }, { key: "endDate", label: "To" }, { key: "reason", label: "Reason" }, statusColumn,
    ]),
    holidays: page("Holidays and calendar", "Manage organization holidays and dates.", "holidays", [
      { key: "title", label: "Holiday" }, { key: "date", label: "Date" }, { key: "region", label: "Coverage" }, statusColumn,
    ], [textField("title", "Holiday title", true), dateField("date", "Date", true), textField("region", "Coverage")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    training: page("Training management", "Manage organization training offerings.", "training", [
      { key: "title", label: "Training" }, { key: "category", label: "Category" }, { key: "audience", label: "Audience" }, { key: "dueDate", label: "Due" }, statusColumn,
    ], [
      textField("title", "Training title", true),
      textField("category", "Category"),
      textField("audience", "Audience"),
      dateField("dueDate", "Due date"),
      field("status", "Status", { options: select(["AVAILABLE", "IN_PROGRESS", "COMPLETED"]) }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    courses: page("Courses and batches", "Manage organization courses and open course details.", "courses", [
      { key: "name", label: "Course" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }, { key: "lessons", label: "Lessons" },
    ], [
      textField("name", "Course name", true),
      textField("category", "Category"),
      field("level", "Level", { options: select(["Beginner", "Intermediate", "Advanced"]) }),
      field("lessons", "Lesson count", { type: "number", min: "1" }),
    ], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    assignments: page("Assignments", "Review organization assignment details and due dates.", "assignments", [
      { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "dueDate", label: "Due" }, { key: "submissions", label: "Submissions" }, statusColumn,
    ]),
    announcements: page("Organization announcements", "Create and manage organization announcements.", "announcements", [
      { key: "title", label: "Announcement" }, { key: "audience", label: "Audience" }, { key: "author", label: "Author" }, { key: "date", label: "Date" },
    ], [textField("title", "Announcement", true), textField("audience", "Audience")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    notifications: page("Notifications", "Review demo organization notifications.", "notifications", [
      { key: "title", label: "Notification" }, { key: "description", label: "Details" }, { key: "date", label: "Date" }, statusColumn,
    ], [field("status", "Status", { options: select(["READ", "UNREAD"]) })], { allowUpdate: true }),
    documents: page("Organization documents", "Manage demo document metadata; files are not uploaded.", "documents", [
      { key: "name", label: "Document" }, { key: "category", label: "Category" }, { key: "owner", label: "Owner" }, { key: "updatedAt", label: "Updated" },
    ], [textField("name", "Document name", true), textField("category", "Category"), textField("owner", "Owner")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    policies: page("Organization policies", "Manage organization policy metadata.", "policies", [
      { key: "title", label: "Policy" }, { key: "category", label: "Category" }, { key: "owner", label: "Owner" }, { key: "updatedAt", label: "Updated" },
    ], [textField("title", "Policy title", true), textField("category", "Category"), textField("owner", "Owner")], { allowCreate: true, allowUpdate: true }),
    channels: page("Organization channels", "Browse organization channels and message activity.", "messages", [
      { key: "channel", label: "Channel" }, { key: "author", label: "Author" }, { key: "text", label: "Message" }, { key: "time", label: "Time" },
    ]),
    audit: page("Organization activity log", "Review representative activity for the active organization.", "auditEvents", [
      { key: "date", label: "Time" }, { key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "target", label: "Target" }, { key: "result", label: "Result", kind: "status" },
    ]),
  },
  superadmin: {
    roles: page("Platform roles", "Review example role capabilities. This demo does not grant backend permissions.", "rolePermissions", [
      { key: "name", label: "Capability" }, { key: "scope", label: "Scope" }, statusColumn,
    ]),
    security: page("Security activity", "Review representative platform security events.", "securityEvents", [
      { key: "date", label: "Time" }, { key: "actor", label: "Actor" }, { key: "action", label: "Activity" }, { key: "result", label: "Result", kind: "status" },
    ]),
    announcements: page("Platform announcements", "Create platform-wide demo announcements.", "platformAnnouncements", [
      { key: "title", label: "Announcement" }, { key: "audience", label: "Audience" }, { key: "author", label: "Author" }, { key: "date", label: "Date" },
    ], [textField("title", "Announcement", true), textField("audience", "Audience")], { allowCreate: true, allowUpdate: true, allowDelete: true }),
    support: page("Platform support requests", "Triage demo support requests.", "supportRequests", [
      { key: "subject", label: "Subject" }, { key: "category", label: "Category" }, { key: "createdAt", label: "Created" }, statusColumn,
    ], [field("status", "Status", { options: select(["OPEN", "IN_PROGRESS", "RESOLVED"]) })], { allowUpdate: true }),
  },
}

export const STATIC_WORKSPACE_SCREENS = {
  student: ["dashboard", "practice", "progress", "messages", "profile", "settings"],
  trainer: ["dashboard", "profile", "attendance", "calendar", "announcements", "reports", "messages", "settings"],
  employee: ["dashboard", "tasks", "worklogs", "attendance", "announcements", "messages", "developer", "github", "profile", "settings"],
  organization: ["dashboard", "settings", "invitations", "roles", "tasks", "attendance", "reports", "analytics", "access", "registration", "application-status"],
  superadmin: ["dashboard", "applications", "organizations", "suspended", "users", "audit", "analytics", "configuration"],
}
