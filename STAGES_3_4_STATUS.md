# Stages 3 & 4 — Implementation Status

## Stage 3 — Student Portal

### Existing implementation inventory
- Student dashboard and core API-backed analytics.
- Problem catalog, problem detail, coding submission and submission history.
- Courses, course detail, lesson detail, course-problem detail, learning paths.
- Playground, mock interview, interview arena, live coding arena.
- Study Hub, roadmap, analytics, leaderboard, certificates, achievements.
- Profile/settings, announcements, calendar, notifications, registration/auth flows.
- Role-protected routes in `frontend/src/routes/AppRoutes.jsx`.

### Added in this package
- Student-only sidebar quick links to the dedicated student tools (Playground, Mock Interview, Live Coding, Study Hub, Roadmap, Analytics, Leaderboard, Achievements). They are shown only outside demo mode so demo links cannot accidentally leave the demo context.
- A Stage 3/4 static verification script and npm script.

### Verification limits
Static route/file checks do not prove API integration or every interaction works. Full frontend tests, production build, and browser QA were not run because dependency installation (`npm ci`) timed out in this environment.

## Stage 4 — Professional Portal

### Existing implementation inventory
- Dashboard preview metrics, tasks and task board, projects, teams, work logs, timesheets/reports, attendance and attendance history, leave requests/balance, directory, notifications, calendar, meetings, announcements, documents, policies, messaging/channels, developer workspace, GitHub integration preview, goals/feedback, training, support, settings.
- Demo mutations are managed by the workspace demo service; demo changes are not production API persistence.

### Added in this package
- A persistent contextual notice on Professional workspace pages clarifies that this portal currently runs with local demo data and that preview changes do not sync to a production API or organization account.
- Static verification coverage for Professional portal navigation and workspace components.

### Not yet production-complete
The Professional portal is a demo/workspace implementation. Real professional APIs, authenticated employee-specific persistence, organization membership/tenant enforcement, approval workflows, and end-to-end verification are not established by this package. Do not treat Stage 4 as production-ready until these are implemented and tested against the backend.

## Commands
Run from `frontend/`:
- `npm run stage34:verify` — static feature/route inventory checks.
- `npm test` — Vitest suite (requires dependencies installed).
- `npm run build` — production frontend build (requires dependencies installed).

