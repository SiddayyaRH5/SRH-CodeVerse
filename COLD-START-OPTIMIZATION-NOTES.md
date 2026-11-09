# SRH CodeVerse cold-start optimization notes

## What changed in this package

1. Preserves the previously applied performance configuration and public liveness/readiness endpoints.
2. Includes the latest `ProblemService` and `SubmissionService` transaction-boundary changes from commit `1a60623`.
3. Makes the large course-content seed pass opt-in. It previously ran as a `CommandLineRunner` on every Spring Boot start and scanned the bundled course JSON while checking related database rows. On an already-populated production database this is unnecessary work during every Render cold start.
4. Adds `CODEVERSE_CONTENT_SEED_ON_STARTUP` (default `false`). For a genuinely fresh/empty database only, set it to `true` for the initial seed, wait for a successful deployment and startup, then set it back to `false`.
5. Updates the GitHub Actions best-effort health ping to run every five minutes and use the public process-liveness endpoint. GitHub scheduled workflows can be delayed, so this cannot guarantee continuous availability.

## Render environment variables

Keep the existing required production variables unchanged, including `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`. Do not put credentials in source control.

For the existing populated Aiven production database, use:

- `CODEVERSE_CONTENT_SEED_ON_STARTUP=false` (or leave it unset; false is the default).
- Keep the existing `DB_POOL_MAX_SIZE` and `DB_POOL_MIN_IDLE` values unless measurements show a need to change them.

For a fresh database that needs the bundled course content:

1. Set `CODEVERSE_CONTENT_SEED_ON_STARTUP=true` temporarily.
2. Deploy and wait for startup logs to confirm the course-content seed completed.
3. Set it back to `false` and redeploy.

Do not enable the seed on every restart: it is intended as an initial/repair operation, not a keep-alive mechanism.

## Important Render Free limitation

Render Free web services spin down after a period without inbound traffic. A scheduled GitHub Actions request can reduce idle spin-down if the workflow runs on time, but GitHub may delay scheduled runs and this is not an uptime guarantee. A consistently available production backend requires an always-on paid instance or another hosting plan without free-tier spin-down.

## Verification required after deployment

- Check GitHub Actions: `SRH CodeVerse backend health ping` should run and pass on its schedule.
- Check Render logs for the `Started ...Application` line and any Hikari/MySQL warnings.
- Compare first and second requests to `/api/health/live` after inactivity.
- Measure the `/api/auth/...` login request in browser DevTools Network timing.
- Verify public course content and problem details, then test login and dashboard with a real account.

This ZIP is a source-code optimization package. Production behavior still depends on Render's service plan, GitHub scheduled-run reliability, Aiven connectivity, environment variables and the actual deployed database state.
