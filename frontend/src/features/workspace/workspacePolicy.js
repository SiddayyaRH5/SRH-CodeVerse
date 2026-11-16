import { PORTALS } from "./demoData"

// Session-scoped flag that marks the workspace as being viewed in "demo preview" mode.
// It never changes the signed-in account, its role, or any backend permission.
export const WORKSPACE_PREVIEW_STORAGE_KEY = "srhcodeverse_workspace_demo_preview"

// URL aliases for workspace portals. The canonical key is the one used internally
// (role mapping, demo data, navigation). The alias keeps the approved product name
// "Professional" reachable without breaking the existing /workspace/employee/* URLs.
export const PORTAL_ALIASES = {
  professional: "employee",
}

export function resolvePortal(portal) {
  if (!portal) return portal
  return PORTAL_ALIASES[portal] ?? portal
}

// Production roles that own each workspace portal.
//
// Only STUDENT and TRAINER are real SRH CodeVerse roles today (see the backend
// Role/DataSeeder). EMPLOYEE, ORG_ADMIN and SUPER_ADMIN exist in the demo
// workspace only, so no production account can hold them. The mapping below is
// therefore a front-end navigation policy, not a source of authorization.
export const WORKSPACE_PORTAL_ROLES = {
  student: ["STUDENT"],
  trainer: ["TRAINER"],
  employee: ["EMPLOYEE"],
  organization: ["ORG_ADMIN"],
  superadmin: ["SUPER_ADMIN"],
}

const PORTAL_BY_ROLE = Object.entries(WORKSPACE_PORTAL_ROLES).reduce((accumulator, [portal, roles]) => {
  for (const role of roles) accumulator[role] = portal
  return accumulator
}, {})

export function isKnownPortal(portal) {
  const canonical = resolvePortal(portal)
  return Boolean(PORTALS[canonical])
}

export function isPortalEntitled(portal, role) {
  if (!role) return false
  const canonical = resolvePortal(portal)
  return (WORKSPACE_PORTAL_ROLES[canonical] ?? []).includes(role)
}

export function portalForRole(role) {
  return PORTAL_BY_ROLE[role] ?? "student"
}

export function readWorkspacePreviewEnabled() {
  try {
    return window.sessionStorage.getItem(WORKSPACE_PREVIEW_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function writeWorkspacePreviewEnabled(enabled) {
  try {
    if (enabled) {
      window.sessionStorage.setItem(WORKSPACE_PREVIEW_STORAGE_KEY, "true")
    } else {
      window.sessionStorage.removeItem(WORKSPACE_PREVIEW_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode, disabled cookies). The workspace
    // still works, it just cannot remember the preview choice between reloads.
  }
}
