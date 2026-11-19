# Stage 1 — Project Foundation & Audit (Verified Source Inventory)

## Scope
Source-level review of the existing SRH CodeVerse React/Vite frontend, shared workspace portal architecture, navigation configuration, demo preview data/service boundary, student/trainer API and page areas, backend Spring Boot tree, and project manifests.

## Architecture
- Five portal identifiers: `student`, `trainer`, `employee` (Professional), `organization` (Organization Admin), and `superadmin`.
- Shared workspace shell/routing/context/access/screen modules: `WorkspaceRouter`, `WorkspaceLayout`, `WorkspaceProvider`, `WorkspaceAccess`, `WorkspaceScreens`, `WorkspaceSelect`, `WorkspacePolicy`.
- Student and Trainer have dedicated page and API modules. The other portals currently use the shared workspace screen/resource model; this audit does not imply all portal pages are production API-backed.
- `demoData.js` and `demoService.js` support preview/demo workflows. Demo actions and data are not equivalent to database persistence.
- API modules under `frontend/src/api/` cover the existing Student/Trainer application paths; complete API/backend feature parity is a later integration-stage deliverable.

## Portal navigation inventory

The navigation configuration in `frontend/src/features/workspace/demoData.js` was checked for all five portal keys. The counts below are based on the configured navigation entries.

- Student: 17 items
- Trainer: 19 items
- Professional/Employee: 27 items
- Organization Admin: 27 items
- Super Admin: 12 items

The full route/navigation configuration remains in `demoData.js` and is the source of truth. The routing layer normalizes the `/workspace/professional` alias to the canonical employee portal.

## Audit findings and boundaries
1. Demo preview and authenticated workspace are distinct flows and must remain clearly labeled.
2. Demo resources/actions must not be described as database persistence.
3. Every navigation item must render a screen; existing route/navigation regression tests cover representative entries across all portals and not-found behavior.
4. Student/Trainer production features and shared portal demo screens have different backend coverage; no full API parity is claimed.
5. Backend endpoint authorization, multi-tenant data isolation, and workflow integration need dedicated integration-stage verification.
6. Source inventory is verified; live browser inspection of every page is not possible in this environment because frontend dependencies could not be installed.

## Stage 1 exit criteria
- [x] Five portal identities documented and cross-checked against navigation configuration.
- [x] Shared workspace routing/layout/context/access/screen architecture inventoried.
- [x] Student/Trainer dedicated page and API areas inventoried.
- [x] Demo vs server-backed boundary documented.
- [x] Package manifests and key source/test areas inventoried.
- [x] Existing route, navigation, demo-mode, and demo-service test files located.
- [x] Dependency-free foundation audit script created and run successfully.
- [ ] Runtime/browser page-by-page behavior verification — blocked by unavailable dependency install/browser runtime.
- [ ] Complete endpoint and tenant-authorization matrix — deferred to integration stage.

**Stage 1 status:** Source audit/inventory and foundation checks are complete. Runtime and full backend integration coverage are explicitly not part of this foundation checkpoint.
