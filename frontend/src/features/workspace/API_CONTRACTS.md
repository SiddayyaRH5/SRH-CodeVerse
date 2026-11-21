# SaaS workspace API contract proposal

These are proposed contracts for the future multi-tenant backend. The current workspace pages use `demoService.js` and do not call these endpoints. Demo changes are in-memory only.

## Conventions

- Base path: `/api/v1`.
- JSON uses camelCase fields and ISO-8601 UTC timestamps.
- Authenticated requests use `Authorization: Bearer <access-token>`.
- Organization-scoped requests include `X-Organization-Id: <organization-id>`. The server must verify that the authenticated user belongs to the organization and has the permission required for the operation. The header is context, not authorization.
- Platform-wide Super Admin operations use separate server-side platform permissions and must not trust a client-selected organization or role.
- Lists accept `page` (zero-based), `size` (default 20, maximum 100), `sort` (allow-listed field and direction), and optional `q` search parameters. Responses return `{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }`.
- Errors use `{ "code": "VALIDATION_ERROR", "message": "Request could not be completed.", "fieldErrors": { "name": "Required." }, "traceId": "..." }`. Never return secrets or internal stack traces.

## Core entities and relationships

- `User` has a stable ID and profile. A user can have multiple `OrganizationMembership` records and multiple roles, scoped either to a membership or the platform.
- `Organization` has an approval/status lifecycle, profile, departments, teams, projects, and settings.
- `OrganizationMembership` joins one user to one organization and contains organization-scoped roles and membership status.
- `Department` belongs to an organization. `Team` belongs to an organization and may reference a department and team lead.
- `Project` belongs to an organization. `Task` belongs to a project and organization, can be assigned to a member, and has comments and status history.
- `Course`, `Assignment`, `Submission`, and `AttendanceRecord` may be organization-scoped or available to independent students according to server policy.
- `Announcement`, `Message`, `WorkLog`, `LeaveRequest`, `Document`, and `AuditEvent` are organization-scoped unless explicitly platform-wide.

## Authentication and organization context

The existing application authentication endpoints and JWT contract are unchanged by this frontend phase. The new portal roles are a frontend demo model only.

The future identity response should provide the user's available memberships and effective role grants, for example:

```json
{
  "user": { "id": "user-123", "displayName": "Example User" },
  "platformRoles": [],
  "memberships": [
    { "organizationId": "org-123", "organizationName": "Example Org", "roles": ["EMPLOYEE", "TEAM_LEAD"], "status": "ACTIVE" }
  ]
}
```

The server must derive permissions from the authenticated identity and current membership on every request. Frontend route checks and organization selectors are usability features only.

## Organization registration and approval

### Submit an application

`POST /organizations/applications` — public or authenticated according to the final registration policy.

Request:

```json
{
  "organizationName": "Example Org",
  "type": "COMPANY",
  "contactName": "Example Contact",
  "contactEmail": "contact@example.test"
}
```

Response: `201 Created` with `{ "id": "application-123", "status": "PENDING", "submittedAt": "2026-01-15T12:00:00Z" }`.

### Review an application

`GET /platform/organization-applications?status=PENDING` and `POST /platform/organization-applications/{applicationId}/decision`.

Decision request: `{ "decision": "APPROVE" }` or `{ "decision": "REJECT", "reason": "..." }`. Requires a platform organization-review permission. Rejection requires a reason. The server records reviewer, timestamp, decision, and audit event.

Applicants may read only their own application status using `GET /organizations/applications/{applicationId}`.

## Organization administration

- `GET/PATCH /organizations/{organizationId}` — organization profile; requires organization settings permission.
- `GET/POST /organizations/{organizationId}/members` — directory and invitation workflow; role changes and suspensions use explicit `PATCH /members/{membershipId}` operations.
- `GET/POST /organizations/{organizationId}/departments` and `/teams` — organization structure. Team assignment and lead changes are validated against active membership.
- `GET/POST /organizations/{organizationId}/projects` and `GET/POST /projects/{projectId}/tasks` — project and task management.
- `POST /organizations/{organizationId}/announcements` — publish an announcement to an allowed audience.
- `GET /organizations/{organizationId}/reports/{reportType}` — permission-checked aggregate reporting.

Invitation acceptance must be bound to a single-use, expiring invitation token and must not grant roles supplied by an untrusted client.

## Tasks, work, and collaboration

- `GET /organizations/{organizationId}/tasks` supports status, assignee, priority, search, pagination, and sorting filters.
- `POST /organizations/{organizationId}/tasks` accepts `{ "title": "...", "projectId": "...", "assigneeMembershipId": "...", "priority": "MEDIUM", "dueAt": "..." }`.
- `PATCH /organizations/{organizationId}/tasks/{taskId}` updates allow-listed fields; status transitions are validated server-side.
- `POST /organizations/{organizationId}/tasks/{taskId}/comments` accepts `{ "body": "..." }`.
- `POST /organizations/{organizationId}/work-logs` accepts `{ "projectId": "...", "hours": 2.5, "workDate": "2026-01-15", "summary": "..." }`.
- `POST /organizations/{organizationId}/leave-requests` accepts `{ "startDate": "...", "endDate": "...", "reason": "..." }`.
- Messaging endpoints should enforce organization membership, channel visibility, message length limits, and retention policy.

## Learning and trainer workflows

- `GET /courses` can return public/independent courses; organization-specific results require organization context.
- `GET /organizations/{organizationId}/courses` and `POST /organizations/{organizationId}/courses/{courseId}/assignments` require trainer or course-management permissions.
- `GET /organizations/{organizationId}/assignments/{assignmentId}/submissions` requires trainer/evaluator permission.
- `POST /organizations/{organizationId}/submissions/{submissionId}/evaluation` accepts a validated rubric score and feedback.
- Attendance records are created and read through organization-scoped endpoints with server-side time and membership validation.

## Audit, status, and platform administration

- `GET /platform/organizations`, `/platform/users`, `/platform/audit-events`, and `/platform/analytics` require specific platform-level permissions.
- Organization suspension and restoration use audited `POST /platform/organizations/{organizationId}/suspend` and `/restore` actions with reason and actor metadata.
- Platform settings use allow-listed fields and audited changes. Secrets and provider credentials must be stored server-side and never returned to the frontend.

## Phase 1B portal endpoint inventory

The following inventory is a frontend integration proposal, not a claim that these endpoints exist. All organization paths require an authenticated active membership and an operation-specific permission. The API must derive the effective user and memberships from the bearer token; `X-Organization-Id` only selects a context the server must independently authorize.

| Portal / module | Method and path | Permission / behavior |
|---|---|---|
| Student profile | `GET /me`, `PATCH /me/profile` | Read or update the authenticated user's own profile. |
| Student course catalog | `GET /courses`, `GET /organizations/{orgId}/courses` | Public/independent catalog or membership-scoped catalog. |
| Student course learning | `GET /courses/{courseId}`, `GET /courses/{courseId}/lessons`, `GET /lessons/{lessonId}/resources` | Return only published courses and visible learning materials. |
| Student enrollment and progress | `GET /me/enrollments`, `POST /courses/{courseId}/enrollments`, `GET /me/progress`, `PUT /me/lessons/{lessonId}/progress` | Enrollment and progress are tied to the authenticated user; do not accept a client-supplied user ID. |
| Student coding practice | Existing `/api/problems` endpoints and `GET /me/submissions` | Existing problem APIs remain unchanged; submission history is user-scoped. |
| Student assignments | `GET /organizations/{orgId}/assignments`, `GET /assignments/{assignmentId}`, `POST /assignments/{assignmentId}/submissions` | The assignment must be visible to the student; validate due date and submission state. |
| Student certificates | `GET /me/certificates`, `GET /certificates/{credentialId}/verification` | Credentials are read-only and verification responses reveal no private learner data. |
| Student notifications | `GET /me/notifications`, `PATCH /me/notifications/{notificationId}` | User-scoped list and read state; never permit cross-user updates. |
| Student support | `GET /me/support-requests`, `POST /support-requests`, `GET /support-requests/{requestId}` | Submit and read only the user's support requests. |
| Trainer profile and roster | `GET /me/profile`, `GET /organizations/{orgId}/learners`, `GET /organizations/{orgId}/learners/{membershipId}/progress` | Requires trainer/learner-management permission; constrain records to assigned cohorts. |
| Trainer courses | `GET/POST /organizations/{orgId}/courses`, `GET/PATCH/DELETE /organizations/{orgId}/courses/{courseId}` | Course-management permission; deletion should be blocked when referenced or use an explicit archive action. |
| Trainer curriculum and materials | `GET/POST /organizations/{orgId}/courses/{courseId}/lessons`, `PATCH/DELETE /organizations/{orgId}/lessons/{lessonId}`, `GET/POST /organizations/{orgId}/courses/{courseId}/resources` | Validate parent course, ordering, publication state, and allowed resource URL schemes. |
| Trainer cohorts | `GET/POST /organizations/{orgId}/batches`, `GET/PATCH /organizations/{orgId}/batches/{batchId}`, `PUT /organizations/{orgId}/batches/{batchId}/members` | Validate trainers and learners as active organization memberships. |
| Trainer assignments and grading | `GET/POST /organizations/{orgId}/assignments`, `GET /organizations/{orgId}/assignments/{assignmentId}/submissions`, `POST /organizations/{orgId}/submissions/{submissionId}/evaluation` | Evaluators may grade only submissions in their permitted courses/cohorts; retain a grading audit record. |
| Trainer attendance and schedule | `GET /organizations/{orgId}/attendance`, `POST /organizations/{orgId}/attendance/sessions`, `POST /organizations/{orgId}/attendance/sessions/{sessionId}/records`, `GET/POST /organizations/{orgId}/calendar-events` | Trainer attendance is course/session-scoped; server timestamps are authoritative. |
| Employee directory | `GET /organizations/{orgId}/members`, `GET /organizations/{orgId}/members/{membershipId}`, `PATCH /organizations/{orgId}/members/{membershipId}/profile` | Read permission is organization-scoped; users may update only their own permitted profile fields. |
| Employee projects | `GET /organizations/{orgId}/projects`, `GET /organizations/{orgId}/projects/{projectId}` | Return projects visible to the membership and permitted teams. |
| Employee tasks | `GET /organizations/{orgId}/tasks`, `GET /organizations/{orgId}/tasks/{taskId}`, `POST /organizations/{orgId}/tasks/{taskId}/comments`, `POST /organizations/{orgId}/tasks/{taskId}/attachments` | Validate task visibility, status transitions, comment length, and attachment type/size. |
| Employee work logs | `GET/POST /organizations/{orgId}/work-logs`, `GET /organizations/{orgId}/timesheets`, `POST /organizations/{orgId}/timesheets/{timesheetId}/submit` | Members may create their own logs; approvers may review only assigned reports. |
| Employee attendance | `GET /organizations/{orgId}/attendance/me`, `POST /organizations/{orgId}/attendance/check-in`, `POST /organizations/{orgId}/attendance/check-out` | Derive the member from the token; prevent duplicate check-ins and invalid check-out sequences. |
| Employee leave | `GET /organizations/{orgId}/leave-requests/me`, `POST /organizations/{orgId}/leave-requests`, `GET /organizations/{orgId}/leave-balances/me` | Employees submit for themselves; approval/rejection is a separate permissioned manager action. |
| Employee calendar and meetings | `GET/POST /organizations/{orgId}/calendar-events`, `GET/POST /organizations/{orgId}/meetings` | Meetings are scheduling records unless a separately secured real-time provider integration is added. |
| Employee documents and policies | `GET /organizations/{orgId}/documents`, `POST /organizations/{orgId}/documents`, `GET /organizations/{orgId}/policies` | File upload/download requires signed, short-lived storage URLs and server-side authorization. |
| Employee messages and channels | `GET/POST /organizations/{orgId}/channels`, `GET/POST /organizations/{orgId}/channels/{channelId}/messages`, `GET/POST /organizations/{orgId}/direct-messages/{membershipId}/messages` | Verify channel membership and recipient membership; apply retention, rate, and content-size limits. |
| Employee goals and training | `GET/POST /organizations/{orgId}/goals/me`, `GET /organizations/{orgId}/training`, `PUT /organizations/{orgId}/training/{trainingId}/progress` | Employee updates are restricted to their own goals and training progress. |
| Organization admin | `GET/PATCH /organizations/{orgId}`, `GET/POST /organizations/{orgId}/departments`, `GET/POST /organizations/{orgId}/teams` | Requires the corresponding organization settings/structure permissions. |
| Organization memberships and roles | `POST /organizations/{orgId}/invitations`, `PATCH /organizations/{orgId}/members/{membershipId}/roles`, `PATCH /organizations/{orgId}/members/{membershipId}/status`, `GET/PUT /organizations/{orgId}/role-permissions` | Enforce role-assignment policy server-side; never trust roles or permissions in a client request without authorization checks. |
| Organization operations | `GET/POST /organizations/{orgId}/projects`, `GET /organizations/{orgId}/tasks`, `GET /organizations/{orgId}/timesheets`, `GET /organizations/{orgId}/attendance` | Separate read, create, assignment, approval, and reporting permissions. |
| Organization leave and holidays | `GET /organizations/{orgId}/leave-requests`, `POST /organizations/{orgId}/leave-requests/{requestId}/decision`, `GET/POST /organizations/{orgId}/holidays` | Decision requests require manager permission and produce an audit event. |
| Organization learning | `GET/POST /organizations/{orgId}/training`, `GET/POST /organizations/{orgId}/learning-paths`, `GET /organizations/{orgId}/learning-reports` | Scope training assignments and reports to the organization. |
| Organization communication | `GET/POST /organizations/{orgId}/announcements`, `GET /organizations/{orgId}/documents`, `GET /organizations/{orgId}/audit-events` | Verify audience visibility and admin read permission. |
| Super Admin applications | `GET /platform/organization-applications`, `GET /platform/organization-applications/{applicationId}`, `POST /platform/organization-applications/{applicationId}/decision` | Platform review permission; rejection requires a reason and both decisions are audited. |
| Super Admin organizations | `GET /platform/organizations`, `GET /platform/organizations/{orgId}`, `POST /platform/organizations/{orgId}/suspend`, `POST /platform/organizations/{orgId}/restore` | Platform permission, required reason, conflict checks, and audit record. |
| Super Admin users and roles | `GET /platform/users`, `GET /platform/users/{userId}`, `PATCH /platform/users/{userId}/status`, `GET /platform/roles` | Do not permit self-escalation; status and role changes are audited and policy-checked. |
| Super Admin audit and analytics | `GET /platform/audit-events`, `GET /platform/security-events`, `GET /platform/analytics` | Restrict fields and access to platform auditors/admins; aggregate results must not expose unrelated tenant records. |
| Super Admin support and announcements | `GET /platform/support-requests`, `PATCH /platform/support-requests/{requestId}`, `GET/POST /platform/announcements` | Platform-only support triage and platform-wide announcements. |
| Platform configuration | `GET/PATCH /platform/settings` | Allow-list non-secret settings; no client credentials, signing keys, or provider tokens in responses. |

### Representative request and response shapes

Create/update endpoints should validate the payload, return the canonical persisted record, and include an opaque ID and UTC timestamps. The server determines organization and user relationships from authorized membership records rather than trusting names or IDs supplied by the browser.

```json
{
  "task": {
    "id": "task-123",
    "organizationId": "org-123",
    "projectId": "project-123",
    "title": "Review onboarding flow",
    "assigneeMembershipId": "membership-123",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "dueAt": "2026-12-01T00:00:00Z",
    "updatedAt": "2026-11-15T10:00:00Z"
  }
}
```

```json
{
  "submission": {
    "id": "submission-123",
    "assignmentId": "assignment-123",
    "studentUserId": "user-123",
    "submittedAt": "2026-11-15T10:00:00Z",
    "status": "SUBMITTED",
    "evaluation": null
  }
}
```

```json
{
  "membership": {
    "id": "membership-123",
    "organizationId": "org-123",
    "userId": "user-123",
    "roles": ["EMPLOYEE", "TEAM_LEAD"],
    "status": "ACTIVE"
  }
}
```

Calendar, leave, attendance, message, course, lesson, certificate, document, invitation, announcement, audit, and support responses should follow the same stable envelope conventions and use explicit status enums. Upload data must travel through the approved storage integration, not as arbitrary inline content in these JSON examples. Real-time calls, repository access, screen sharing, and OAuth provider credentials require separately approved integrations; the Phase 1A/1B demo pages do not invoke them.

## Phase 1C — Unified identity, registration and workspace selection

### Global identity and authentication

The existing authentication endpoints remain unchanged:

- `POST /api/auth/login` — body `{ "username": "...", "password": "..." }`, response `{ "token": "...", "username": "...", "role": "STUDENT" }`.
- `POST /api/auth/register` — body `{ "username": "...", "email": "...", "password": "..." }`, response same as login. The server **always** assigns the `STUDENT` role; it never trusts a client-supplied role.
- `GET /api/auth/login/oauth2/{google|github}` — OAuth initiation (unchanged).
- `POST /api/auth/oauth/exchange-code` — body `{ "code": "..." }`, response same as login.

A future global-identity response should expose available memberships so the frontend can render a workspace selector without a separate login per portal:

```json
{
  "user": { "id": "user-123", "displayName": "Example User", "email": "user@example.test" },
  "platformRoles": [],
  "memberships": [
    { "organizationId": "org-123", "organizationName": "Example Org", "roles": ["EMPLOYEE", "TEAM_LEAD"], "status": "ACTIVE" }
  ]
}
```

### Registration choices (frontend labels vs. backend reality)

| Choice | Frontend status | Backend status | Notes |
|---|---|---|---|
| Student | Real form, validates and submits | Supported (`POST /api/auth/register`, always STUDENT) | Working today. |
| Professional | Prototype form, validates only | Not supported | Requires a future `POST /api/auth/register/professional` or an extended register endpoint that accepts a requested account type. Must never assign a privileged role from the client. |
| Trainer | Prototype form, validates only | Not supported | Requires a future `POST /api/auth/register/trainer` or an admin-approved trainer invitation flow. Organization-linked trainers receive membership only after invitation/approval. |
| Organization | Prototype application form | Not supported | Requires `POST /organizations/applications` (already proposed above). Shows "Your organization application has been submitted and is awaiting Super Admin approval." |

### Workspace selection

`GET /me/workspaces` (proposed) — returns the list of workspaces the authenticated user may open:

```json
{
  "workspaces": [
    { "key": "student", "label": "Student", "type": "STUDENT", "organizationId": null, "organizationName": null, "role": "STUDENT", "preview": false },
    { "key": "professional", "label": "Professional", "type": "PROFESSIONAL", "organizationId": "org-123", "organizationName": "Example Org", "role": "EMPLOYEE", "preview": false }
  ]
}
```

The frontend must never treat a selected workspace as proof of authorization. The server re-validates the authenticated user, active membership, organization status, assigned role and permissions on every request. Demo-preview workspaces are client-side only and never call this endpoint.

### Workspace selection rules

- One available workspace → navigate to it automatically.
- Multiple available workspaces → show the selector.
- No available workspace → show an access-pending state.
- Switching workspaces must not require a new login.

## Error and concurrency behavior

Use `400` for malformed/invalid fields, `401` for missing/invalid authentication, `403` for insufficient permission, `404` when a resource is not visible to the caller, `409` for conflicting state transitions, and `429` for rate limits. Include the common error envelope above. Mutations should return the canonical updated resource and version/timestamp; clients should refresh or invalidate affected cache entries after a successful mutation.
