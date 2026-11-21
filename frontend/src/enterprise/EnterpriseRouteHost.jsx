import React from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext.jsx'
import { AdminWorkspace } from './workspaces/admin/AdminWorkspace.jsx'
import { ProfessionalWorkspace } from './workspaces/professional/ProfessionalWorkspace.jsx'
import { TeamLeadWorkspace } from './workspaces/teamlead/TeamLeadWorkspace.jsx'
import { EmployeeWorkspace } from './workspaces/employee/EmployeeWorkspace.jsx'
import { SuperAdminWorkspace } from './workspaces/superadmin/SuperAdminWorkspace.jsx'
import './enterprise.css'


function EnterpriseContent() {
  const { workspace } = useWorkspace()
  if (workspace === 'professional') return <ProfessionalWorkspace />
  if (workspace === 'team_lead') return <TeamLeadWorkspace />
  if (workspace === 'employee') return <EmployeeWorkspace />
  return <AdminWorkspace />
}


export default function EnterpriseRouteHost() {
  const { workspace: routeWorkspace } = useParams()
  const location = useLocation()
  const initialWorkspace = ['admin', 'professional', 'team_lead', 'employee'].includes(routeWorkspace)
    ? routeWorkspace
    : 'admin'
  if (routeWorkspace === 'superadmin' || location.pathname === '/platform/console') return <SuperAdminWorkspace />
  return (
    <WorkspaceProvider initialWorkspace={initialWorkspace}>
      <EnterpriseContent />
    </WorkspaceProvider>
  )
}
