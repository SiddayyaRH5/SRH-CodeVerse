import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  DEMO_CHANNELS,
  DEMO_MEMBERSHIPS,
  DEMO_ORGANIZATIONS,
  PORTALS,
  PORTAL_NAVIGATION,
} from "./demoData"
import { useWorkspace } from "./useWorkspace"
import { RESOURCE_PAGES } from "./resourcePages"
import { useToast } from "../../context/ToastContext"
import { getPlatformOrganizations, createPlatformOrganization, updatePlatformOrganizationStatus } from "../../api/platformAdminApi"

const TASK_STATUSES = [
  ["TODO", "To do"],
  ["IN_PROGRESS", "In progress"],
  ["REVIEW", "Review"],
  ["COMPLETED", "Completed"],
]

const SCREEN_COPY = {
  courses: ["My courses", "Explore your organization courses and open course details."],
  resources: ["Learning resources", "Browse course resources and reference materials."],
  practice: ["Coding practice", "Practice challenges and track progress in demo mode."],
  "learning-paths": ["Learning paths", "Follow a guided path and open its learning milestones."],
  progress: ["Learning progress", "A snapshot of course activity and learning milestones."],
  assignments: ["Assignments", "Review upcoming work and assignment activity."],
  certificates: ["Certificates", "Completed learning achievements for the demo learner."],
  profile: ["Profile and settings", "Manage demo profile preferences and workspace details."],
  settings: ["Settings", "Manage demo workspace preferences."],
  students: ["Student directory", "Find learners, review activity, and identify support needs."],
  batches: ["Batch management", "View cohorts, their trainers, and learner counts."],
  submissions: ["Submission review", "Review learner submissions and feedback."],
  evaluation: ["Evaluation", "Use the demo rubric summary to guide learner feedback."],
  attendance: ["Attendance", "Review attendance and participation across the workspace."],
  reports: ["Reports and analytics", "Explore high-level demo engagement and performance metrics."],
  projects: ["Projects", "Track project ownership, status, and delivery progress."],
  teams: ["Teams", "Browse teams and their current leads."],
  worklogs: ["Work logs and timesheets", "Record demo work hours. Entries remain in memory only."],
  leave: ["Leave requests", "Submit and review demo leave requests."],
  calendar: ["Company calendar", "See upcoming team and learning events."],
  announcements: ["Announcements", "Read or publish messages for a selected audience."],
  documents: ["Documents", "Browse shared workspace documents and templates."],
  messages: ["Messages and channels", "A lightweight demo interface for groups and channels."],
  developer: ["Developer workspace", "A demo overview of projects and developer workflows."],
  github: ["GitHub integration", "Preview the integration surface without connecting an account."],
  employees: ["Employee directory", "Manage organization employees and their status."],
  invitations: ["Invite an employee", "Create a demo invitation without sending an email."],
  departments: ["Departments", "Review the organization's department structure."],
  roles: ["Roles and permissions", "Review role capability examples for the demo."],
  tasks: ["Task board", "Create tasks and move them through the demo workflow."],
  access: ["Access controls", "Change demo employee roles and access status."],
  applications: ["Organization applications", "Approve or reject organization applications in demo mode."],
  organizations: ["Organization directory", "Review active organizations in the platform demo."],
  suspended: ["Suspended organizations", "Review and restore demo organizations."],
  users: ["Platform users", "Browse demo users by organization and role."],
  analytics: ["System analytics", "Explore demo platform and organization metrics."],
  configuration: ["Platform configuration", "Preview configurable platform policies."],
  registration: ["Organization registration", "Create a demo application for platform approval."],
  "application-status": ["Application status", "Track demo organization application reviews."],
  curriculum: ["Course curriculum", "Organize course lesson outlines in the demo workspace."],
  materials: ["Learning materials", "Manage demo links and materials attached to courses."],
  schedule: ["Class schedule", "Review and manage demo classes and office hours."],
  notifications: ["Notifications", "Review demo notifications for your active organization."],
  directory: ["Employee directory", "Browse organization coworkers and open demo profiles."],
  "task-list": ["Task list", "Search tasks and open details, updates, and comments."],
  timesheets: ["Timesheets and reports", "Review demo work logs and timesheet summaries."],
  "attendance-history": ["Attendance history", "Review attendance entries in the active organization."],
  "leave-balance": ["Leave balance", "Review illustrative demo leave balances."],
  meetings: ["Meetings", "Plan demo meetings without connecting a video service."],
  policies: ["Policies", "Review demo organization policies and policy details."],
  channels: ["Channels", "Browse organization channels and message activity."],
  goals: ["Goals and feedback", "Review and update demo goals and progress."],
  training: ["Training", "Review available demo training and learning resources."],
  help: ["Help and support", "Create a demo support request."],
  holidays: ["Holidays and calendar", "Manage organization holidays and dates."],
  security: ["Security activity", "Review representative platform security events."],
  support: ["Support requests", "Create or triage demo support requests."],
}

function Surface({ children, className = "" }) {
  return (
    <section className={`cv-panel ${className}`}>
      {children}
    </section>
  )
}

function MetricCard({ label, value, note, index = 0 }) {
  const accents = ["violet", "cyan", "pink", "amber"]
  return (
    <Surface className={`cv-metric-card cv-metric-${accents[index % accents.length]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--cv-muted)]">{label}</p>
        <span className="cv-metric-spark" aria-hidden="true"><span /></span>
      </div>
      <p className="cv-metric-value mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      {note && <p className="mt-2 text-xs text-[var(--cv-muted)]">{note}</p>}
    </Surface>
  )
}

function StatusBadge({ value }) {
  const isPositive = ["ACTIVE", "APPROVED", "COMPLETED", "SUCCESS"].includes(value)
  const isWarning = ["PENDING", "IN_PROGRESS", "REVIEW", "INVITED"].includes(value)
  const colors = isPositive
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    : isWarning
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{String(value || "—").replaceAll("_", " ")}</span>
}

function DataTable({ rows, columns, emptyMessage = "Nothing to show yet." }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState("")
  const [sortDirection, setSortDirection] = useState(1)
  const pageSize = 6
  const statusOptions = useMemo(
    () => [...new Set(rows.map((row) => row.status).filter(Boolean))].sort(),
    [rows],
  )
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = rows.filter((row) =>
      (!needle || columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(needle))) &&
      (!statusFilter || row.status === statusFilter),
    )
    if (sortKey) {
      filtered.sort((a, b) =>
        String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * sortDirection,
      )
    }
    return filtered
  }, [columns, query, rows, sortDirection, sortKey, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize)

  function toggleSort(key) {
    if (sortKey === key) setSortDirection((direction) => direction * -1)
    else {
      setSortKey(key)
      setSortDirection(1)
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="block min-w-56 max-w-sm flex-1">
          <span className="sr-only">Search table</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            placeholder="Search rows..."
            className="cv-input !py-2 text-sm"
          />
        </label>
        {statusOptions.length > 1 && (
          <label>
            <span className="sr-only">Filter by status</span>
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }} className="cv-input !w-auto !py-2 text-sm">
              <option value="">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{String(status).replaceAll("_", " ")}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--cv-border)] text-xs uppercase tracking-wide text-[var(--cv-muted)]">
              {columns.map((column) => (
                <th scope="col" key={column.key} className="px-3 py-3 font-semibold">
                  {column.sortable === false ? column.label : (
                    <button type="button" onClick={() => toggleSort(column.key)} className="font-semibold hover:text-[var(--cv-text)]">
                      {column.label}{sortKey === column.key ? (sortDirection > 0 ? " ↑" : " ↓") : ""}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--cv-border)] last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 align-middle">
                    {column.render ? column.render(row) : (row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleRows.length === 0 && <p className="py-8 text-center text-sm text-[var(--cv-muted)]">{emptyMessage}</p>}
      {filteredRows.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--cv-muted)]">Page {page + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="cv-secondary-btn !px-3 !py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)} className="cv-secondary-btn !px-3 !py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DemoForm({ fields, onSubmit, submitLabel = "Save in demo", successText = "Demo change saved in memory.", initialValues = {} }) {
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [busy, setBusy] = useState(false)
  const { showToast } = useToast()

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setMessage("")
    setIsError(false)
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(fields.map((field) => [
      field.name,
      field.multiple ? formData.getAll(field.name) : (formData.get(field.name) ?? ""),
    ]))
    try {
      await onSubmit(values)
      if (Object.keys(initialValues).length === 0) form.reset()
      setMessage(successText)
      showToast(successText, "success")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The demo operation could not be completed.")
      setIsError(true)
      showToast(error instanceof Error ? error.message : "The demo operation could not be completed.", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
          <span className="mb-1 block text-sm font-medium">{field.label}</span>
          {field.options ? (
            <select name={field.name} multiple={field.multiple} required={field.required} defaultValue={initialValues[field.name] ?? field.defaultValue ?? (field.multiple ? [] : "")} className="cv-input">
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ) : field.multiline ? (
            <textarea name={field.name} required={field.required} rows={field.rows ?? 3} placeholder={field.placeholder} defaultValue={initialValues[field.name] ?? field.defaultValue ?? ""} className="cv-input" />
          ) : (
            <input name={field.name} type={field.type ?? "text"} required={field.required} min={field.min} max={field.max} placeholder={field.placeholder} defaultValue={initialValues[field.name] ?? field.defaultValue ?? ""} className="cv-input" />
          )}
        </label>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="cv-primary-btn !px-4 !py-2.5 text-sm disabled:opacity-60">
          {busy ? "Working..." : submitLabel}
        </button>
        {message && <p role="status" className={`mt-2 text-sm ${isError ? "text-red-600" : "text-emerald-700 dark:text-emerald-300"}`}>{message}</p>}
      </div>
    </form>
  )
}

function PageIntro({ portal, screen }) {
  const resourcePage = RESOURCE_PAGES[portal]?.[screen]
  const [title, description] = resourcePage
    ? [resourcePage.title, resourcePage.description]
    : portal === "organization" && screen === "settings"
      ? ["Organization profile", "Update the demo organization profile in memory."]
      : SCREEN_COPY[screen] ?? ["Workspace", "Explore this demo workspace."]
  return (
    <div className="mb-6">
      <p className="cv-kicker">{PORTALS[portal].label.toUpperCase()} WORKSPACE</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-[var(--cv-muted)]">{description}</p>
    </div>
  )
}

function Dashboard({ portal }) {
  const location = useLocation()
  const basePath = location.pathname.startsWith("/demo") ? "/demo" : "/workspace"
  const { activeOrganization, data, studentMode } = useWorkspace()
  const metricsData = data.dashboardMetrics
  const metrics = {
    student: [
      ["Active courses", studentMode === "independent" ? metricsData.independentCourses : data.courses.length, "Across your learning workspace"],
      ["Learning progress", metricsData.studentProgress, "Up 8% this month"],
      ["Assignments due", data.assignments.filter((item) => item.status !== "REVIEW").length, "Check your upcoming work"],
      ["Certificates", metricsData.studentCertificates, "One new milestone available"],
    ],
    trainer: [
      ["Learners", data.students.length, "Across your assigned cohorts"],
      ["Active batches", data.teams.length, "Cohort activity is on track"],
      ["To evaluate", data.assignments.filter((item) => item.status === "REVIEW").length, "Submissions need review"],
      ["Attendance", metricsData.trainerAttendance, "Average this week"],
    ],
    employee: [
      ["My open tasks", data.tasks.filter((item) => item.status !== "COMPLETED").length, "Across active projects"],
      ["In progress", data.tasks.filter((item) => item.status === "IN_PROGRESS").length, "Keep your work moving"],
      ["Projects", data.projects.length, "In your organization"],
      ["Hours this week", data.workLogs.reduce((sum, item) => sum + item.hours, metricsData.employeeWeeklyHours), "Demo timesheet summary"],
    ],
    organization: [
      ["Employees", activeOrganization?.employees ?? data.employees.length, "People in this organization"],
      ["Projects", data.projects.length, "Active and planned"],
      ["Open tasks", data.tasks.filter((item) => item.status !== "COMPLETED").length, "Across your teams"],
      ["Attendance", metricsData.organizationAttendance, "Organization average"],
    ],
    superadmin: [
      ["Organizations", data.organizations.length, "All platform workspaces"],
      ["Pending applications", data.applications.filter((item) => item.status === "PENDING").length, "Review applications"],
      ["Active users", data.employees.length + data.students.length, "Demo user directory"],
      ["Suspended", data.organizations.filter((item) => item.status === "SUSPENDED").length, "Require platform attention"],
    ],
  }[portal]
  const shortcuts = PORTAL_NAVIGATION[portal].slice(1, 5)

  return (
    <div className={`cv-workspace-dashboard cv-dashboard-${portal}`}>
      <div className="cv-dashboard-hero mb-6">
        <div className="cv-dashboard-hero-copy">
          <span className="cv-dashboard-welcome-pill">{PORTALS[portal].label.toUpperCase()} SPACE · OVERVIEW</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, Demo User <span aria-hidden="true">✦</span></h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--cv-muted)]">
            {portal === "superadmin" ? "A platform-wide overview of the demo environment." : `Here is the latest overview for ${activeOrganization?.name ?? "your workspace"}.`}
          </p>
          <div className="cv-dashboard-hero-meta mt-5 flex flex-wrap gap-2">
            <span className="cv-dashboard-meta-chip">● Workspace active</span>
            <span className="cv-dashboard-meta-chip">Updated just now</span>
          </div>
        </div>
        <div className="cv-dashboard-hero-orb" aria-hidden="true"><div className="cv-dashboard-orb-core" /></div>
      </div>
      <div className="cv-dashboard-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, note], index) => <MetricCard key={label} label={label} value={value} note={note} index={index} />)}
      </div>
      <div className="cv-dashboard-lower mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.9fr_0.9fr]">
        <Surface className="cv-dashboard-activity">
          <h3 className="font-semibold">Recent activity</h3>
          <ul className="mt-4 divide-y divide-[var(--cv-border)]">
            {data.auditEvents.slice(0, 4).map((event) => (
              <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span>{event.action} <span className="text-[var(--cv-muted)]">· {event.target}</span></span>
                <span className="text-xs text-[var(--cv-muted)]">{event.date}</span>
              </li>
            ))}
          </ul>
        </Surface>
        <WorkspacePulse portal={portal} data={data} />
        <Surface className="cv-dashboard-shortcuts">
          <h3 className="font-semibold">Quick access</h3>
          <div className="mt-4 grid gap-2">
            {shortcuts.map(([label, route]) => (
              <Link key={route} to={`${basePath}/${portal}/${route}`} className="rounded-lg border border-[var(--cv-border)] px-3 py-2.5 text-sm hover:bg-[var(--cv-surface-2)]">{label} <span aria-hidden="true">→</span></Link>
            ))}
            {portal === "organization" && <Link to={`${basePath}/organization/registration`} className="rounded-lg border border-[var(--cv-border)] px-3 py-2.5 text-sm hover:bg-[var(--cv-surface-2)]">Organization registration →</Link>}
          </div>
        </Surface>
      </div>
    </div>
  )
}


function WorkspacePulse({ portal, data }) {
  const pulseItems = {
    student: [["Courses", data.courses], ["Challenges", data.challenges], ["Assignments", data.assignments], ["Certificates", data.certificates]],
    trainer: [["Learners", data.students], ["Batches", data.teams], ["Assignments", data.assignments], ["Submissions", data.submissions]],
    employee: [["Projects", data.projects], ["Tasks", data.tasks], ["Teams", data.teams], ["Work logs", data.workLogs]],
    organization: [["Members", data.employees], ["Projects", data.projects], ["Tasks", data.tasks], ["Teams", data.teams]],
    superadmin: [["Organizations", data.organizations], ["Users", data.employees], ["Applications", data.applications], ["Audit events", data.auditEvents]],
  }[portal]
  const items = pulseItems.map(([label, records]) => [label, Array.isArray(records) ? records.length : 0])
  const max = Math.max(1, ...items.map(([, value]) => value))
  return (
    <Surface className="cv-dashboard-pulse">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Workspace pulse</h3>
        <span className="cv-dashboard-meta-chip">Sample data</span>
      </div>
      <div className="mt-5 space-y-4">
        {items.map(([label, value], index) => (
          <div key={label} className="cv-pulse-row" style={{ animationDelay: `${index * 75}ms` }}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--cv-muted)]">{label}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </div>
            <div className="cv-pulse-track"><span style={{ width: `${Math.max(value ? 8 : 0, value / max * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </Surface>
  )
}


function WorkspaceTable({ title, rows, columns, emptyMessage }) {
  return (
    <Surface>
      <h3 className="mb-4 font-semibold">{title}</h3>
      <DataTable rows={rows} columns={columns} emptyMessage={emptyMessage} />
    </Surface>
  )
}

function CertificateVerification({ certificates }) {
  const [credential, setCredential] = useState("")
  const [result, setResult] = useState(null)
  const [checked, setChecked] = useState(false)

  function verify(event) {
    event.preventDefault()
    const normalized = credential.trim().toLowerCase()
    setResult(normalized ? certificates.find((item) => item.credential?.toLowerCase() === normalized) ?? null : null)
    setChecked(true)
  }

  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="font-semibold">Verify a demo certificate</h3>
        <p className="mt-1 text-sm text-[var(--cv-muted)]">Search the sample credentials currently available in this browser session.</p>
        <form onSubmit={verify} className="mt-4 flex flex-wrap gap-2">
          <label className="min-w-52 flex-1">
            <span className="sr-only">Certificate credential ID</span>
            <input value={credential} onChange={(event) => { setCredential(event.target.value); setChecked(false) }} required className="cv-input" placeholder="Enter a credential ID" />
          </label>
          <button type="submit" className="cv-primary-btn !px-4 !py-2.5 text-sm">Verify credential</button>
        </form>
        {checked && (result ? (
          <div role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <strong>Demo credential found</strong>
            <p className="mt-1">{result.name} · issued {result.issued}</p>
            <p className="text-xs text-[var(--cv-muted)]">Credential {result.credential} is present in the sample dataset. This is not a real-world verification service.</p>
          </div>
        ) : <p role="status" className="mt-4 text-sm text-[var(--cv-muted)]">No matching credential was found in the demo dataset.</p>)}
      </Surface>
    </div>
  )
}

function CourseDetails({ course, data, organizationId, mutate, studentMode }) {
  const [message, setMessage] = useState("")
  const lessons = data.curriculum.filter((item) => item.course === course.name)
  const resources = data.courseResources.filter((item) => item.course === course.name)
  const assignments = data.assignments.filter((item) => item.course === course.name)

  async function markProgress() {
    try {
      const progress = Math.min(100, Number(course.progress || 0) + 10)
      if (studentMode === "independent") {
        await mutate("updateIndependentCourseProgress", course.id, progress)
      } else {
        await mutate("updateResource", "courses", course.id, organizationId, { progress })
      }
      setMessage("Course progress updated in this demo session.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course progress could not be updated.")
    }
  }

  return (
    <Surface>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="cv-kicker">COURSE OVERVIEW</p>
          <h3 className="mt-1 text-lg font-semibold">{course.name}</h3>
          <p className="mt-1 text-sm text-[var(--cv-muted)]">{course.category} · {course.level} · {course.lessons} lessons</p>
        </div>
        <button type="button" disabled={Number(course.progress) >= 100} onClick={markProgress} className="cv-primary-btn !px-3 !py-2 text-sm disabled:opacity-50">Mark next milestone</button>
      </div>
      {message && <p role="status" className="mt-3 text-sm text-[var(--cv-muted)]">{message}</p>}
      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs"><span>Demo progress</span><span>{course.progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)]"><div className="h-full bg-[var(--cv-primary)]" style={{ width: `${course.progress}%` }} /></div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section>
          <h4 className="text-sm font-semibold">Lessons</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {lessons.map((lesson) => <li key={lesson.id} className="rounded-lg bg-[var(--cv-surface-2)] p-2.5">{lesson.order}. {lesson.title} <StatusBadge value={lesson.status} /></li>)}
            {lessons.length === 0 && <li className="text-[var(--cv-muted)]">No lesson details are available for this course yet.</li>}
          </ul>
        </section>
        <section>
          <h4 className="text-sm font-semibold">Resources</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {resources.map((item) => <li key={item.id} className="rounded-lg bg-[var(--cv-surface-2)] p-2.5">{item.url && <a className="font-medium text-[var(--cv-primary)] hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a>}{!item.url && item.title} <span className="text-xs text-[var(--cv-muted)]">· {item.type}</span></li>)}
            {resources.length === 0 && <li className="text-[var(--cv-muted)]">No resources are available for this course yet.</li>}
          </ul>
        </section>
        <section>
          <h4 className="text-sm font-semibold">Assignments</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {assignments.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--cv-surface-2)] p-2.5"><span>{item.title}<span className="block text-xs text-[var(--cv-muted)]">Due {item.dueDate}</span></span><Link className="shrink-0 font-medium text-[var(--cv-primary)] hover:underline" to={`/workspace/student/assignments/${item.id}`}>Open</Link></li>)}
            {assignments.length === 0 && <li className="text-[var(--cv-muted)]">No assignments are available for this course yet.</li>}
          </ul>
        </section>
      </div>
    </Surface>
  )
}

function CourseScreen({ screen, organizationId }) {
  const { data, mutate, studentMode } = useWorkspace()
  if (screen === "progress") {
    return (
      <div className="space-y-5">
        <Surface>
          <h3 className="font-semibold">Course progress</h3>
          <p className="mt-1 text-sm text-[var(--cv-muted)]">Update a demo learning milestone. Progress remains in memory only.</p>
        </Surface>
        <div className="space-y-5">
          {data.courses.map((course) => (
            <Surface key={course.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex justify-between gap-4 text-sm">
                    <span className="font-medium">{course.name}</span><span className="text-[var(--cv-muted)]">{course.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--cv-surface-2)]" role="progressbar" aria-label={`${course.name} progress`} aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[var(--cv-primary)]" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={course.progress >= 100}
                  onClick={() => studentMode === "independent"
                    ? mutate("updateIndependentCourseProgress", course.id, Math.min(100, course.progress + 10))
                    : mutate("updateResource", "courses", course.id, organizationId, { progress: Math.min(100, course.progress + 10) })}
                  className="cv-secondary-btn !px-3 !py-2 text-xs disabled:opacity-50"
                >
                  Mark next milestone
                </button>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    )
  }
  if (screen === "practice") {
    return <WorkspaceTable title="Practice challenges" rows={data.challenges} columns={[{ key: "title", label: "Challenge" }, { key: "difficulty", label: "Difficulty" }, { key: "track", label: "Track" }, { key: "progress", label: "Status" }]} />
  }
  if (screen === "assignments") {
    return <WorkspaceTable title="Assignments" rows={data.assignments} columns={[
      { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "dueDate", label: "Due date" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    ]} />
  }
  if (screen === "certificates") {
    return <WorkspaceTable title="Achievements" rows={data.certificates} columns={[{ key: "name", label: "Certificate" }, { key: "issued", label: "Issued" }, { key: "credential", label: "Credential" }]} />
  }
  return <WorkspaceTable title="Available courses" rows={data.courses} columns={[
    { key: "name", label: "Course" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }, { key: "lessons", label: "Lessons" }, { key: "progress", label: "Progress", render: (row) => `${row.progress}%` },
  ]} />
}

function TrainerCourses() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Create a course</h3>
        <DemoForm fields={[
          { name: "name", label: "Course name", required: true },
          { name: "category", label: "Category", required: true },
          { name: "level", label: "Level", options: [{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }] },
          { name: "lessons", label: "Lesson count", type: "number", min: "1", required: true },
        ]} onSubmit={(values) => mutate("createCourse", { ...values, organizationId: activeOrganizationId })} submitLabel="Create demo course" />
      </Surface>
      <WorkspaceTable title="Organization courses" rows={data.courses} columns={[
        { key: "name", label: "Course" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }, { key: "lessons", label: "Lessons" },
      ]} />
    </div>
  )
}

function TrainerAssignments() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Create an assignment</h3>
        <DemoForm fields={[
          { name: "title", label: "Assignment title", required: true },
          { name: "courseId", label: "Course", required: true, options: data.courses.map((course) => ({ value: course.id, label: course.name })) },
          { name: "dueDate", label: "Due date", type: "date", required: true },
        ]} onSubmit={(values) => mutate("createAssignment", { ...values, organizationId: activeOrganizationId })} submitLabel="Create demo assignment" />
      </Surface>
      <WorkspaceTable title="Assignments" rows={data.assignments} columns={[
        { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "dueDate", label: "Due" }, { key: "submissions", label: "Submissions" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      ]} />
    </div>
  )
}

function TaskBoard({ allowCreate = true, onlyMyTasks = false }) {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  const [message, setMessage] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [comment, setComment] = useState("")
  const [query, setQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState("")
  const [view, setView] = useState("board")
  const boardTasks = onlyMyTasks ? data.tasks.filter((task) => task.assignee === "Demo User") : data.tasks
  const visibleTasks = boardTasks.filter((task) =>
    (!query || `${task.title} ${task.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (!priorityFilter || task.priority === priorityFilter) &&
    (!assigneeFilter || task.assignee === assigneeFilter),
  )
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId)
  const assignees = [...new Set(boardTasks.map((task) => task.assignee).filter(Boolean))].sort()

  async function changeStatus(taskId, status) {
    try {
      await mutate("updateTaskStatus", taskId, status, activeOrganizationId)
      setMessage("Task status updated in this demo session.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task could not be updated.")
    }
  }

  async function addComment(event) {
    event.preventDefault()
    try {
      await mutate("addTaskComment", selectedTaskId, comment, activeOrganizationId)
      setComment("")
      setMessage("Comment added to the demo task.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The comment could not be added.")
    }
  }

  return (
    <div className="space-y-5">
      {allowCreate && (
        <Surface>
          <h3 className="mb-4 font-semibold">Create a task</h3>
          <DemoForm
            fields={[
              { name: "title", label: "Task title", required: true, wide: true },
              { name: "assignee", label: "Assignee", placeholder: "Name" },
              { name: "priority", label: "Priority", options: [{ value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }] },
              { name: "dueDate", label: "Due date", type: "date" },
              { name: "description", label: "Description", multiline: true, wide: true },
            ]}
            onSubmit={(values) => mutate("createTask", { ...values, organizationId: activeOrganizationId })}
            successText="Task created in demo memory."
          />
        </Surface>
      )}
      {message && <p role="status" className="text-sm text-[var(--cv-muted)]">{message}</p>}
      <Surface>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_200px_auto]">
          <label className="min-w-0">
            <span className="sr-only">Search tasks</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="cv-input !py-2 text-sm" placeholder="Search title or description..." />
          </label>
          <label>
            <span className="sr-only">Filter tasks by priority</span>
            <select aria-label="Filter tasks by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="cv-input !py-2 text-sm">
              <option value="">All priorities</option>
              {["LOW", "MEDIUM", "HIGH"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter tasks by assignee</span>
            <select aria-label="Filter tasks by assignee" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="cv-input !py-2 text-sm">
              <option value="">All assignees</option>
              {assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            {["board", "list"].map((mode) => (
              <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`cv-secondary-btn !px-3 !py-2 text-xs ${view === mode ? "border-[var(--cv-primary)] text-[var(--cv-primary)]" : ""}`}>
                {mode === "board" ? "Board" : "List"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--cv-muted)]">Showing {visibleTasks.length} of {boardTasks.length} tasks for this organization.</p>
      </Surface>
      {view === "list" ? (
        <WorkspaceTable title="Filtered task list" rows={visibleTasks} columns={[
          { key: "title", label: "Task" },
          { key: "assignee", label: "Assignee" },
          { key: "priority", label: "Priority" },
          { key: "dueDate", label: "Due date" },
          { key: "status", label: "Status", render: (task) => <select aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value)} className="cv-input !py-1.5 text-xs">{TASK_STATUSES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select> },
          { key: "details", label: "Details", sortable: false, render: (task) => <button type="button" onClick={() => setSelectedTaskId(task.id)} className="font-semibold text-[var(--cv-primary)] hover:underline">Open</button> },
        ]} />
      ) : <div className="grid gap-4 xl:grid-cols-4">
        {TASK_STATUSES.map(([status, label]) => {
          const tasks = visibleTasks.filter((task) => task.status === status)
          return (
            <section key={status} aria-label={`${label} tasks`} className="min-h-48 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)] p-3">
              <h3 className="mb-3 flex justify-between text-sm font-semibold">{label}<span className="text-[var(--cv-muted)]">{tasks.length}</span></h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article key={task.id} className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
                    <button type="button" onClick={() => setSelectedTaskId(selectedTaskId === task.id ? "" : task.id)} className="text-left font-medium hover:text-[var(--cv-primary)]">{task.title}</button>
                    <p className="mt-2 text-xs text-[var(--cv-muted)]">{task.assignee} · {task.priority} priority</p>
                    <label className="sr-only" htmlFor={`task-status-${task.id}`}>Change status for {task.title}</label>
                    <select id={`task-status-${task.id}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value)} className="mt-3 w-full rounded-md border border-[var(--cv-border)] bg-[var(--cv-bg)] px-2 py-1.5 text-xs">
                      {TASK_STATUSES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>}
      {selectedTask && (
        <Surface>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">{selectedTask.title}</h3><p className="mt-1 text-sm text-[var(--cv-muted)]">{selectedTask.description || "No description provided."}</p></div>
            <button type="button" onClick={() => setSelectedTaskId("")} className="rounded-lg border border-[var(--cv-border)] px-3 py-1.5 text-sm">Close details</button>
          </div>
          {selectedTask.attachmentUrl && <a className="mt-3 inline-block break-all text-sm font-medium text-[var(--cv-primary)] hover:underline" href={selectedTask.attachmentUrl} target="_blank" rel="noopener noreferrer">Open demo task attachment ↗</a>}
          <h4 className="mt-4 text-sm font-semibold">Activity history</h4>
          <ol className="mt-2 space-y-1 text-xs text-[var(--cv-muted)]">{(selectedTask.history ?? []).map((item, index) => <li key={`${selectedTask.id}-history-${index}`}>{item.action} · {item.actor} · {new Date(item.at).toLocaleString()}</li>)}
            {(selectedTask.history ?? []).length === 0 && <li>No task changes recorded.</li>}
          </ol>
          <ul className="mt-4 space-y-2 text-sm">{(selectedTask.comments ?? []).map((item, index) => <li key={`${selectedTask.id}-comment-${index}`} className="rounded-lg bg-[var(--cv-surface-2)] p-3"><strong>{item.author}:</strong> {item.text}</li>)}</ul>
          <form onSubmit={addComment} className="mt-4 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="task-comment">Add a comment</label>
            <input id="task-comment" value={comment} onChange={(event) => setComment(event.target.value)} required className="min-w-52 flex-1 rounded-lg border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-2" placeholder="Write a comment..." />
            <button className="rounded-lg bg-[var(--cv-primary)] px-4 py-2 text-sm font-semibold text-white">Add comment</button>
          </form>
        </Surface>
      )}
    </div>
  )
}

function ApplicationReview({ routeParts = [] }) {
  const { data, mutate } = useWorkspace()
  const [reasons, setReasons] = useState({})
  const [message, setMessage] = useState("")
  const selectedApplication = routeParts[0]
    ? data.applications.find((item) => item.id === routeParts[0])
    : null

  async function review(application, decision) {
    try {
      await mutate("reviewApplication", application.id, { decision, reason: reasons[application.id] ?? "" })
      setMessage(`${application.organizationName} marked ${decision.toLowerCase()} in demo mode.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The application could not be reviewed.")
    }
  }

  if (routeParts.length > 0) {
    if (!selectedApplication) return <Surface><p className="text-sm text-[var(--cv-muted)]">Application not found.</p><Link to="/workspace/superadmin/applications" className="cv-secondary-btn mt-4 !py-2">Back to applications</Link></Surface>
    return (
      <Surface>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="cv-kicker">ORGANIZATION APPLICATION</p>
            <h3 className="mt-1 text-xl font-bold">{selectedApplication.organizationName}</h3>
            <p className="mt-2 text-sm text-[var(--cv-muted)]">{selectedApplication.type} · Submitted {selectedApplication.requestedAt}</p>
          </div>
          <StatusBadge value={selectedApplication.status} />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-[var(--cv-muted)]">Contact</dt><dd className="mt-1">{selectedApplication.contactName}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Contact email</dt><dd className="mt-1">{selectedApplication.contactEmail}</dd></div>
          {selectedApplication.reason && <div className="sm:col-span-2"><dt className="text-xs text-[var(--cv-muted)]">Review reason</dt><dd className="mt-1">{selectedApplication.reason}</dd></div>}
        </dl>
        {selectedApplication.status === "PENDING" && (
          <div className="mt-5 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor={`application-reason-${selectedApplication.id}`}>Rejection reason</label>
            <input id={`application-reason-${selectedApplication.id}`} value={reasons[selectedApplication.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [selectedApplication.id]: event.target.value }))} placeholder="Reason required to reject" className="cv-input min-w-56 flex-1 !py-2" />
            <button type="button" onClick={() => review(selectedApplication, "APPROVED")} className="cv-primary-btn !px-4 !py-2 text-sm">Approve</button>
            <button type="button" onClick={() => review(selectedApplication, "REJECTED")} className="cv-secondary-btn !px-4 !py-2 text-sm text-red-600">Reject</button>
          </div>
        )}
        {message && <p role="status" className="mt-3 text-sm text-[var(--cv-muted)]">{message}</p>}
        <Link to="/workspace/superadmin/applications" className="cv-secondary-btn mt-5 !px-4 !py-2.5 text-sm">Back to applications</Link>
      </Surface>
    )
  }

  return (
    <div className="space-y-4">
      {message && <p role="status" className="text-sm text-[var(--cv-muted)]">{message}</p>}
      {data.applications.map((application) => (
        <Surface key={application.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{application.organizationName}</h3><StatusBadge value={application.status} /></div>
              <p className="mt-1 text-sm text-[var(--cv-muted)]">{application.type} · {application.contactName} · {application.contactEmail}</p>
              <p className="mt-1 text-xs text-[var(--cv-muted)]">Submitted {application.requestedAt}</p>
              {application.reason && <p className="mt-2 text-sm">Review reason: {application.reason}</p>}
              <Link to={`/workspace/superadmin/applications/${application.id}`} className="mt-3 inline-block text-sm font-semibold text-[var(--cv-primary)] hover:underline">Open application details →</Link>
            </div>
            {application.status === "PENDING" && (
              <div className="flex min-w-56 flex-col gap-2">
                <label className="sr-only" htmlFor={`reject-reason-${application.id}`}>Rejection reason</label>
                <input id={`reject-reason-${application.id}`} value={reasons[application.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [application.id]: event.target.value }))} placeholder="Reason required to reject" className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => review(application, "APPROVED")} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                  <button type="button" onClick={() => review(application, "REJECTED")} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                </div>
              </div>
            )}
          </div>
        </Surface>
      ))}
    </div>
  )
}

function MessageCenter() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  const [channel, setChannel] = useState("general")
  const [query, setQuery] = useState("")
  const [text, setText] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [replyTo, setReplyTo] = useState(null)
  const [message, setMessage] = useState("")
  const messages = data.messages.filter((item) =>
    item.channel === channel && item.text.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const { showToast } = useToast()

  async function send(event) {
    event.preventDefault()
    try {
      await mutate("sendMessage", { organizationId: activeOrganizationId, channel, text, replyTo: replyTo?.id, attachmentUrl })
      setText("")
      setAttachmentUrl("")
      setReplyTo(null)
      setMessage("Demo message sent.")
      showToast("Demo message sent.", "success")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "The message could not be sent."
      setMessage(errorMessage)
      showToast(errorMessage, "error")
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <Surface>
        <h3 className="font-semibold">Channels and direct messages</h3>
        <div className="mt-3 grid gap-2">
          {DEMO_CHANNELS.map((item) => (
            <button key={item} type="button" onClick={() => { setChannel(item); setReplyTo(null); setMessage("") }} className={`rounded-lg px-3 py-2 text-left text-sm ${channel === item ? "bg-[var(--cv-surface-2)] font-semibold text-[var(--cv-primary)]" : "hover:bg-[var(--cv-surface-2)]"}`}>
              {item.startsWith("direct-") ? `Direct · ${item.slice(7)}` : `# ${item}`}
            </button>
          ))}
        </div>
      </Surface>
      <Surface>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{channel.startsWith("direct-") ? `Direct message · ${channel.slice(7)}` : `# ${channel}`}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled title="Voice and video are not connected in demo mode." className="cv-secondary-btn !px-3 !py-2 text-xs opacity-60">Voice / video · Not connected</button>
            <button type="button" disabled title="Screen sharing is not connected in demo mode." className="cv-secondary-btn !px-3 !py-2 text-xs opacity-60">Screen share · Not connected</button>
          </div>
        </div>
        <label className="mt-4 block max-w-sm">
          <span className="sr-only">Search messages</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="cv-input !py-2 text-sm" placeholder="Search this conversation..." />
        </label>
        <div className="my-4 min-h-48 space-y-3">
          {messages.map((item) => (
            <article key={item.id} className="rounded-xl bg-[var(--cv-surface-2)] p-3 text-sm">
              <div className="flex justify-between gap-2"><strong>{item.author}</strong><time className="text-xs text-[var(--cv-muted)]">{item.time}</time></div>
              {item.replyTo && <p className="mt-1 text-xs text-[var(--cv-muted)]">Reply in thread · {item.replyTo}</p>}
              <p className="mt-1">{item.text}</p>
              {item.attachmentUrl && <a className="mt-2 inline-block break-all text-xs font-medium text-[var(--cv-primary)] hover:underline" href={item.attachmentUrl} target="_blank" rel="noreferrer">Open demo attachment ↗</a>}
              <button type="button" onClick={() => setReplyTo(item)} className="mt-2 text-xs font-semibold text-[var(--cv-primary)] hover:underline">Reply in thread</button>
            </article>
          ))}
          {messages.length === 0 && <p className="text-sm text-[var(--cv-muted)]">No messages in this channel yet.</p>}
        </div>
        <form onSubmit={send} className="space-y-2">
          {replyTo && <p className="text-xs text-[var(--cv-muted)]">Replying to {replyTo.author}: {replyTo.text} <button type="button" onClick={() => setReplyTo(null)} className="ml-2 font-semibold text-[var(--cv-primary)]">Cancel reply</button></p>}
          <label htmlFor="workspace-message" className="sr-only">Write a message</label>
          <textarea id="workspace-message" value={text} onChange={(event) => setText(event.target.value)} required rows={3} className="cv-input" placeholder="Write a demo message..." />
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--cv-muted)]">Attachment link (optional; no file upload)</span>
            <input type="url" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} className="cv-input !py-2 text-sm" placeholder="https://example.test/document" />
          </label>
          <button type="submit" className="cv-primary-btn !px-4 !py-2.5 text-sm">Send demo message</button>
          {message && <p role="status" className="text-sm text-[var(--cv-muted)]">{message}</p>}
          <p className="text-xs text-[var(--cv-muted)]">Demo-only messaging. Messages are not sent in real time.</p>
        </form>
      </Surface>
    </div>
  )
}

function OrganizationProfile() {
  const { activeOrganization, activeOrganizationId, mutate } = useWorkspace()
  return (
    <Surface>
      <DemoForm
        fields={[
          { name: "name", label: "Organization name", required: true, defaultValue: activeOrganization?.name },
          { name: "domain", label: "Primary domain", defaultValue: activeOrganization?.domain },
          { name: "type", label: "Organization type", defaultValue: activeOrganization?.type },
        ]}
        submitLabel="Save organization profile"
        onSubmit={(values) => mutate("updateOrganizationDetails", { ...values, organizationId: activeOrganizationId })}
      />
      <p className="mt-4 text-xs text-[var(--cv-muted)]">Changes affect only this in-memory demo and are not submitted to an API.</p>
    </Surface>
  )
}

function Employees({ mode }) {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  const columns = [
    { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "department", label: "Department" }, { key: "team", label: "Team" }, { key: "role", label: "Primary role" }, { key: "roles", label: "All roles", render: (row) => [row.role, ...(row.additionalRoles ?? [])].join(", ") }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
  ]
  if (mode === "access") {
    columns.push({
      key: "actions",
      label: "Demo action",
      sortable: false,
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => mutate("updateEmployee", { employeeId: row.id, role: row.role === "TEAM_LEAD" ? "EMPLOYEE" : "TEAM_LEAD", organizationId: activeOrganizationId })} className="cv-secondary-btn !px-2 !py-1 text-xs">Toggle lead role</button>
          <button type="button" onClick={() => mutate("updateEmployee", { employeeId: row.id, status: row.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED", organizationId: activeOrganizationId })} className="cv-secondary-btn !px-2 !py-1 text-xs">Toggle status</button>
        </div>
      ),
    })
  }
  return <WorkspaceTable title={mode === "access" ? "Role and access controls" : "Employees"} rows={data.employees} columns={columns} />
}

function OrganizationRegistration({ statusOnly = false }) {
  const { data, mutate } = useWorkspace()
  if (statusOnly) {
    return <WorkspaceTable title="Submitted applications" rows={data.applications} columns={[
      { key: "organizationName", label: "Organization" }, { key: "contactName", label: "Contact" }, { key: "requestedAt", label: "Submitted" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }, { key: "reason", label: "Review reason" },
    ]} />
  }
  return (
    <Surface>
      <p className="mb-4 text-sm text-[var(--cv-muted)]">This application is a demo only. It will appear in the Super Admin review queue in this browser session.</p>
      <DemoForm fields={[
        { name: "organizationName", label: "Organization name", required: true },
        { name: "type", label: "Organization type", options: [{ value: "Company", label: "Company" }, { value: "Education", label: "Education" }] },
        { name: "contactName", label: "Contact name", required: true },
        { name: "contactEmail", label: "Contact email", type: "email", required: true },
      ]} submitLabel="Submit demo application" onSubmit={(values) => mutate("submitOrganizationApplication", values)} successText="Application added to the demo approval queue." />
      <Link to="/workspace/organization/application-status" className="mt-4 inline-block text-sm font-medium text-[var(--cv-primary)] hover:underline">View application status →</Link>
    </Surface>
  )
}

function PlatformOrganizationsLive({ onBack }) {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [meta, setMeta] = useState({ page: 0, totalPages: 0, totalElements: 0 })
  const load = async (page = 0, search = query) => {
    setLoading(true); setError("")
    try { const response = await getPlatformOrganizations(search, page, 25); const data = response.data; setRows(data.items ?? []); setMeta(data) }
    catch (e) { setError(e?.response?.data?.message || e.message || "Could not load platform organizations.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load(0, query) }, [])
  const submit = async (e) => {
    e.preventDefault(); if (!name.trim()) return
    setSaving(true); setError("")
    try { await createPlatformOrganization({ name: name.trim(), description: description.trim() }); setName(""); setDescription(""); await load(0, query) }
    catch (e) { setError(e?.response?.data?.message || e.message || "Organization creation failed.") }
    finally { setSaving(false) }
  }
  const changeStatus = async (org, status) => {
    setError(""); try { await updatePlatformOrganizationStatus(org.id, status); await load(meta.page, query) }
    catch (e) { setError(e?.response?.data?.message || e.message || "Status update failed.") }
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="cv-kicker">LIVE BACKEND MODE</p><h3 className="text-lg font-semibold">Persistent platform organizations</h3><p className="text-sm text-[var(--cv-muted)]">This view uses secured Super Admin APIs, not the local demo store.</p></div><button onClick={onBack} type="button" className="cv-secondary-btn !px-3 !py-2 text-sm">Return to demo</button></div>
    <Surface><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Organization name<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={160} className="cv-input mt-1 w-full" placeholder="Organization name" /></label><label className="text-sm">Description<input value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} className="cv-input mt-1 w-full" placeholder="Optional description" /></label><div className="sm:col-span-2"><button disabled={saving} className="cv-primary-btn !px-4 !py-2 text-sm">{saving ? "Creating…" : "Create organization (pending)"}</button></div></form></Surface>
    <Surface><div className="flex flex-wrap gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} className="cv-input min-w-0 flex-1" placeholder="Search name or slug"/><button type="button" onClick={()=>load(0,query)} className="cv-secondary-btn !px-3 !py-2 text-sm">Search</button></div>{error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}{loading ? <p className="py-8 text-center text-sm text-[var(--cv-muted)]">Loading organization data…</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-[var(--cv-border)] text-left"><th className="py-2">Organization</th><th>Slug</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>{rows.map(org=><tr key={org.id} className="border-b border-[var(--cv-border)]/60"><td className="py-3 font-medium">{org.name}<p className="text-xs text-[var(--cv-muted)]">{org.description}</p></td><td>{org.slug}</td><td><StatusBadge value={org.status}/></td><td className="text-xs">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}</td><td><select value={org.status} onChange={e=>changeStatus(org,e.target.value)} className="cv-input max-w-[150px] text-xs"><option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="REJECTED">Rejected</option></select></td></tr>)}</tbody></table>{rows.length===0 && <p className="py-6 text-center text-sm text-[var(--cv-muted)]">No organizations found.</p>}</div>}<div className="mt-4 flex items-center justify-between text-sm"><span>{meta.totalElements ?? 0} organizations</span><div className="flex gap-2"><button disabled={loading || meta.page<=0} onClick={()=>load(meta.page-1)} className="cv-secondary-btn !px-3 !py-1">Previous</button><span className="self-center">Page {(meta.page??0)+1} / {Math.max(1,meta.totalPages??0)}</span><button disabled={loading || (meta.page??0)+1>=(meta.totalPages??0)} onClick={()=>load(meta.page+1)} className="cv-secondary-btn !px-3 !py-1">Next</button></div></div></Surface>
  </div>
}


function OrganizationDirectory({ suspended = false, routeParts = [] }) {
  const [liveMode, setLiveMode] = useState(false)
  const { data, mutate } = useWorkspace()
  if (liveMode && !suspended) return <PlatformOrganizationsLive onBack={() => setLiveMode(false)} />
  const rows = data.organizations.filter((organization) =>
    suspended ? organization.status === "SUSPENDED" : organization.status === "ACTIVE",
  )
  const selectedOrganization = routeParts[0]
    ? data.organizations.find((organization) => organization.id === routeParts[0] && (suspended ? organization.status === "SUSPENDED" : organization.status === "ACTIVE"))
    : null
  if (routeParts.length > 0) {
    if (!selectedOrganization) return <Surface><p className="text-sm text-[var(--cv-muted)]">Organization not found in this directory.</p><Link to={`/workspace/superadmin/${suspended ? "suspended" : "organizations"}`} className="cv-secondary-btn mt-4 !py-2">Back to organizations</Link></Surface>
    return (
      <Surface>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="cv-kicker">PLATFORM ORGANIZATION</p><h3 className="mt-1 text-xl font-bold">{selectedOrganization.name}</h3></div>
          <StatusBadge value={selectedOrganization.status} />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-[var(--cv-muted)]">Type</dt><dd className="mt-1">{selectedOrganization.type}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Domain</dt><dd className="mt-1">{selectedOrganization.domain || "Not provided"}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Employees</dt><dd className="mt-1">{selectedOrganization.employees}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Students</dt><dd className="mt-1">{selectedOrganization.students}</dd></div>
        </dl>
        <section className="mt-5 rounded-xl bg-[var(--cv-surface-2)] p-4">
          <h4 className="font-semibold">Recent organization activity</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {data.auditEvents.filter((event) => event.orgId === selectedOrganization.id).slice(0, 5).map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-2"><span>{event.action} · {event.target}</span><time className="text-xs text-[var(--cv-muted)]">{event.date}</time></li>)}
            {data.auditEvents.filter((event) => event.orgId === selectedOrganization.id).length === 0 && <li className="text-[var(--cv-muted)]">No organization-specific demo events are available.</li>}
          </ul>
        </section>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => mutate("updateOrganizationStatus", selectedOrganization.id, suspended ? "ACTIVE" : "SUSPENDED")} className="cv-primary-btn !px-4 !py-2.5 text-sm">{suspended ? "Restore demo organization" : "Suspend demo organization"}</button>
          <Link to={`/workspace/superadmin/${suspended ? "suspended" : "organizations"}`} className="cv-secondary-btn !px-4 !py-2.5 text-sm">Back</Link>
        </div>
        <p className="mt-4 text-xs text-[var(--cv-muted)]">Status changes affect only the in-memory platform demo.</p>
      </Surface>
    )
  }
  const columns = [
    { key: "name", label: "Organization" }, { key: "type", label: "Type" }, { key: "domain", label: "Domain" }, { key: "employees", label: "Employees" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "action", label: "Action", sortable: false, render: (row) => (
      <div className="flex flex-wrap gap-2">
        <Link to={`/workspace/superadmin/${suspended ? "suspended" : "organizations"}/${row.id}`} className="cv-secondary-btn !px-2 !py-1 text-xs">Details</Link>
        <button type="button" onClick={() => mutate("updateOrganizationStatus", row.id, suspended ? "ACTIVE" : "SUSPENDED")} className="rounded border border-[var(--cv-border)] px-2 py-1 text-xs">
          {suspended ? "Restore demo organization" : "Suspend demo organization"}
        </button>
      </div>
    ) },
  ]
  return (
    <div className="space-y-5">
      {!suspended && <Surface><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="cv-kicker">API INTEGRATION</p><p className="text-sm text-[var(--cv-muted)]">Switch to the persistent backend organization directory.</p></div><button type="button" onClick={() => setLiveMode(true)} className="cv-primary-btn !px-4 !py-2 text-sm">Open live organization management</button></div></Surface>}
      <WorkspaceTable title={suspended ? "Suspended organizations" : "Active organizations"} rows={rows} columns={columns} />
    </div>
  )
}


const PLATFORM_ROLES = ["STUDENT", "TRAINER", "EMPLOYEE", "TEAM_LEAD", "ORG_ADMIN", "SUPER_ADMIN"]

function PlatformRoleAssignment({ users, initialUserId, mutate }) {
  const [userId, setUserId] = useState(initialUserId ?? users[0]?.id ?? "")
  const selectedUser = users.find((item) => item.id === userId)
  const [roles, setRoles] = useState(selectedUser?.roles ?? [])
  const [message, setMessage] = useState("")

  function chooseUser(nextId) {
    const user = users.find((item) => item.id === nextId)
    setUserId(nextId)
    setRoles(user?.roles ?? [])
    setMessage("")
  }

  async function saveRoles(event) {
    event.preventDefault()
    try {
      await mutate("updatePlatformUserRoles", userId, roles)
      setMessage("Demo roles updated for this platform user.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The roles could not be updated.")
    }
  }

  if (!selectedUser) return null
  return (
    <form onSubmit={saveRoles} className="mt-5 rounded-xl border border-[var(--cv-border)] p-4">
      <h4 className="font-semibold">Assign platform roles</h4>
      {users.length > 1 && (
        <label className="mt-3 block max-w-lg text-sm">
          <span className="mb-1 block text-xs text-[var(--cv-muted)]">Platform user</span>
          <select value={userId} onChange={(event) => chooseUser(event.target.value)} className="cv-input !py-2">
            {users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.accountType}</option>)}
          </select>
        </label>
      )}
      <fieldset className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="sr-only">Select platform roles</legend>
        {PLATFORM_ROLES.map((role) => (
          <label key={role} className="flex items-center gap-2 rounded-lg bg-[var(--cv-surface-2)] px-3 py-2 text-sm">
            <input type="checkbox" checked={roles.includes(role)} onChange={(event) => setRoles((current) => event.target.checked ? [...current, role] : current.filter((item) => item !== role))} />
            {role.replaceAll("_", " ")}
          </label>
        ))}
      </fieldset>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="cv-primary-btn !px-4 !py-2 text-sm">Save demo roles</button>
        {message && <p role="status" className="text-sm text-[var(--cv-muted)]">{message}</p>}
      </div>
      <p className="mt-2 text-xs text-[var(--cv-muted)]">Role edits are local demo state and do not grant real platform permissions.</p>
    </form>
  )
}

function PlatformRoles() {
  const { data, mutate } = useWorkspace()
  const users = [
    ...data.employees.map((item) => ({ ...item, roles: [item.role, ...(item.additionalRoles ?? [])], accountType: "Employee" })),
    ...data.students.map((item) => ({ ...item, email: `${item.id}@demo.example.test`, roles: item.roles ?? ["STUDENT"], accountType: "Student" })),
  ]
  return (
    <div className="space-y-5">
      <WorkspaceTable title="Platform role catalog" rows={data.rolePermissions} columns={[
        { key: "name", label: "Role" }, { key: "scope", label: "Scope" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      ]} />
      <Surface>
        <PlatformRoleAssignment users={users} mutate={mutate} />
      </Surface>
    </div>
  )
}

function PlatformUsers({ routeParts = [] }) {
  const { data, mutate, activePortal } = useWorkspace()
  const isSuperadmin = activePortal === "superadmin"
  const users = isSuperadmin
    ? [
        ...data.employees.map((item) => ({ ...item, roles: [item.role, ...(item.additionalRoles ?? [])], accountType: "Employee" })),
        ...data.students.map((item) => ({ ...item, email: `${item.id}@demo.example.test`, role: (item.roles ?? ["STUDENT"])[0], roles: item.roles ?? ["STUDENT"], accountType: "Student" })),
      ]
    : [
        ...data.employees
          .filter((item) => item.orgId === data.activeOrganizationId)
          .map((item) => ({ ...item, roles: [item.role, ...(item.additionalRoles ?? [])], accountType: "Employee" })),
        ...data.students
          .filter((item) => item.orgId === data.activeOrganizationId)
          .map((item) => ({ ...item, email: `${item.id}@demo.example.test`, role: (item.roles ?? ["STUDENT"])[0], roles: item.roles ?? ["STUDENT"], accountType: "Student" })),
      ]
  // Super Admin user listing must show all platform users, not just the active organization's users.
  const filteredUsers = useWorkspace().portal === "superadmin"
    ? [
        ...data.employees.map((item) => ({ ...item, roles: [item.role, ...(item.additionalRoles ?? [])], accountType: "Employee" })),
        ...data.students.map((item) => ({ ...item, email: `${item.id}@demo.example.test`, role: (item.roles ?? ["STUDENT"])[0], roles: item.roles ?? ["STUDENT"], accountType: "Student" })),
      ]
    : users
  const selectedUser = routeParts[0] ? filteredUsers.find((item) => item.id === routeParts[0]) : null
  if (routeParts.length > 0) {
    if (!selectedUser) return <Surface><p className="text-sm text-[var(--cv-muted)]">Platform user not found.</p><Link to="/workspace/superadmin/users" className="cv-secondary-btn mt-4 !py-2">Back to users</Link></Surface>
    return (
      <Surface>
        <p className="cv-kicker">PLATFORM USER</p>
        <h3 className="mt-1 text-xl font-bold">{selectedUser.name}</h3>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-[var(--cv-muted)]">Email</dt><dd className="mt-1">{selectedUser.email}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Account type</dt><dd className="mt-1">{selectedUser.accountType}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Roles</dt><dd className="mt-1">{selectedUser.roles.join(", ")}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Status</dt><dd className="mt-1"><StatusBadge value={selectedUser.status} /></dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Organization</dt><dd className="mt-1">{data.organizations.find((item) => item.id === selectedUser.orgId)?.name ?? "Independent"}</dd></div>
        </dl>
        <button type="button" onClick={() => mutate("updatePlatformUserStatus", selectedUser.id, selectedUser.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")} className="cv-primary-btn mt-5 !px-4 !py-2.5 text-sm">
          {selectedUser.status === "SUSPENDED" ? "Restore demo user" : "Suspend demo user"}
        </button>
        <PlatformRoleAssignment key={selectedUser.id} users={[selectedUser]} initialUserId={selectedUser.id} mutate={mutate} />
        <Link to="/workspace/superadmin/users" className="cv-secondary-btn ml-2 mt-5 !px-4 !py-2.5 text-sm">Back</Link>
        <p className="mt-4 text-xs text-[var(--cv-muted)]">Role and account changes shown here are demo-only. Backend authorization is not implemented by this frontend.</p>
      </Surface>
    )
  }
  return (
    <WorkspaceTable title="Platform users" rows={users} columns={[
      { key: "name", label: "User" },
      { key: "email", label: "Email" },
      { key: "accountType", label: "Type" },
      { key: "roles", label: "Roles" },
      { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      { key: "actions", label: "Details", sortable: false, render: (row) => <Link to={`/workspace/superadmin/users/${row.id}`} className="font-semibold text-[var(--cv-primary)] hover:underline">Open</Link> },
    ]} />
  )
}

function Reports({ portal }) {
  const { data } = useWorkspace()
  const bars = portal === "superadmin"
    ? [["Active organizations", data.organizations.filter((org) => org.status === "ACTIVE").length], ["Pending applications", data.applications.filter((app) => app.status === "PENDING").length], ["Platform users", data.employees.length + data.students.length]]
    : [["Tasks completed", data.tasks.filter((task) => task.status === "COMPLETED").length], ["Active projects", data.projects.filter((project) => project.status !== "COMPLETED").length], ["Learners", data.students.length]]
  const max = Math.max(1, ...bars.map(([, value]) => Number(value)))
  return (
    <Surface>
      <h3 className="font-semibold">Workspace activity</h3>
      <div className="mt-5 space-y-5">
        {bars.map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div>
            <div className="h-3 rounded-full bg-[var(--cv-surface-2)]" role="progressbar" aria-label={label} aria-valuenow={Number(value)} aria-valuemin={0} aria-valuemax={max}>
              <div className="h-full rounded-full bg-[var(--cv-primary)]" style={{ width: `${Math.max(4, Number(value) / max * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-[var(--cv-muted)]">Illustrative demo metrics, not production analytics.</p>
    </Surface>
  )
}

function Attendance({ data, portal }) {
  const { activeOrganizationId, mutate } = useWorkspace()
  const [message, setMessage] = useState("")
  const today = new Date().toISOString().slice(0, 10)
  const people = portal === "trainer" ? data.students : data.attendance
  const rows = portal === "trainer"
    ? people.map((person) => {
      const attendance = data.attendance.find((entry) => entry.studentId === person.id && entry.date === today)
      return {
        id: person.id,
        employee: person.name,
        team: person.cohort,
        date: today,
        checkIn: attendance?.checkIn || "—",
        checkOut: attendance?.checkOut || "—",
        status: attendance?.status ?? (person.status === "ACTIVE" ? "PRESENT" : "ABSENT"),
      }
    })
    : people
  const ownAttendance = rows.find((row) => row.employee === "Demo User" && row.date === today)

  async function recordAttendance(operation) {
    try {
      await mutate(operation, activeOrganizationId)
      setMessage(operation === "checkIn" ? "Checked in in demo mode." : "Checked out in demo mode.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attendance action could not be completed.")
    }
  }

  async function updateStudentAttendance(studentId, status) {
    try {
      await mutate("markStudentAttendance", activeOrganizationId, studentId, status)
      setMessage("Learner attendance updated in demo mode.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attendance record could not be updated.")
    }
  }

  return (
    <div className="space-y-5">
      {portal === "trainer" && message && <p role="status" className="text-sm text-[var(--cv-muted)]">{message}</p>}
      {portal === "employee" && (
        <Surface>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Today&apos;s attendance</h3>
              <p className="mt-1 text-sm text-[var(--cv-muted)]">Check-in and check-out are demo-only and are not sent to an attendance system.</p>
            </div>
            {!ownAttendance
              ? <button type="button" onClick={() => recordAttendance("checkIn")} className="cv-primary-btn !py-2.5">Check in</button>
              : !ownAttendance.checkOut
                ? <button type="button" onClick={() => recordAttendance("checkOut")} className="cv-primary-btn !py-2.5">Check out</button>
                : <StatusBadge value="COMPLETED" />}
          </div>
          {message && <p role="status" className="mt-3 text-sm text-[var(--cv-muted)]">{message}</p>}
        </Surface>
      )}
      <WorkspaceTable title={portal === "trainer" ? "Learner attendance overview" : "Attendance overview"} rows={rows} columns={[
        { key: "employee", label: "Name" }, { key: "team", label: "Team" }, { key: "date", label: "Date" }, { key: "checkIn", label: "Check in" }, { key: "checkOut", label: "Check out" },
        { key: "status", label: "Status", render: (row) => portal === "trainer"
          ? <select aria-label={`Attendance for ${row.employee}`} value={row.status} onChange={(event) => updateStudentAttendance(row.id, event.target.value)} className="cv-input !py-1.5 text-xs">{["PRESENT", "ABSENT", "LATE"].map((status) => <option key={status} value={status}>{status}</option>)}</select>
          : <StatusBadge value={row.status} /> },
      ]} />
    </div>
  )
}

function AttendanceHistory({ data }) {
  const latestAttendanceMonth = data.attendance.map((entry) => entry.date).filter(Boolean).sort().slice(-1)[0]?.slice(0, 7)
  const [month, setMonth] = useState(latestAttendanceMonth || new Date().toISOString().slice(0, 7))
  const rows = data.attendance.filter((entry) => entry.date?.startsWith(month))
  const present = rows.filter((entry) => entry.status === "PRESENT").length
  const absent = rows.filter((entry) => entry.status === "ABSENT").length

  return (
    <div className="space-y-5">
      <Surface>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-semibold">Monthly attendance history</h3>
            <p className="mt-1 text-sm text-[var(--cv-muted)]">Filter records by month for the active organization.</p>
          </div>
          <label className="w-full max-w-48 text-sm">
            <span className="mb-1 block text-xs text-[var(--cv-muted)]">Month</span>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="cv-input !py-2" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[["Records", rows.length], ["Present", present], ["Absent", absent]].map(([label, count]) => <div key={label} className="rounded-xl bg-[var(--cv-surface-2)] p-3"><p className="text-xs text-[var(--cv-muted)]">{label}</p><p className="mt-1 text-xl font-bold">{count}</p></div>)}
        </div>
      </Surface>
      <WorkspaceTable title="Filtered attendance records" rows={rows} columns={[
        { key: "date", label: "Date" }, { key: "employee", label: "Employee" }, { key: "checkIn", label: "Check in" }, { key: "checkOut", label: "Check out" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      ]} emptyMessage="No attendance records for this month." />
    </div>
  )
}

function LeaveBalanceSummary({ data }) {
  const balances = data.leaveBalances.filter((item) => item.employee === "Demo User")
  const totalAvailable = balances.reduce((sum, item) => sum + Number(item.available || 0), 0)
  const totalUsed = balances.reduce((sum, item) => sum + Number(item.used || 0), 0)
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="font-semibold">Your demo leave balance</h3>
        <p className="mt-1 text-sm text-[var(--cv-muted)]">Illustrative values only; no HR or payroll system is connected.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--cv-surface-2)] p-4"><p className="text-xs text-[var(--cv-muted)]">Available days</p><p className="mt-1 text-2xl font-bold">{totalAvailable}</p></div>
          <div className="rounded-xl bg-[var(--cv-surface-2)] p-4"><p className="text-xs text-[var(--cv-muted)]">Used days</p><p className="mt-1 text-2xl font-bold">{totalUsed}</p></div>
        </div>
      </Surface>
      <WorkspaceTable title="Balances by leave category" rows={balances} columns={[
        { key: "category", label: "Category" }, { key: "available", label: "Available days" }, { key: "used", label: "Used days" },
      ]} emptyMessage="No leave balance details are available for this demo user." />
    </div>
  )
}

function TimesheetSummary({ rows }) {
  const today = new Date()
  const weekday = today.getUTCDay()
  const weekStart = new Date(today)
  weekStart.setUTCDate(today.getUTCDate() - ((weekday + 6) % 7))
  const start = weekStart.toISOString().slice(0, 10)
  const currentWeek = rows.filter((item) => item.date >= start && item.date <= today.toISOString().slice(0, 10))
  const hours = currentWeek.reduce((sum, item) => sum + Number(item.hours || 0), 0)
  const submitted = currentWeek.filter((item) => item.status === "SUBMITTED").length
  return (
    <Surface>
      <h3 className="font-semibold">This week&apos;s work summary</h3>
      <p className="mt-1 text-sm text-[var(--cv-muted)]">Week starting {start} · demo work logs only.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[["Hours logged", hours], ["Work log entries", currentWeek.length], ["Submitted entries", submitted]].map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--cv-surface-2)] p-3"><p className="text-xs text-[var(--cv-muted)]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}
      </div>
    </Surface>
  )
}

function WorkLogs() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Log work hours</h3>
        <DemoForm fields={[
          { name: "project", label: "Project" },
          { name: "hours", label: "Hours", type: "number", min: "0.25", max: "24", required: true },
          { name: "note", label: "Work summary", multiline: true, wide: true },
        ]} onSubmit={(values) => mutate("createWorkLog", { ...values, organizationId: activeOrganizationId })} submitLabel="Add demo work log" />
      </Surface>
      <WorkspaceTable title="Recent work logs" rows={data.workLogs} columns={[
        { key: "date", label: "Date" }, { key: "project", label: "Project" }, { key: "hours", label: "Hours" }, { key: "note", label: "Summary" }, { key: "status", label: "Status" },
      ]} />
    </div>
  )
}

function LeaveRequests() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Request leave</h3>
        <DemoForm fields={[
          { name: "startDate", label: "Start date", type: "date", required: true },
          { name: "endDate", label: "End date", type: "date", required: true },
          { name: "reason", label: "Reason", multiline: true, wide: true, required: true },
        ]} onSubmit={(values) => mutate("createLeaveRequest", { ...values, organizationId: activeOrganizationId })} submitLabel="Submit demo request" />
      </Surface>
      <WorkspaceTable title="My requests" rows={data.leaveRequests} columns={[
        { key: "startDate", label: "From" }, { key: "endDate", label: "To" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
      ]} />
    </div>
  )
}

function Announcements({ data, organizationId, mutate }) {
  return (
    <div className="space-y-5">
      {["organization", "trainer"].includes(useWorkspace().activePortal) && (
        <Surface>
          <h3 className="mb-4 font-semibold">Publish an announcement</h3>
          <DemoForm fields={[{ name: "title", label: "Announcement", required: true, wide: true }, { name: "audience", label: "Audience", placeholder: "Everyone" }]} onSubmit={(values) => mutate("createAnnouncement", { ...values, organizationId })} submitLabel="Publish demo announcement" />
        </Surface>
      )}
      <WorkspaceTable title="Recent announcements" rows={data.announcements} columns={[
        { key: "title", label: "Announcement" }, { key: "audience", label: "Audience" }, { key: "author", label: "Author" }, { key: "date", label: "Date" },
      ]} />
    </div>
  )
}

function WorkspaceProfile() {
  const { activePortal, data, demoUser, mutate } = useWorkspace()
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="font-semibold">Demo profile</h3>
        <p className="mt-1 text-sm text-[var(--cv-muted)]">Edits are kept in memory and do not update your authenticated account.</p>
        <div className="mt-5">
          <DemoForm
            fields={[
              { name: "displayName", label: "Display name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
            ]}
            initialValues={data.profile}
            onSubmit={(values) => mutate("updateProfile", values)}
            submitLabel="Save demo profile"
          />
        </div>
      </Surface>
      <Surface>
        <h3 className="font-semibold">Workspace access</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-[var(--cv-muted)]">Active portal</dt><dd className="mt-1">{PORTALS[activePortal].label}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Demo roles</dt><dd className="mt-1">{demoUser.roles.join(", ")}</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Preferences</dt><dd className="mt-1">Theme is managed by the workspace theme toggle.</dd></div>
          <div><dt className="text-xs text-[var(--cv-muted)]">Membership</dt><dd className="mt-1">Use the header controls to switch organization or student mode.</dd></div>
        </dl>
      </Surface>
    </div>
  )
}

function Teams({ data, organizationId, mutate }) {
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Create a team</h3>
        <DemoForm fields={[
          { name: "name", label: "Team name", required: true },
          { name: "department", label: "Department" },
          { name: "lead", label: "Team lead" },
        ]} onSubmit={(values) => mutate("createTeam", { ...values, organizationId })} submitLabel="Create demo team" />
      </Surface>
      <WorkspaceTable title="Teams" rows={data.teams} columns={[
        { key: "name", label: "Team" }, { key: "department", label: "Department" }, { key: "lead", label: "Lead" }, { key: "members", label: "Members" },
      ]} />
    </div>
  )
}

function GitHubPreview({ data }) {
  const { activeOrganizationId, mutate } = useWorkspace()
  const [connected, setConnected] = useState(false)
  const [selectedRepositoryId, setSelectedRepositoryId] = useState(data.repositories[0]?.id ?? "")
  const [selectedBranch, setSelectedBranch] = useState("")
  const firstRepositoryId = data.repositories[0]?.id ?? ""
  const [message, setMessage] = useState("")
  const repository = data.repositories.find((item) => item.id === selectedRepositoryId) ?? data.repositories[0]
  const activity = data.repositoryActivity.find((item) => item.repositoryId === repository?.id)
  const branch = selectedBranch || activity?.branches[0] || ""

  useEffect(() => {
    setSelectedRepositoryId(firstRepositoryId)
    setSelectedBranch("")
  }, [activeOrganizationId, firstRepositoryId])

  async function updateIssue(issue, status) {
    try {
      await mutate("updateDemoIssue", repository.id, issue.id, status, activeOrganizationId)
      setMessage(`Demo issue #${issue.number} marked ${status.toLowerCase()}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The demo issue could not be updated.")
    }
  }

  async function updatePullRequest(pullRequest, status) {
    try {
      await mutate("updateDemoPullRequest", repository.id, pullRequest.id, status, activeOrganizationId)
      setMessage(`Demo pull request #${pullRequest.number} marked ${status.toLowerCase()}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The demo pull request could not be updated.")
    }
  }

  return (
    <div className="space-y-5">
      <Surface>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h3 className="font-semibold">GitHub developer integration</h3><p className="mt-2 max-w-2xl text-sm text-[var(--cv-muted)]">This preview shows where repository connections, pull request activity, and developer access controls will live. It does not initiate OAuth or request credentials.</p></div>
        <button type="button" onClick={() => setConnected((value) => !value)} className="rounded-lg border border-[var(--cv-border)] px-4 py-2 text-sm font-semibold">{connected ? "Disconnect demo view" : "Preview connection"}</button>
      </div>
      {connected && <p role="status" className="mt-4 rounded-lg bg-[var(--cv-surface-2)] p-3 text-sm">Demo preview enabled. No GitHub account is connected.</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="mb-1 block text-xs text-[var(--cv-muted)]">Demo repository</span><select value={repository?.id ?? ""} onChange={(event) => { setSelectedRepositoryId(event.target.value); setSelectedBranch("") }} className="cv-input !py-2">{data.repositories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm"><span className="mb-1 block text-xs text-[var(--cv-muted)]">Branch</span><select value={branch} onChange={(event) => setSelectedBranch(event.target.value)} className="cv-input !py-2">{(activity?.branches ?? []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        {message && <p role="status" className="mt-3 text-sm text-[var(--cv-muted)]">{message}</p>}
      </Surface>
      {repository && activity ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Surface>
            <h3 className="font-semibold">Recent commits · {branch}</h3>
            <ul className="mt-3 space-y-3 text-sm">{activity.commits.map((commit) => <li key={commit.id} className="border-b border-[var(--cv-border)] pb-3 last:border-0"><p className="font-medium">{commit.message}</p><p className="mt-1 text-xs text-[var(--cv-muted)]">{commit.hash} · {commit.author} · {commit.date}</p></li>)}</ul>
          </Surface>
          <Surface>
            <h3 className="font-semibold">Issues</h3>
            <ul className="mt-3 space-y-3 text-sm">{activity.issues.map((issue) => <li key={issue.id} className="border-b border-[var(--cv-border)] pb-3 last:border-0"><p className="font-medium">#{issue.number} {issue.title}</p><p className="mt-1 text-xs text-[var(--cv-muted)]">Assigned to {issue.assignee} · {issue.status}</p><button type="button" onClick={() => updateIssue(issue, issue.status === "OPEN" ? "CLOSED" : "OPEN")} className="mt-2 text-xs font-semibold text-[var(--cv-primary)] hover:underline">{issue.status === "OPEN" ? "Close demo issue" : "Reopen demo issue"}</button></li>)}</ul>
          </Surface>
          <Surface>
            <h3 className="font-semibold">Pull requests</h3>
            <ul className="mt-3 space-y-3 text-sm">{activity.pullRequests.map((pullRequest) => <li key={pullRequest.id} className="border-b border-[var(--cv-border)] pb-3 last:border-0"><p className="font-medium">#{pullRequest.number} {pullRequest.title}</p><p className="mt-1 text-xs text-[var(--cv-muted)]">{pullRequest.branch} · by {pullRequest.author} · {pullRequest.status}</p><div className="mt-2 flex flex-wrap gap-3">{pullRequest.status !== "REVIEW" && <button type="button" onClick={() => updatePullRequest(pullRequest, "REVIEW")} className="text-xs font-semibold text-[var(--cv-primary)] hover:underline">Request demo review</button>}{pullRequest.status !== "MERGED" && <button type="button" onClick={() => updatePullRequest(pullRequest, "MERGED")} className="text-xs font-semibold text-[var(--cv-primary)] hover:underline">Mark demo merged</button>}</div></li>)}</ul>
          </Surface>
        </div>
      ) : <Surface><p className="text-sm text-[var(--cv-muted)]">No repositories are available for the active organization.</p></Surface>}
      <WorkspaceTable title="Demo repositories" rows={data.repositories} columns={[
        { key: "name", label: "Repository" }, { key: "provider", label: "Provider" }, { key: "branch", label: "Default branch" }, { key: "visibility", label: "Visibility" }, { key: "status", label: "Integration" },
      ]} emptyMessage="No demo repositories are available for this organization." />
      <p className="text-xs text-[var(--cv-muted)]">No OAuth, tokens, GitHub API calls, or source-code access occur in this demo. All branches, commits, issues, and pull requests are mock data.</p>
    </div>
  )
}

function SimpleAccessRoles() {
  const { activeOrganizationId, data, mutate } = useWorkspace()
  const roles = [["EMPLOYEE", "Employee"], ["TEAM_LEAD", "Team lead"], ["ORG_ADMIN", "Org admin"]]
  return (
    <Surface>
      <h3 className="font-semibold">Role capability examples</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead><tr className="border-b border-[var(--cv-border)]"><th className="py-3">Capability</th>{roles.map(([, label]) => <th key={label} className="py-3">{label}</th>)}</tr></thead>
          <tbody>{data.organizationPermissions.map((permission) => (
            <tr key={permission.id} className="border-b border-[var(--cv-border)] last:border-0">
              <th scope="row" className="py-3 font-medium">{permission.name}</th>
              {roles.map(([role, label]) => (
                <td key={role} className="py-3">
                  <input
                    type="checkbox"
                    aria-label={`${label} permission: ${permission.name}`}
                    checked={Boolean(permission.permissions[role])}
                    onChange={(event) => mutate("updateRolePermission", permission.id, role, event.target.checked, activeOrganizationId)}
                  />
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--cv-muted)]">These organization-scoped demo switches persist in memory only. Actual permission enforcement must be implemented by the backend.</p>
    </Surface>
  )
}

function PlatformConfiguration() {
  const { data, mutate } = useWorkspace()
  const [message, setMessage] = useState("")
  const settings = data.platformConfiguration
  const [draft, setDraft] = useState(settings)

  useEffect(() => setDraft(settings), [settings])

  async function save(event) {
    event.preventDefault()
    try {
      await mutate("updatePlatformConfiguration", draft)
      setMessage("Demo platform setting updated in memory.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The setting could not be updated.")
    }
  }

  return (
    <Surface>
      <h3 className="font-semibold">Platform demo policies</h3>
      <form onSubmit={save} className="mt-4 grid gap-4 sm:max-w-xl">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--cv-border)] p-3">Require approval for organization registration<input type="checkbox" checked={draft.approvalRequired} onChange={(event) => setDraft((current) => ({ ...current, approvalRequired: event.target.checked }))} /></label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--cv-border)] p-3">Allow organization invitations<input type="checkbox" checked={draft.invitationsEnabled} onChange={(event) => setDraft((current) => ({ ...current, invitationsEnabled: event.target.checked }))} /></label>
        <label>Audit retention (days)<input type="number" min="1" max="3650" value={draft.auditRetention} onChange={(event) => setDraft((current) => ({ ...current, auditRetention: event.target.value }))} className="cv-input mt-1 !py-2" /></label>
        <button type="submit" className="cv-primary-btn w-fit !px-4 !py-2.5 text-sm">Save platform settings</button>
      </form>
      <p role="status" className="mt-3 text-xs text-[var(--cv-muted)]">{message || "Settings persist only in this browser session; no platform configuration is sent to a server."}</p>
    </Surface>
  )
}

function DeveloperWorkspace({ data }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.projects.map((project) => (
        <Surface key={project.id}>
          <div className="flex items-center justify-between gap-3"><Link to={`/workspace/employee/projects/${project.id}`} className="font-semibold text-[var(--cv-primary)] hover:underline">{project.name}</Link><StatusBadge value={project.status} /></div>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">Owner: {project.owner} · Due {project.dueDate}</p>
          <div className="mt-4 h-2 rounded-full bg-[var(--cv-surface-2)]"><div className="h-full rounded-full bg-[var(--cv-primary)]" style={{ width: `${project.progress}%` }} /></div>
          <p className="mt-2 text-xs text-[var(--cv-muted)]">{project.progress}% project progress</p>
        </Surface>
      ))}
      <Surface className="md:col-span-2">
        <h3 className="font-semibold">Developer tools</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["Task board", "/workspace/employee/tasks"], ["Shared documents", "/workspace/employee/documents"], ["GitHub integration", "/workspace/employee/github"]].map(([label, path]) => (
            <Link key={label} to={path} className="cv-secondary-btn !px-3 !py-2 text-sm">{label}</Link>
          ))}
        </div>
      </Surface>
    </div>
  )
}

function MeetingRoomPreview({ meeting }) {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <div className="mt-5 rounded-xl border border-[var(--cv-border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">Meeting room preview</h4>
          <p className="mt-1 text-sm text-[var(--cv-muted)]">{meeting.date} at {meeting.time} · {meeting.type}</p>
        </div>
        <StatusBadge value={meeting.status} />
      </div>
      <div className="mt-4 grid min-h-32 place-items-center rounded-xl bg-slate-950 p-4 text-center text-sm text-white">
        <div><p className="font-semibold">{meeting.title}</p><p className="mt-1 text-slate-300">Preview only — no camera, microphone, or call is connected.</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={microphoneEnabled} onClick={() => { setMicrophoneEnabled((enabled) => !enabled); setMessage("Microphone control changed in the local preview only.") }} className="cv-secondary-btn !px-3 !py-2 text-sm">{microphoneEnabled ? "Mute preview" : "Unmute preview"}</button>
        <button type="button" aria-pressed={cameraEnabled} onClick={() => { setCameraEnabled((enabled) => !enabled); setMessage("Camera control changed in the local preview only.") }} className="cv-secondary-btn !px-3 !py-2 text-sm">{cameraEnabled ? "Turn camera off" : "Turn camera on"}</button>
        <button type="button" disabled title="Screen sharing requires a future meeting integration." className="cv-secondary-btn !px-3 !py-2 text-sm opacity-60">Share screen · Not connected</button>
      </div>
      {message && <p role="status" className="mt-2 text-xs text-[var(--cv-muted)]">{message}</p>}
      {meeting.agenda && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Agenda:</strong> {meeting.agenda}</p>}
    </div>
  )
}

function ResourcePage({ portal, screen, routeParts, data, organizationId, mutate }) {
  const navigate = useNavigate()
  const { studentMode } = useWorkspace()
  const config = RESOURCE_PAGES[portal][screen]
  const basePath = `/workspace/${portal}/${screen}`
  const [recordId, action] = routeParts
  const creating = recordId === "new"
  const editing = action === "edit"
  const allRecords = data[config.resource] ?? []
  const records = portal === "employee" && screen === "projects"
    ? allRecords.filter((item) => item.owner === "Demo User" || String(item.members ?? "").split(",").map((name) => name.trim()).includes("Demo User"))
    : allRecords
  const record = recordId && !creating ? records.find((item) => item.id === recordId) : null
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [operationError, setOperationError] = useState("")
  const [operationMessage, setOperationMessage] = useState("")
  const [taskComment, setTaskComment] = useState("")
  const [reviewReason, setReviewReason] = useState("")

  if ((creating && !config.allowCreate) || (editing && !config.allowUpdate)) {
    return (
      <Surface>
        <h3 className="font-semibold">Action unavailable</h3>
        <p className="mt-2 text-sm text-[var(--cv-muted)]">This demo page does not allow that operation.</p>
        <Link to={basePath} className="cv-secondary-btn mt-4 !py-2.5">Back to {config.title}</Link>
      </Surface>
    )
  }

  if (recordId && !creating && !record) {
    return (
      <Surface>
        <h3 className="font-semibold">Record not found</h3>
        <p className="mt-2 text-sm text-[var(--cv-muted)]">This record may not belong to the active organization.</p>
        <Link to={basePath} className="cv-secondary-btn mt-4 !py-2.5">Back to {config.title}</Link>
      </Surface>
    )
  }

  async function save(values) {
    setOperationError("")
    if (creating) {
      await mutate("createResource", config.resource, organizationId, values)
      return
    }
    if (portal === "superadmin" && config.resource === "supportRequests") {
      await mutate("updatePlatformSupportRequest", record.id, values)
    } else {
      await mutate("updateResource", config.resource, record.id, organizationId, values)
    }
    navigate(basePath)
  }

  async function removeRecord() {
    try {
      await mutate("deleteResource", config.resource, record.id, organizationId)
      setDeleteOpen(false)
      navigate(basePath)
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "The demo record could not be deleted.")
      setDeleteOpen(false)
    }
  }

  async function addTaskComment(event) {
    event.preventDefault()
    try {
      await mutate("addTaskComment", record.id, taskComment, organizationId)
      setTaskComment("")
      setOperationError("")
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "The comment could not be added.")
    }
  }

  async function reviewLeave(decision) {
    try {
      await mutate("reviewLeaveRequest", record.id, organizationId, decision, reviewReason)
      setOperationError("")
      setOperationMessage(decision === "APPROVED" ? "Leave request approved in demo mode." : "Leave request rejected in demo mode.")
      setReviewReason("")
    } catch (error) {
      setOperationMessage("")
      setOperationError(error instanceof Error ? error.message : "The leave request could not be reviewed.")
    }
  }

  async function enrollInPath() {
    try {
      await mutate("enrollInLearningPath", record.id, organizationId)
      setOperationError("")
      setOperationMessage("Enrolled in this demo learning path.")
    } catch (error) {
      setOperationMessage("")
      setOperationError(error instanceof Error ? error.message : "The learning path enrollment could not be completed.")
    }
  }

  async function advancePath(progress) {
    try {
      await mutate("updateLearningPathProgress", record.id, organizationId, Math.min(100, progress + 10))
      setOperationError("")
      setOperationMessage("Learning path milestone completed in demo mode.")
    } catch (error) {
      setOperationMessage("")
      setOperationError(error instanceof Error ? error.message : "Learning path progress could not be updated.")
    }
  }

  const heading = creating ? `Create ${config.title.toLowerCase()} record` : editing ? `Edit ${record?.name ?? record?.title ?? config.title}` : record ? record.name ?? record.title ?? record.subject ?? config.title : config.title
  const editable = config.allowUpdate && record

  if (creating || editing) {
    return (
      <Surface>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{heading}</h3>
            <p className="mt-1 text-sm text-[var(--cv-muted)]">Demo-only changes stay in this browser session.</p>
          </div>
          <Link to={basePath} className="cv-secondary-btn !px-4 !py-2.5 text-sm">Cancel</Link>
        </div>
        <DemoForm
          key={`${config.resource}-${recordId ?? "new"}`}
          fields={config.fields}
          initialValues={editing ? record : {}}
          onSubmit={save}
          submitLabel={editing ? "Save demo changes" : "Create demo record"}
        />
        {operationError && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{operationError}</p>}
      </Surface>
    )
  }

  if (record) {
    const shownFields = config.columns.filter((column) => column.key in record)
    const learningPathEnrollment = data.learningPathEnrollments.find((item) => item.pathId === record.id)
    const learningPathProgress = learningPathEnrollment?.progress ?? 0
    const studentProgressValue = Number.parseFloat(record.progress) || 0
    return (
      <div className="space-y-5">
        <Surface>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="cv-kicker">DEMO DETAIL</p>
              <h3 className="mt-1 text-xl font-bold">{heading}</h3>
              <p className="mt-1 text-sm text-[var(--cv-muted)]">{config.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={basePath} className="cv-secondary-btn !px-4 !py-2.5 text-sm">Back</Link>
              {editable && <Link to={`${basePath}/${record.id}/edit`} className="cv-primary-btn !px-4 !py-2.5 text-sm">Edit</Link>}
              {config.allowDelete && <button type="button" onClick={() => setDeleteOpen(true)} className="cv-secondary-btn !px-4 !py-2.5 text-sm text-red-600">Delete</button>}
            </div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {shownFields.map((column) => (
              <div key={column.key} className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--cv-muted)]">{column.label}</dt>
                <dd className="mt-1 break-words text-sm">
                  {column.kind === "status" ? <StatusBadge value={record[column.key]} /> : String(record[column.key] ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
          {config.relatedLinks?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {config.relatedLinks.map((item) => (
                <Link key={item.screen} to={`/workspace/${portal}/${item.screen}${item.detail ? `/${record.id}` : ""}`} className="cv-secondary-btn !px-4 !py-2 text-sm">{item.label}</Link>
              ))}
            </div>
          )}
          {(record.description || record.instructions || record.content || record.feedback) && (
            <div className="mt-5 space-y-3 text-sm">
              {record.description && <p className="whitespace-pre-wrap">{record.description}</p>}
              {record.instructions && <div><h4 className="font-semibold">Instructions</h4><p className="mt-1 whitespace-pre-wrap">{record.instructions}</p></div>}
              {record.content && <div><h4 className="font-semibold">Submission notes</h4><p className="mt-1 whitespace-pre-wrap">{record.content}</p></div>}
              {record.feedback && <div><h4 className="font-semibold">Trainer feedback</h4><p className="mt-1 whitespace-pre-wrap">{record.feedback}</p></div>}
            </div>
          )}
          {config.resource === "certificates" && (
            <p className="mt-5 rounded-xl bg-[var(--cv-surface-2)] p-3 text-sm">
              Demo verification: credential <strong>{record.credential}</strong> is present in this sample dataset. This is not a real-world certificate verification service.
            </p>
          )}
          {portal === "student" && config.resource === "courses" && (
            <div className="mt-5">
              <CourseDetails course={record} data={data} organizationId={organizationId} mutate={mutate} studentMode={studentMode} />
            </div>
          )}
          {portal === "trainer" && config.resource === "students" && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-[var(--cv-surface-2)] p-4">
                <h4 className="font-semibold">Learning progress</h4>
                <p className="mt-1 text-sm text-[var(--cv-muted)]">{studentProgressValue}% complete · last active {record.lastActive || "not available"}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border)]" role="progressbar" aria-label={`${record.name} learning progress`} aria-valuenow={studentProgressValue} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[var(--cv-primary)]" style={{ width: `${studentProgressValue}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-[var(--cv-surface-2)] p-4">
                <h4 className="font-semibold">Recent submissions</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {data.submissions.filter((item) => item.student === record.name).map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2"><span>{item.assignment} · {item.submittedAt}</span><StatusBadge value={item.status} /></li>)}
                  {data.submissions.filter((item) => item.student === record.name).length === 0 && <li className="text-[var(--cv-muted)]">No submissions in this demo organization.</li>}
                </ul>
              </div>
              <div className="rounded-xl bg-[var(--cv-surface-2)] p-4 lg:col-span-2">
                <h4 className="font-semibold">Attendance history</h4>
                <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  {data.attendance.filter((item) => item.studentId === record.id).map((item) => <li key={item.id}>{item.date} · {item.checkIn || "—"} – {item.checkOut || "—"} · {item.status}</li>)}
                  {data.attendance.filter((item) => item.studentId === record.id).length === 0 && <li className="text-[var(--cv-muted)]">No attendance records for this learner.</li>}
                </ul>
              </div>
            </div>
          )}
          {portal === "student" && config.resource === "learningPaths" && (
            <div className="mt-5 rounded-xl bg-[var(--cv-surface-2)] p-4">
              <h4 className="font-semibold">Learning path progress</h4>
              <p className="mt-1 text-sm text-[var(--cv-muted)]">{record.milestones || "No milestones are listed."}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm">{learningPathEnrollment ? `${learningPathProgress}% complete` : "Not enrolled"}</span>
                {!learningPathEnrollment
                  ? <button type="button" onClick={enrollInPath} className="cv-primary-btn !px-3 !py-2 text-sm">Enroll in demo path</button>
                  : <button type="button" disabled={learningPathProgress >= 100} onClick={() => advancePath(learningPathProgress)} className="cv-primary-btn !px-3 !py-2 text-sm disabled:opacity-50">Complete next milestone</button>}
              </div>
              <p className="mt-2 text-xs text-[var(--cv-muted)]">Enrollment and progress are stored in demo memory only.</p>
            </div>
          )}
          {config.resource === "projects" && (
            <div className="mt-5 rounded-xl bg-[var(--cv-surface-2)] p-4">
              <h4 className="font-semibold">Project workspace</h4>
              <p className="mt-2 text-sm"><strong>Members:</strong> {Array.isArray(record.members) ? record.members.join(", ") : record.members || "No members assigned"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm"><strong>Milestones:</strong> {record.milestones || "No milestones listed."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/workspace/${portal}/${portal === "organization" ? "tasks" : "task-list"}`} className="cv-secondary-btn !px-3 !py-2 text-xs">Open task workspace</Link>
                {record.startDate && <span className="self-center text-xs text-[var(--cv-muted)]">Started {record.startDate}</span>}
              </div>
            </div>
          )}
          {config.resource === "projects" && (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <section className="rounded-xl border border-[var(--cv-border)] p-4">
                <h4 className="font-semibold">Project tasks and activity</h4>
                <ul className="mt-2 space-y-3 text-sm">
                  {data.tasks.filter((item) => item.projectId === record.id).map((task) => (
                    <li key={task.id}>
                      <div className="flex flex-wrap justify-between gap-2"><span>{task.title}</span><StatusBadge value={task.status} /></div>
                      <ul className="mt-1 space-y-1 text-xs text-[var(--cv-muted)]">{(task.history ?? []).slice(0, 2).map((entry, index) => <li key={`${task.id}-activity-${index}`}>{entry.action} · {new Date(entry.at).toLocaleDateString()}</li>)}</ul>
                    </li>
                  ))}
                  {data.tasks.filter((item) => item.projectId === record.id).length === 0 && <li className="text-[var(--cv-muted)]">No tasks are linked to this project.</li>}
                </ul>
              </section>
              <section className="rounded-xl border border-[var(--cv-border)] p-4">
                <h4 className="font-semibold">Project documents</h4>
                <ul className="mt-2 space-y-2 text-sm">{data.documents.filter((item) => item.project === record.name).map((item) => <li key={item.id}>{item.name} <span className="text-xs text-[var(--cv-muted)]">· {item.category}</span></li>)}
                  {data.documents.filter((item) => item.project === record.name).length === 0 && <li className="text-[var(--cv-muted)]">No documents are linked to this project.</li>}
                </ul>
              </section>
              <section className="rounded-xl border border-[var(--cv-border)] p-4">
                <h4 className="font-semibold">Project work logs</h4>
                <ul className="mt-2 space-y-2 text-sm">{data.workLogs.filter((item) => item.project === record.name).map((item) => <li key={item.id}>{item.date} · {item.hours} hours · {item.note || "No summary"}</li>)}
                  {data.workLogs.filter((item) => item.project === record.name).length === 0 && <li className="text-[var(--cv-muted)]">No work logs are linked to this project yet.</li>}
                </ul>
              </section>
            </div>
          )}
          {config.resource === "meetings" && <MeetingRoomPreview meeting={record} />}
          {portal === "organization" && config.resource === "leaveRequests" && record.status === "PENDING" && (
            <div className="mt-5 rounded-xl bg-[var(--cv-surface-2)] p-4">
              <h4 className="font-semibold">Review leave request</h4>
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-xs text-[var(--cv-muted)]">Reason (required for rejection)</span>
                <textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} rows={2} className="cv-input" placeholder="Add a review note..." />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => reviewLeave("APPROVED")} className="cv-primary-btn !px-3 !py-2 text-sm">Approve request</button>
                <button type="button" onClick={() => reviewLeave("REJECTED")} className="cv-secondary-btn !px-3 !py-2 text-sm">Reject request</button>
              </div>
            </div>
          )}
          {operationMessage && <p role="status" className="mt-4 text-sm text-[var(--cv-muted)]">{operationMessage}</p>}
          {operationError && <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">{operationError}</p>}
        </Surface>
        {config.detailAction && (
          <Surface>
            <h3 className="mb-4 font-semibold">{data.submissions.some((item) => item.assignmentId === record.id) ? "Resubmit demo work" : config.detailAction.label}</h3>
            <p className="mb-4 text-sm text-[var(--cv-muted)]">This submission is stored only in demo memory.</p>
            {data.submissions.filter((item) => item.assignmentId === record.id).length > 0 && (
              <ul className="mb-4 space-y-2">
                {data.submissions.filter((item) => item.assignmentId === record.id).map((item) => (
                  <li key={item.id} className="rounded-lg bg-[var(--cv-surface-2)] p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2"><strong>Submitted {item.submittedAt}</strong><StatusBadge value={item.status} /></div>
                    <p className="mt-1">{item.content}</p>
                    {item.grade !== undefined && item.grade !== "" && <p className="mt-1">Grade: {item.grade}/100</p>}
                    {item.feedback && <p className="mt-1 text-[var(--cv-muted)]">Feedback: {item.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
            <DemoForm
              fields={config.detailAction.fields}
              onSubmit={(values) => mutate(
                "createResource",
                config.detailAction.resource,
                organizationId,
                { ...config.detailAction.values(record), ...values },
              )}
              submitLabel={data.submissions.some((item) => item.assignmentId === record.id) ? "Resubmit demo work" : config.detailAction.label}
              successText="Demo submission saved."
            />
          </Surface>
        )}
        {config.resource === "tasks" && (
          <Surface>
            <h3 className="font-semibold">Task activity</h3>
            {record.attachmentUrl && <p className="mt-2 break-all text-sm">Demo attachment link: {record.attachmentUrl}</p>}
            <ul className="mt-4 space-y-2">
              {(record.comments ?? []).map((item, index) => (
                <li key={`${record.id}-comment-${index}`} className="rounded-xl bg-[var(--cv-surface-2)] p-3 text-sm"><strong>{item.author}:</strong> {item.text}</li>
              ))}
              {(record.comments ?? []).length === 0 && <li className="text-sm text-[var(--cv-muted)]">No comments yet.</li>}
            </ul>
            <form onSubmit={addTaskComment} className="mt-4 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="detail-task-comment">Add a task comment</label>
              <input id="detail-task-comment" value={taskComment} onChange={(event) => setTaskComment(event.target.value)} required className="cv-input min-w-52 flex-1 !py-2" placeholder="Write a comment..." />
              <button type="submit" className="cv-primary-btn !px-4 !py-2 text-sm">Add comment</button>
            </form>
            <h4 className="mt-6 text-sm font-semibold">Activity history</h4>
            <ol className="mt-2 space-y-2 text-sm text-[var(--cv-muted)]">
              {(record.history ?? []).map((item, index) => <li key={`${record.id}-history-${index}`}>{item.action} · {item.actor} · {new Date(item.at).toLocaleString()}</li>)}
              {(record.history ?? []).length === 0 && <li>No task changes recorded.</li>}
            </ol>
          </Surface>
        )}
        {deleteOpen && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4" role="presentation">
            <section role="dialog" aria-modal="true" aria-labelledby="delete-record-title" className="cv-panel w-full max-w-md">
              <h3 id="delete-record-title" className="font-semibold">Delete this demo record?</h3>
              <p className="mt-2 text-sm text-[var(--cv-muted)]">This only removes the record from this browser session.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteOpen(false)} className="cv-secondary-btn !px-4 !py-2.5 text-sm">Cancel</button>
                <button type="button" onClick={removeRecord} className="cv-primary-btn !bg-red-700 !px-4 !py-2.5 text-sm">Delete demo record</button>
              </div>
            </section>
          </div>
        )}
      </div>
    )
  }

  const columns = config.columns.map((column) => ({
    ...column,
    render: column.kind === "status"
      ? (row) => <StatusBadge value={row[column.key]} />
      : undefined,
  }))
  if (config.columns.length > 0) {
    columns.push({
      key: "actions",
      label: "Details",
      sortable: false,
      render: (row) => <Link to={`${basePath}/${row.id}`} className="font-semibold text-[var(--cv-primary)] hover:underline">Open</Link>,
    })
  }

  return (
    <div className="space-y-5">
      {portal === "employee" && screen === "timesheets" && <TimesheetSummary rows={records} />}
      {config.allowCreate && (
        <div className="flex justify-end">
          <Link to={`${basePath}/new`} className="cv-primary-btn !px-4 !py-2.5 text-sm">Create {config.title.toLowerCase()}</Link>
        </div>
      )}
      <Surface>
        <div className="mb-4">
          <h3 className="font-semibold">{config.title}</h3>
          <p className="mt-1 text-sm text-[var(--cv-muted)]">{config.description}</p>
        </div>
        <DataTable rows={records} columns={columns} emptyMessage={`No ${config.title.toLowerCase()} are available for this organization yet.`} />
      </Surface>
    </div>
  )
}

function GenericScreen({ portal, screen, routeParts, data, organizationId, mutate }) {
  if (portal === "student" && screen === "certificate-verification") return <CertificateVerification certificates={data.certificates} />
  if (portal === "employee" && screen === "attendance-history") return <AttendanceHistory data={data} />
  if (portal === "employee" && screen === "leave-balance") return <LeaveBalanceSummary data={data} />
  if (portal === "superadmin" && screen === "roles") return <PlatformRoles />
  if (RESOURCE_PAGES[portal]?.[screen]) {
    return <ResourcePage portal={portal} screen={screen} routeParts={routeParts} data={data} organizationId={organizationId} mutate={mutate} />
  }
  if (["courses", "practice", "progress", "assignments", "certificates"].includes(screen) && portal === "student") return <CourseScreen screen={screen} organizationId={organizationId} />
  if (screen === "courses" && portal === "trainer") return <TrainerCourses />
  if (screen === "assignments" && portal === "trainer") return <TrainerAssignments />
  if (screen === "students") return <WorkspaceTable title="Learner directory" rows={data.students} columns={[
    { key: "name", label: "Learner" }, { key: "cohort", label: "Cohort" }, { key: "progress", label: "Progress" }, { key: "lastActive", label: "Last active" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
  ]} />
  if (screen === "batches") return <WorkspaceTable title="Cohorts and batches" rows={data.teams} columns={[
    { key: "name", label: "Batch" }, { key: "department", label: "Program" }, { key: "lead", label: "Trainer" }, { key: "members", label: "Learners" },
  ]} />
  if (["submissions", "evaluation"].includes(screen)) return <WorkspaceTable title="Submissions for review" rows={data.assignments} columns={[
    { key: "title", label: "Assignment" }, { key: "course", label: "Course" }, { key: "submissions", label: "Submissions" }, { key: "dueDate", label: "Due" }, { key: "status", label: "Review status", render: (row) => <StatusBadge value={row.status} /> },
  ]} />
  if (screen === "tasks") return <TaskBoard onlyMyTasks={portal === "employee"} />
  if (screen === "projects") return <WorkspaceTable title="Projects" rows={data.projects} columns={[
    { key: "name", label: "Project" }, { key: "owner", label: "Owner" }, { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> }, { key: "progress", label: "Progress", render: (row) => `${row.progress}%` }, { key: "dueDate", label: "Due" },
  ]} />
  if (screen === "teams") return <Teams data={data} organizationId={organizationId} mutate={mutate} />
  if (screen === "worklogs") return <WorkLogs />
  if (screen === "leave") return <LeaveRequests />
  if (screen === "calendar") return <WorkspaceTable title="Upcoming events" rows={data.calendarEvents} columns={[
    { key: "date", label: "Date" }, { key: "time", label: "Time" }, { key: "title", label: "Event" }, { key: "type", label: "Type" },
  ]} />
  if (screen === "announcements") return <Announcements data={data} organizationId={organizationId} mutate={mutate} />
  if (screen === "documents") return <WorkspaceTable title="Shared documents" rows={data.documents} columns={[
    { key: "name", label: "Document" }, { key: "category", label: "Type" }, { key: "owner", label: "Owner" }, { key: "updatedAt", label: "Updated" },
  ]} />
  if (screen === "messages") return <MessageCenter />
  if (screen === "developer") return <DeveloperWorkspace data={data} />
  if (screen === "github") return <GitHubPreview data={data} />
  if (screen === "employees") return <Employees mode="list" />
  if (screen === "access") return <Employees mode="access" />
  if (screen === "invitations") return (
    <Surface>
      <h3 className="mb-4 font-semibold">Invite an employee</h3>
      <DemoForm fields={[
        { name: "name", label: "Full name", required: true },
        { name: "email", label: "Work email", type: "email", required: true },
        { name: "department", label: "Department" },
      ]} onSubmit={(values) => mutate("inviteEmployee", { ...values, organizationId })} submitLabel="Create demo invitation" successText="Demo invitation created; no email was sent." />
      <p className="mt-5 text-sm text-[var(--cv-muted)]">Invited people appear as invited in the employee directory.</p>
    </Surface>
  )
  if (screen === "departments") return (
    <div className="space-y-5">
      <Surface>
        <h3 className="mb-4 font-semibold">Create a department</h3>
        <DemoForm fields={[{ name: "name", label: "Department name", required: true }, { name: "owner", label: "Department owner" }]} onSubmit={(values) => mutate("createDepartment", { ...values, organizationId })} submitLabel="Create demo department" />
      </Surface>
      <WorkspaceTable title="Departments" rows={data.departments} columns={[
        { key: "name", label: "Department" }, { key: "owner", label: "Owner" }, { key: "members", label: "Members" },
      ]} />
    </div>
  )
  if (screen === "roles") return <SimpleAccessRoles />
  if (screen === "settings") return portal === "organization" ? <OrganizationProfile /> : <WorkspaceProfile />
  if (screen === "applications") return <ApplicationReview routeParts={routeParts} />
  if (screen === "organizations") return <OrganizationDirectory routeParts={routeParts} />
  if (screen === "suspended") return <OrganizationDirectory suspended routeParts={routeParts} />
  if (screen === "users") return <PlatformUsers routeParts={routeParts} />
  if (screen === "audit") return <WorkspaceTable title="Recent platform events" rows={data.auditEvents} columns={[
    { key: "date", label: "Time" }, { key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "target", label: "Target" }, { key: "result", label: "Result", render: (row) => <StatusBadge value={row.result} /> },
  ]} />
  if (screen === "analytics" || screen === "reports") return <Reports portal={portal} />
  if (screen === "configuration") return <PlatformConfiguration />
  if (screen === "registration") return <OrganizationRegistration />
  if (screen === "application-status") return <OrganizationRegistration statusOnly />
  if (screen === "profile") return <WorkspaceProfile />
  if (screen === "attendance") return <Attendance data={data} portal={portal} />
  if (screen === "dashboard") return <Dashboard portal={portal} />
  return (
    <Surface>
      <h3 className="font-semibold">Page not found</h3>
      <p className="mt-2 text-sm text-[var(--cv-muted)]">This page is not configured for the selected portal.</p>
      <Link to={`/workspace/${portal}/dashboard`} className="cv-primary-btn mt-4 !px-4 !py-2.5 text-sm">Return to dashboard</Link>
    </Surface>
  )
}

export default function WorkspaceScreens({ portal, screen, routeParts = [] }) {
  const { activeOrganizationId, data, mutate, studentMode } = useWorkspace()
  const isStudent = portal === "student"
  const organizationId = isStudent && studentMode === "independent" ? null : activeOrganizationId
  const memberships = DEMO_MEMBERSHIPS[portal] ?? []
  const hasOrganization = studentMode !== "independent" && memberships.includes(activeOrganizationId)
  const activeOrg = DEMO_ORGANIZATIONS.find((organization) => organization.id === activeOrganizationId)

  return (
    <div className="cv-workspace-page">
      {screen !== "dashboard" && <PageIntro portal={portal} screen={screen} />}
      {isStudent && !hasOrganization && (
        <Surface className="mb-5">
          <h3 className="font-semibold">Independent student mode</h3>
          <p className="mt-1 text-sm text-[var(--cv-muted)]">Your demo learning activity is not associated with an organization.</p>
        </Surface>
      )}
      {portal === "student" && hasOrganization && activeOrg && (
        <p className="mb-4 text-xs text-[var(--cv-muted)]">Organization-linked demo membership: {activeOrg.name}</p>
      )}
      <GenericScreen portal={portal} screen={screen} routeParts={routeParts} data={data} organizationId={organizationId} mutate={mutate} />
    </div>
  )
}
