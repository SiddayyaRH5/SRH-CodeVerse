# SRH CodeVerse performance optimization report

## Scope and evidence

This report describes source-level changes made to the uploaded project archive. It does not claim a measured production speed-up. Render, Aiven, Vercel, GitHub Actions, and production credentials were not accessible to this build process.

The supplied production observations included delayed first requests, GitHub Actions curl timeouts, an Actuator response of `OUT_OF_SERVICE`, and a browser 403 for authentication in earlier debugging. The uploaded source also lacked public authorization matchers for `/api/auth/**`.

## Changes

- Added public access only for `/api/auth/**` and the two health endpoints. All other routes retain the existing authenticated fallback and role checks.
- Added `/api/health/live` (also retaining `/api/health`) that does not touch MySQL.
- Added `/api/health/ready`, which validates one pooled database connection and returns a generic 503 response when unavailable. It does not return JDBC details.
- Configured a small Hikari pool (default maximum 3, minimum idle 1), bounded connection/validation timeouts, connection lifetime and keepalive. These defaults should be adjusted only after observing Aiven connection limits and production metrics.
- Disabled verbose SQL output and security DEBUG logging; disabled Open Session in View; added conservative Hibernate JDBC batching.
- Added Caffeine with a 45-second, one-entry cache for the public leaderboard only. No authentication, token, or user-specific dashboard response is cached.
- Centralized Axios timeout configuration and coalesced identical concurrent GET requests. Requests with AbortSignals remain independent. No POST retry is implemented.
- Added synchronous duplicate-submit guards to login and registration. Signup timeout messaging explicitly warns users to check account status before retrying.
- Updated the scheduled workflow to ping the database-independent liveness route with bounded retries. This is monitoring/keep-warm best effort, not an availability guarantee.
- Made the optional trainer seed password configurable through `TRAINER_SEED_PASSWORD`; if unset, trainer seed creation is skipped while roles and achievements are still seeded. Removed the embedded JWT signing-key fallback; `JWT_SECRET` must now be configured.

## Important limits

- Render Free may spin down an idle web service. A GitHub scheduled request may be delayed, cancelled, rate-limited, or fail, and does not guarantee the service stays awake.
- Aiven Free availability, suspension, restart, network latency, DNS, TLS, and connection limits are outside this repository. A liveness ping does not wake or validate MySQL.
- The readiness route intentionally reports `NOT_READY` if MySQL cannot be reached. A failing readiness probe is useful evidence; it is not a reason to make the liveness route database-dependent.
- `spring.jpa.hibernate.ddl-auto=update` is retained to preserve the existing deployment behavior and schema. Review a migration strategy before any future schema changes.
- No database schema or user records were intentionally deleted or reset.

## Tests and measurements

Run the commands in the README on a Java 21 / Node environment. A source archive alone cannot validate production DNS/TLS, Render cold starts, Aiven reconnection, or concurrent production authentication.

Record the following from browser DevTools, Render logs, and Aiven metrics before and after deployment:
1. First `GET /api/health/live` after idle.
2. First `GET /api/health/ready` after idle.
3. First public API GET.
4. Login and registration POST latency (never replay a timed-out POST blindly).
5. Dashboard endpoint latency.
6. First request after an Aiven interruption.
7. Subsequent warm GET latency.
8. Concurrent login latency and DB active/idle connection counts.

For each, record UTC timestamp, HTTP status, total duration, and whether it was a cold or warm request. Do not log passwords, JWTs, or connection strings.

### Build execution in this environment

- `pom.xml` XML parse: passed.
- `node --check frontend/src/api/axiosInstance.js`: passed.
- Maven compile: not run to completion. The Maven wrapper could not download Maven 3.9.16 from Maven Central in this restricted environment (`wget: Failed to fetch`).
- `npm ci`: timed out while attempting dependency installation.
- `npm run build`: not completed because Vite was unavailable after the install timeout (`vite: not found`).
- Integration/auth/database tests: not run because no production Aiven credentials or network access were supplied.

No measured latency values are published here because this environment cannot run against the production services. Run the README verification commands locally after dependency installation before deploying.
