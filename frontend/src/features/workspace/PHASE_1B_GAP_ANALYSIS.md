# Phase 1B frontend requirements gap analysis

Status reflects the recovered frontend before Phase 1B implementation. `Done` means an existing routed flow is usable; `Partial` means a related screen exists but misses required actions, details, or data behavior; `Missing` means no usable routed screen exists.

## Student portal

| Page / workflow | Status | Existing coverage and gap |
|---|---|---|
| Student dashboard | Done | `/dashboard`; existing API-backed dashboard. |
| My profile | Done | `/profile`; existing profile page. |
| My courses | Partial | `/courses` exists; enrollment and organization-aware views are incomplete. |
| Course details | Partial | `/courses/:slug` exists; complete curriculum/resources and progress are not connected. |
| Course learning / lessons | Partial | `/courses/:slug/lessons/:lessonId` exists; learner materials and lesson completion need completion. |
| Video and learning resources | Partial | Study Hub and `RecommendedVideos` exist; course-level resource management is incomplete. |
| Coding practice | Done | Problems, Playground, Interview Arena, and Live Coding routes exist. |
| Problem listing | Done | `/problems` exists. |
| Problem details and code editor | Done | `/problems/:id` and course problem route use the existing editor. |
| Code submission and results | Partial | Submission behavior exists in problem flows; result history/detail behavior is not a complete module. |
| Submission history | Partial | `MySubmissions.jsx` exists but is not routed or linked in navigation. |
| Learning paths | Partial | Learning Path and Roadmap pages exist; organized path details and enrollment actions are incomplete. |
| Learning path details | Partial | No distinct routed detail flow for a selected path. |
| Assignments | Partial | Demo list exists; no student-specific assignment ownership or filtering. |
| Assignment details and submission | Missing | No detail, submission, or resubmission flow. |
| My progress | Partial | Demo progress summary only. |
| Performance analytics | Done | Existing `/analytics` page. |
| Certificates | Partial | Certificate list exists; detail, verification, and share actions are missing. |
| Certificate details and verification | Missing | No routed verification/detail page. |
| Announcements | Missing | No student announcement center. |
| Notifications | Missing | Existing global notification control is not connected to a center. |
| Messages | Missing | No student messages route. |
| Calendar | Missing | No student calendar page. |
| Help and support | Missing | No support-request/help flow. |
| Settings | Done | Existing `/settings` page. |
| Independent / organization-linked mode | Partial | Demo selector exists; independent and organization-scoped records need complete behavior. |

## Trainer portal

| Page / workflow | Status | Existing coverage and gap |
|---|---|---|
| Trainer dashboard | Done | `/trainer/dashboard`; existing API-backed dashboard. |
| Trainer profile | Missing | No trainer-specific profile route. |
| My courses | Partial | Demo course listing exists but has no detail or ownership model. |
| Create course | Partial | Demo create form exists. |
| Edit course | Missing | No update form or route. |
| Course details | Missing | No trainer course detail route. |
| Curriculum and lessons | Missing | No course curriculum editor. |
| Learning materials | Missing | No trainer material management. |
| My students | Done | `/trainer/students` exists. |
| Student profile / progress | Partial | Existing student detail/activity page is not integrated into the demo roster. |
| Batches and classes | Partial | Demo list is based on teams; no batch/class lifecycle. |
| Create and edit batch | Missing | No batch form or update flow. |
| Assignments | Partial | Demo create/list exists; editing and assignment details are missing. |
| Assignment submissions | Partial | Current demo view lists assignment aggregates rather than individual submissions. |
| Review submission | Missing | No individual submission review. |
| Grade and feedback | Missing | No evaluation persistence or rubric flow. |
| Attendance management | Partial | Read-only attendance table. |
| Class schedule | Missing | No schedule management. |
| Calendar | Missing | No trainer calendar. |
| Learning path management | Missing | No trainer path editor. |
| Student performance reports | Partial | Minimal illustrative chart only. |
| Announcements | Partial | Demo publishing exists; audience and detail workflows are minimal. |
| Messages | Partial | Group channels exist; direct messages and threads are missing. |
| Notifications | Partial | Header count only; no trainer notification center. |
| Settings | Missing | No trainer settings page. |
| Independent / organization trainer mode | Partial | Demo organization switcher exists; independent trainer data is not modeled fully. |

## Employee ERP portal

| Page / workflow | Status | Existing coverage and gap |
|---|---|---|
| Employee dashboard | Partial | Demo metrics and activity feed. |
| My profile / edit profile | Partial / Missing | Static demo profile; no edit form. |
| Employee directory / details | Partial / Missing | Organization directory exists; no employee-specific detail route. |
| Departments | Partial | Demo list and create only; edit/detail/reporting are missing. |
| Teams / details | Partial | Demo list and create only; edit/detail are missing. |
| Reporting manager | Missing | No reporting structure. |
| Organization switcher | Partial | Selector changes the active mock organization. |
| Project dashboard and project list | Partial | A scoped project table/cards exist. |
| My projects | Missing | No assigned-project view. |
| Project details, create, and edit | Missing | No detail or CRUD flows. |
| Project members, timeline, activity, and documents | Missing | No project sub-pages. |
| All tasks / my tasks / assigned tasks | Partial | One board with a basic assigned-user filter. |
| Task board / task list | Partial | Kanban status changes and task creation exist; no list view or advanced filters. |
| Task details / edit | Partial / Missing | Inline details/comments exist; edit route and task form are missing. |
| Task attachments and activity history | Missing | No attachment or history UI. |
| Task priority, status, due dates | Partial | Priority/status/due-date fields exist; editing and history are missing. |
| Task filters and search | Partial | Board has no search or filter controls. |
| Work logs / timesheets | Partial | Work-log form/list exists; approvals and summaries are missing. |
| Daily / weekly work summary and reports | Missing | Only a fixed illustrative metric. |
| Calendar / schedule / meetings | Partial / Missing | Basic event list only; no schedule or meeting workflow. |
| Attendance dashboard and check-in/out | Partial / Missing | Read-only table; no attendance action or history. |
| Monthly attendance | Missing | No monthly view. |
| Leave requests / apply | Partial | Request form/list exists. |
| Leave details / balance | Missing | No detail or balance views. |
| Direct and group messages / channels | Partial | Basic group channels and send action only. |
| Search, files, threads, replies, notifications | Missing | No message search, file sharing, threads, or notification center. |
| Meeting, voice/video, screen sharing | Missing | No clearly marked meeting-interface placeholders. |
| Developer dashboard | Partial | Project cards and links only. |
| GitHub integration | Partial | Local preview toggle; no repository detail or integration interfaces. |
| Repositories, branches, commits, issues, pull requests, reviews | Missing | No Git-provider demo data or detail pages. |
| Documents | Partial | Read-only list. |
| Policies, performance, goals, feedback, training, help, settings | Missing | No corresponding employee pages. |

## Organization Admin portal

| Page / workflow | Status | Existing coverage and gap |
|---|---|---|
| Organization dashboard | Partial | Basic demo metrics and activity. |
| Profile / edit / details / settings | Partial | Profile update form exists; branding and detailed settings are missing. |
| Organization switcher | Partial | Shared demo selector. |
| Employee directory / invite | Partial | List and invite form exist; no employee detail/edit or invitation lifecycle. |
| Membership management / activate/deactivate | Partial | Basic status/role toggles only; no membership details. |
| Departments / teams | Partial | Lists and create actions; edit, detail, and reporting structure are missing. |
| Team leader assignment | Partial | Lead can be entered during team creation; no edit/assignment workflow. |
| Roles, permissions, multiple roles | Partial | Illustrative permission matrix; role CRUD and member assignment are missing. |
| Projects / tasks | Partial | Read-only projects and task board; project CRUD and assignment workflows are missing. |
| Work reports / timesheets | Missing | No organization report or timesheet review page. |
| Attendance reports | Partial | Basic read-only table. |
| Leave management / approval | Missing | No approval or rejection flow. |
| Holiday management / calendar | Missing | No calendar administration. |
| Trainers, students, courses, batches | Partial | Trainer/learner demo data exists; no organization training administration. |
| Assignments, learning paths, progress, training reports | Partial / Missing | No complete organization training workflows. |
| Announcements | Partial | Basic create/list. |
| Notifications, channels, messages, documents, policies | Partial / Missing | Documents and channels are basic; notification center and policies are missing. |
| Organization/employee/project/attendance analytics | Partial | A single illustrative chart only. |
| Activity and audit logs | Missing | No organization-level audit view. |

## Super Admin portal

| Page / workflow | Status | Existing coverage and gap |
|---|---|---|
| Platform dashboard / analytics | Partial | Basic metrics and illustrative chart. |
| All organizations / active / suspended | Partial | Directory and suspend/restore actions exist. |
| Organization details / activity | Partial / Missing | Limited inline details; no activity history or full detail page. |
| Pending applications / approve / reject with reason | Partial | Approve/reject works; no dedicated application detail route. |
| User directory / status | Partial | List and employee status toggle exist. |
| User details / role management | Missing | No detail or platform role assignment. |
| Platform role management | Missing | No role management UI. |
| Audit logs | Partial | Representative read-only events only. |
| Security activity | Missing | No security activity view. |
| Platform announcements | Missing | No platform announcement page. |
| Support requests | Missing | No support queue. |
| Platform settings | Partial | Local illustrative toggles only. |

## Shared design, navigation, data, and contracts

| Requirement | Status | Existing coverage and gap |
|---|---|---|
| SRH CodeVerse visual consistency | Partial | CSS variables/theme are reused, but workspace components do not consistently reuse existing `cv-*` panels, inputs, buttons, and branding. |
| Responsive sidebars and mobile navigation | Partial | Responsive drawer exists; page-level responsive/browser QA has not been completed. |
| Search, filtering, sorting, pagination | Partial | Shared table supports text search, sorting, and pagination; module-specific filters are missing. |
| Forms and validation | Partial | Basic required fields and service validation; edit flows and consistent field errors are missing. |
| Confirmation dialogs and toast messages | Missing | Mutations use inline status messages; destructive actions lack shared confirmation/toast patterns. |
| Loading, empty, and error states | Partial | Some empty/error states exist; most synchronous demo pages have no consistent state treatment. |
| Breadcrumbs and profile menu | Missing | No portal breadcrumb or workspace profile menu. |
| Theme and organization/role switching | Partial | Theme and demo switchers exist; complete page consistency and role/tenant data coverage need verification. |
| Permission-aware navigation | Partial | Role-specific nav is present, but it is demo presentation only and not authorization. |
| Mock data/service separation | Partial | Seed data and service adapters are centralized; multiple modules lack connected records and CRUD methods. |
| Tenant-scoped switching | Partial | Snapshot filtering exists; broader module/entity scoping and cross-organization mutation tests are needed. |
| API contracts | Partial | The proposal covers identity, organizations, tasks, learning, and audit at a high level; module-by-module methods, payloads, and response schemas are incomplete. |
| Existing routes, OAuth, and API cache | Done / Preserve | Existing login, registration, OAuth callback, Student/Trainer pages, bearer Axios client, and in-memory cache must remain unchanged. |
| Existing recovery artifacts | Done / Preserve | `frontend/package-lock.json` and the untracked Analytics backup must remain present; do not remove or overwrite them. |

No backend API-test scripts or Phase 1B plan/checklist artifacts were present in the recovered repository during this review. The user-provided Phase 1B attachment is the requirements source for this gap analysis.
