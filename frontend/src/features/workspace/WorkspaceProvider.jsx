import { useCallback, useMemo, useReducer, useState } from "react"
import { DEMO_MEMBERSHIPS, PORTALS } from "./demoData"
import { demoWorkspaceService } from "./demoService"
import { WorkspaceContext } from "./workspaceContext"
import {
  readWorkspacePreviewEnabled,
  writeWorkspacePreviewEnabled,
} from "./workspacePolicy"

export function WorkspaceProvider({ children }) {
  const [activePortal, setActivePortal] = useState("student")
  const [activeOrganizationId, setActiveOrganizationId] = useState("org-bluepeak")
  const [studentMode, setStudentMode] = useState("organization")
  const [demoPreviewEnabled, setDemoPreviewEnabled] = useState(readWorkspacePreviewEnabled)
  const [, refresh] = useReducer((current) => current + 1, 0)
  const isIndependentStudent = activePortal === "student" && studentMode === "independent"
  const snapshot = demoWorkspaceService.getSnapshot(
    isIndependentStudent ? null : activeOrganizationId,
    isIndependentStudent,
    activePortal === "superadmin",
  )

  const availableOrganizations = useMemo(() => {
    const membershipIds = activePortal === "superadmin"
      ? snapshot.organizations.map((organization) => organization.id)
      : (DEMO_MEMBERSHIPS[activePortal] ?? [])
    return snapshot.organizations.filter((organization) =>
      membershipIds.includes(organization.id),
    )
  }, [activePortal, snapshot.organizations])

  const selectPortal = useCallback((portal) => {
    if (!PORTALS[portal]) return
    setActivePortal(portal)
    const availableIds = DEMO_MEMBERSHIPS[portal] ?? []
    setActiveOrganizationId((currentId) =>
      availableIds.includes(currentId) ? currentId : (availableIds[0] ?? currentId),
    )
  }, [])

  const mutate = useCallback(async (operation, ...args) => {
    const result = await demoWorkspaceService[operation](...args)
    refresh()
    return result
  }, [])

  // Demo preview is a session-scoped UI choice. It never changes the signed-in
  // account, its role, or any backend permission.
  const enableDemoPreview = useCallback(() => {
    writeWorkspacePreviewEnabled(true)
    setDemoPreviewEnabled(true)
  }, [])

  const disableDemoPreview = useCallback(() => {
    writeWorkspacePreviewEnabled(false)
    setDemoPreviewEnabled(false)
  }, [])

  const activeOrganization =
    snapshot.organizations.find((organization) => organization.id === activeOrganizationId) ??
    snapshot.organizations[0]

  const value = useMemo(
    () => ({
      activeOrganization,
      activeOrganizationId,
      activePortal,
      availableOrganizations,
      data: snapshot,
      demoPreviewEnabled,
      demoUser: {
        displayName: "Demo User",
        roles: Object.values(PORTALS).map((portal) => portal.role),
        memberships: DEMO_MEMBERSHIPS,
      },
      disableDemoPreview,
      enableDemoPreview,
      mutate,
      selectPortal,
      setActiveOrganizationId,
      setStudentMode,
      studentMode,
    }),
    [
      activeOrganization,
      activeOrganizationId,
      activePortal,
      availableOrganizations,
      demoPreviewEnabled,
      disableDemoPreview,
      enableDemoPreview,
      mutate,
      selectPortal,
      snapshot,
      studentMode,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
