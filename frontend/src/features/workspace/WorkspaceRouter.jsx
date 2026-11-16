import { useEffect } from "react"
import { Navigate, useParams } from "react-router-dom"
import { PORTALS } from "./demoData"
import { useWorkspace } from "./useWorkspace"
import { portalForRole, resolvePortal } from "./workspacePolicy"
import { useAuth } from "../../context/AuthContext"
import WorkspaceLayout from "./WorkspaceLayout"
import WorkspaceScreens from "./WorkspaceScreens"

function WorkspaceRouter() {
  const { portal: rawPortal, "*": routePath = "dashboard" } = useParams()
  // Normalise aliases (/workspace/professional -> the employee portal) so the
  // rest of the component and the layout always work with the canonical key.
  const portal = resolvePortal(rawPortal)
  const { selectPortal } = useWorkspace()
  const { user } = useAuth()

  useEffect(() => {
    if (PORTALS[portal]) selectPortal(portal)
  }, [portal, selectPortal])

  if (!PORTALS[portal]) {
    const homePortal = portalForRole(user?.role)
    return <Navigate to={`/workspace/${homePortal}/dashboard`} replace />
  }
  const [screen = "dashboard", ...routeParts] = routePath.split("/").filter(Boolean)

  return (
    <WorkspaceLayout portal={portal}>
      <WorkspaceScreens portal={portal} screen={screen} routeParts={routeParts} />
    </WorkspaceLayout>
  )
}

export default WorkspaceRouter
