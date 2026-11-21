# SRH CodeVerse Integration Notes

## Source composition
- `frontend/`: Student frontend and Trainer routes/pages from the GitHub ZIP, plus Enterprise Admin, Team Lead, Professional, Employee, and Super Admin UI from the AI Studio ZIP.
- `backend/`: Student Academy backend from the GitHub ZIP (port 8080).
- `backend-enterprise/`: Enterprise workspaces backend from the AI Studio ZIP (port 8081).

## Local development
1. Configure each backend's database credentials and secrets using environment variables / its `application.properties` placeholders.
2. Student API default: `http://localhost:8080/api`.
3. Enterprise API default: `http://localhost:8081` (API endpoints include `/api`).
4. Frontend: run `npm install`, then `npm run dev` in `frontend/`.
5. Enterprise UI routes: `/enterprise/admin`, `/enterprise/team_lead`, `/enterprise/professional`, `/enterprise/employee`.
6. Super Admin route: `/platform/console`.
7. The Student/Trainer platform routes are unchanged.


## Important production readiness limitations
This ZIP is an integration candidate, not certified production-ready. The AI Studio enterprise backend originally trusts workspace identity/role/organization headers and has other security concerns. Those must be replaced with real server-side authentication, authorization, and tenant isolation before public production deployment. The services are kept separate intentionally to avoid risky merging of incompatible entity schemas and Spring Boot versions (Student backend Spring Boot 4.1.x; Enterprise backend Spring Boot 3.3.5). Both backend services require independent build/test verification and production configuration.

## Frontend dependency note
Enterprise workspaces use `lucide-react`. This dependency is declared in `frontend/package.json`. Because package registry access was unavailable in the build environment, the lockfile could not be refreshed here; run `npm install` from `frontend/` before building.

## Verification note
Frontend installation/build/tests and Maven tests were attempted, but this environment could not fetch npm registry packages or the Maven wrapper distribution. These checks therefore remain unverified; do not treat the integration ZIP as production-ready until CI or a local environment runs them successfully.
