import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(import.meta.dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const checks = [
  ['Super Admin routes exist', (fs.existsSync(path.join(root, 'frontend/src/features/workspace/WorkspaceRoutes.jsx')) && read('frontend/src/features/workspace/WorkspaceRoutes.jsx').includes('superadmin')) || read('frontend/src/features/workspace/WorkspaceRouter.jsx').includes('superadmin') || read('frontend/src/features/workspace/WorkspaceScreens.jsx').includes('superadmin')],
  ['Platform role UI exists', read('frontend/src/features/workspace/WorkspaceScreens.jsx').includes('PlatformRoleAssignment')],
  ['Organization management screens exist', read('frontend/src/features/workspace/WorkspaceScreens.jsx').includes('OrganizationDirectory')],
  ['Admin controller is role protected', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes("hasRole('SUPER_ADMIN')")],
  ['Platform overview endpoint', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/overview')],
  ['Platform user directory endpoint', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/users')],
  ['User details endpoint', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/users/{id}')],
  ['Audit log endpoint with bounded pagination', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('Math.min(size, 100)')],
  ['Role-change endpoint', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/users/{id}/role')],
  ['Last Super Admin protection', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('Cannot demote the last Super Admin')],
  ['Self-demotion protection', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('cannot remove your own Super Admin role')],
  ['Audit log entity exists', fs.existsSync(path.join(root, 'backend/src/main/java/com/srhcodeverse/backend/entity/PlatformAuditLog.java'))],
  ['Audit log repository exists', fs.existsSync(path.join(root, 'backend/src/main/java/com/srhcodeverse/backend/repository/PlatformAuditLogRepository.java'))],
  ['Admin routes secured in security config', read('backend/src/main/java/com/srhcodeverse/backend/config/SecurityConfig.java').includes('/api/admin/**')],
  ['Safe DTO omits password fields', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('private Map<String, Object> safeUser')],
  ['Frontend overview API client', read('frontend/src/api/platformAdminApi.js').includes('getPlatformOverview')],
  ['Frontend role update API client', read('frontend/src/api/platformAdminApi.js').includes('updatePlatformUserRole')],
  ['Frontend audit log API client', read('frontend/src/api/platformAdminApi.js').includes('getPlatformAuditLogs')],
  ['Persistent organization entity and repository', fs.existsSync(path.join(root, 'backend/src/main/java/com/srhcodeverse/backend/entity/PlatformOrganization.java')) && fs.existsSync(path.join(root, 'backend/src/main/java/com/srhcodeverse/backend/repository/PlatformOrganizationRepository.java'))],
  ['Organization lifecycle REST endpoints', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/organizations/{id}/status')],
  ['Organization creation validates and enforces unique slug', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('Organization slug already exists')],
  ['Paginated user search repository query', read('backend/src/main/java/com/srhcodeverse/backend/repository/UserRepository.java').includes('findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase')],
  ['Paginated user directory endpoint', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('/users/page')],
  ['Audit events capture actor user id', read('backend/src/main/java/com/srhcodeverse/backend/controller/admin/PlatformAdminController.java').includes('actorUserId(actorId)')],
  ['Frontend organization APIs', read('frontend/src/api/platformAdminApi.js').includes('createPlatformOrganization') && read('frontend/src/api/platformAdminApi.js').includes('updatePlatformOrganizationStatus')],
  ['Live organization admin UI wired to APIs', read('frontend/src/features/workspace/WorkspaceScreens.jsx').includes('PlatformOrganizationsLive')],
  ['SQL migration included for production schema', fs.existsSync(path.join(root, 'backend/src/main/resources/db/migration/007_platform_organizations_and_admin_audit.sql'))],
]
let pass = 0
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (ok) pass++ }
console.log(`\nStage 7/8 static checks: ${pass}/${checks.length} passed, ${checks.length-pass} failed`)
if (pass !== checks.length) process.exitCode = 1
