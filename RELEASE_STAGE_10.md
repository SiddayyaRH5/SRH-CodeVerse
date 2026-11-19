# Stage 9 & 10 — QA and Release Checklist

## Stage 9 — QA

### Automated checks
- Frontend unit/component tests: `cd frontend && npm ci && npm test`
- Frontend production build: `cd frontend && npm run build`
- Backend tests: `cd backend && ./mvnw -B test` (Windows: `mvnw.cmd -B test`)
- Static verifiers: run the scripts listed below from the repository root.

### Static verifier command set
```bash
node scripts/verify-foundation.mjs
node scripts/verify-stage-3-4.mjs
node scripts/verify-stage-5.mjs
node scripts/verify-stages-5-6.mjs
node scripts/verify-stage-7-8.mjs
node scripts/verify-stage-9.mjs
node scripts/verify-stage-10.mjs
```

Static checks are structural assertions, not substitutes for runtime QA, browser accessibility checks, API integration tests, or security review.

### Manual smoke test (staging)
1. Load the home page in a clean browser session and verify no fatal console errors.
2. Register/login/logout and check protected-route behavior.
3. Check Student pages: course browse/detail, lesson, problem execution/submission, profile/settings, notifications.
4. Check Trainer and Organization Admin navigation and role-based access.
5. Check Super Admin users, role-change safeguards, organizations, and audit log.
6. Check mobile widths and keyboard navigation for dialogs, forms, menus, and tables.
7. Verify API failure, slow-loading, empty-data, and expired-session states.
8. Confirm no test/demo credentials or secret values appear in deployed assets.

## Stage 10 — Release

### Before release
- [ ] Frontend tests pass in CI.
- [ ] Frontend production build passes.
- [ ] Backend Maven tests pass in CI.
- [ ] Static verifier scripts pass.
- [ ] Production DB backup/restore plan confirmed.
- [ ] Database migrations reviewed and applied in staging first.
- [ ] Environment variables validated without printing secret values.
- [ ] CORS origins and OAuth callback URLs verified.
- [ ] JWT secret is strong, unique, and not checked into source.
- [ ] Execution service/container isolation and resource limits reviewed.
- [ ] Admin endpoints checked with non-admin and admin accounts.
- [ ] Tenant/organization data separation independently tested.
- [ ] Smoke tests passed on the deployed frontend/backend.
- [ ] Rollback instructions and owner documented.

### Release artifacts
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Backend liveness workflow retained: `.github/workflows/backend-health-ping.yml`
- Environment setup: `ENVIRONMENT_SETUP.md`

**Release status is not automatically green.** Checkboxes above require evidence from actual deployment and testing. The CI workflow runs checks on GitHub; a local static-verifier pass does not indicate that GitHub CI has run.
