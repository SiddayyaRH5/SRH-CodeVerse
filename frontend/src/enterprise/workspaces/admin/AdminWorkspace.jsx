import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  Download,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Network,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  UsersRound,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import { paginateItems } from '../../lib/workspaceRules.js';
import { DemoShell } from '../../components/demo/DemoShell.jsx';
import {
  ConfirmDialog,
  DataTable,
  DemoButton,
  DemoInput,
  DemoSelect,
  DemoTextarea,
  ErrorBanner,
  FormField,
  MetricTile,
  ModalDialog,
  PageHeader,
  Panel,
  SearchInput,
  SlideDrawer,
  StatusLabel,
  WorkspaceSkeleton,
  formatRelativeTime,
  formatShortDate,
} from '../../components/demo/ui.jsx';

export function AdminWorkspace() {
  const { snapshot, loading, error, refresh, auth, runMutation, notify } = useWorkspace();
  const [section, setSection] = useState('dashboard');

  // Employee Directory state
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('ALL');
  const [empRoleFilter, setEmpRoleFilter] = useState('ALL');
  const [empStatusFilter, setEmpStatusFilter] = useState('ALL');
  const [empSortBy, setEmpSortBy] = useState('name');
  const [empSortDir, setEmpSortDir] = useState('asc');
  const [empPage, setEmpPage] = useState(1);
  const [empDrawer, setEmpDrawer] = useState(null);
  const [empEdit, setEmpEdit] = useState({ title: '', role: 'EMPLOYEE', status: 'ACTIVE', departmentId: '', teamId: '' });
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', title: '', role: 'EMPLOYEE', departmentId: '', teamId: '', location: '' });

  // Invitation state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'PROFESSIONAL', departmentId: '', teamId: '' });
  const [cancelInviteTarget, setCancelInviteTarget] = useState(null);

  // Department state
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', headId: '', budgetCode: '', description: '' });
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);

  // Team state
  const [teamOpen, setTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', departmentId: '', leadId: '', description: '', memberIds: [] });
  const [deleteTeamTarget, setDeleteTeamTarget] = useState(null);

  // Project state
  const [projOpen, setProjOpen] = useState(false);
  const [projForm, setProjForm] = useState({ name: '', code: '', teamId: '', priority: 'HIGH', dueDate: '', budgetHours: '160', description: '' });

  // Org Settings state
  const [orgForm, setOrgForm] = useState(null);

  useEffect(() => {
    if (snapshot?.activeOrg) {
      setOrgForm({
        name: snapshot.activeOrg.name,
        industry: snapshot.activeOrg.industry,
        domain: snapshot.activeOrg.domain,
        timezone: snapshot.activeOrg.timezone,
        location: snapshot.activeOrg.location,
        workWeek: snapshot.activeOrg.workWeek,
        standardStart: snapshot.activeOrg.attendancePolicy.standardStart,
        standardEnd: snapshot.activeOrg.attendancePolicy.standardEnd,
        graceMinutes: snapshot.activeOrg.attendancePolicy.graceMinutes,
        allowRemoteCheckIn: snapshot.activeOrg.attendancePolicy.allowRemoteCheckIn,
      });
    }
  }, [snapshot?.activeOrg]);

  const employees = snapshot?.employees || [];
  const departments = snapshot?.departments || [];
  const teams = snapshot?.teams || [];
  const invitations = snapshot?.invitations || [];
  const projects = snapshot?.projects || [];
  const activities = snapshot?.activities || [];
  const reports = snapshot?.reports;

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    const list = employees.filter((e) => {
      if (empDeptFilter !== 'ALL' && e.departmentId !== empDeptFilter) return false;
      if (empRoleFilter !== 'ALL' && e.role !== empRoleFilter) return false;
      if (empStatusFilter !== 'ALL' && e.status !== empStatusFilter) return false;
      if (q) {
        const hay = `${e.name} ${e.email} ${e.employeeCode} ${e.title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = empSortDir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      if (empSortBy === 'role') return a.role.localeCompare(b.role) * dir;
      if (empSortBy === 'status') return a.status.localeCompare(b.status) * dir;
      if (empSortBy === 'joinedAt') return a.joinedAt.localeCompare(b.joinedAt) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [employees, empSearch, empDeptFilter, empRoleFilter, empStatusFilter, empSortBy, empSortDir]);

  const pagedEmployees = useMemo(() => paginateItems(filteredEmployees, empPage, 8), [filteredEmployees, empPage]);

  const pendingInvitesCount = invitations.filter((i) => i.status === 'PENDING').length;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, badge: employees.length },
    { id: 'invitations', label: 'Invitations', icon: Mail, badge: pendingInvitesCount },
    { id: 'departments', label: 'Departments', icon: Network },
    { id: 'teams', label: 'Teams', icon: UsersRound },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'activity', label: 'Audit Log', icon: Activity },
    { id: 'settings', label: 'Organization Settings', icon: Settings },
  ];

  const handleEmpSort = (key) => {
    if (empSortBy === key) setEmpSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setEmpSortBy(key);
      setEmpSortDir('asc');
    }
  };

  const openEmpDrawer = (emp) => {
    setEmpDrawer(emp);
    setEmpEdit({
      title: emp.title,
      role: emp.role,
      status: emp.status,
      departmentId: emp.departmentId,
      teamId: emp.teamId || '',
    });
  };

  const saveEmployeeEdit = async () => {
    if (!empDrawer) return;
    const res = await runMutation(
      () =>
        apiClient.updateEmployee(auth, empDrawer.id, {
          ...empEdit,
          teamId: empEdit.teamId || null,
        }),
      `Updated ${empDrawer.name}.`
    );
    if (res.ok) setEmpDrawer(null);
  };

  const submitNewEmployee = async (e) => {
    e.preventDefault();
    const res = await runMutation(
      () =>
        apiClient.createEmployee(auth, {
          ...newEmp,
          departmentId: newEmp.departmentId || departments[0]?.id,
          teamId: newEmp.teamId || null,
          password: newEmp.password || '',
        }),
      `Added ${newEmp.name} to employee directory.`
    );
    if (res.ok) {
      setAddEmpOpen(false);
      setNewEmp({ name: '', email: '', title: '', role: 'EMPLOYEE', departmentId: '', teamId: '', location: '', password: '' });
    }
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    const res = await runMutation(
      () =>
        apiClient.createInvitation(auth, {
          ...inviteForm,
          departmentId: inviteForm.departmentId || departments[0]?.id,
          teamId: inviteForm.teamId || null,
        }),
      `Invitation sent to ${inviteForm.email}.`
    );
    if (res.ok) {
      setInviteOpen(false);
      setInviteForm({ name: '', email: '', role: 'PROFESSIONAL', departmentId: '', teamId: '' });
    }
  };

  const submitDepartment = async (e) => {
    e.preventDefault();
    const res = await runMutation(
      () => apiClient.createDepartment(auth, deptForm),
      `Department "${deptForm.name}" created.`
    );
    if (res.ok) {
      setDeptOpen(false);
      setDeptForm({ name: '', code: '', headId: '', budgetCode: '', description: '' });
    }
  };

  const openTeamModal = (team = null) => {
    setEditingTeam(team);
    if (team) {
      setTeamForm({
        name: team.name,
        departmentId: team.departmentId,
        leadId: team.leadId || '',
        description: team.description,
        memberIds: [...team.memberIds],
      });
    } else {
      setTeamForm({
        name: '',
        departmentId: departments[0]?.id || '',
        leadId: '',
        description: '',
        memberIds: [],
      });
    }
    setTeamOpen(true);
  };

  const toggleTeamMember = (empId) => {
    setTeamForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(empId)
        ? prev.memberIds.filter((id) => id !== empId)
        : [...prev.memberIds, empId],
    }));
  };

  const submitTeam = async (e) => {
    e.preventDefault();
    const action = editingTeam
      ? () => apiClient.updateTeam(auth, editingTeam.id, teamForm)
      : () => apiClient.createTeam(auth, teamForm);
    const res = await runMutation(
      action,
      editingTeam ? `Updated team "${teamForm.name}".` : `Created team "${teamForm.name}".`
    );
    if (res.ok) setTeamOpen(false);
  };

  const submitProject = async (e) => {
    e.preventDefault();
    const res = await runMutation(
      () =>
        apiClient.createProject(auth, {
          ...projForm,
          teamId: projForm.teamId || teams[0]?.id,
          budgetHours: Number(projForm.budgetHours || 160),
        }),
      `Created project "${projForm.name}".`
    );
    if (res.ok) {
      setProjOpen(false);
      setProjForm({ name: '', code: '', teamId: '', priority: 'HIGH', dueDate: '', budgetHours: '160', description: '' });
    }
  };

  const saveOrgSettings = async (e) => {
    e.preventDefault();
    if (!orgForm) return;
    await runMutation(
      () =>
        apiClient.updateOrganization(auth, {
          name: orgForm.name,
          industry: orgForm.industry,
          domain: orgForm.domain,
          timezone: orgForm.timezone,
          location: orgForm.location,
          workWeek: orgForm.workWeek,
          attendancePolicy: {
            standardStart: orgForm.standardStart,
            standardEnd: orgForm.standardEnd,
            graceMinutes: Number(orgForm.graceMinutes),
            allowRemoteCheckIn: orgForm.allowRemoteCheckIn,
          },
        }),
      'Organization profile and attendance policy saved.'
    );
  };

  const exportReportsCsv = () => {
    if (!reports || !snapshot?.activeOrg) return;
    const orgSlug = snapshot.activeOrg.slug;
    const rows = [
      ['Project Code', 'Project Name', 'Status', 'Progress %', 'Completed Tasks', 'Total Tasks', 'Overdue', 'Logged Hours', 'Budget Hours'],
      ...reports.projectHealth.map((p) => [
        p.code,
        `"${p.name.replace(/"/g, '""')}"`,
        p.status,
        p.progress,
        p.completedTasks,
        p.totalTasks,
        p.overdueTasks,
        p.loggedHours,
        p.budgetHours,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${orgSlug}-org-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('success', `Exported ${orgSlug}-org-report.csv`);
  };

  const renderContent = () => {
    if (loading && !snapshot) return <WorkspaceSkeleton />;
    if (error && !snapshot) return <ErrorBanner message={error} onRetry={refresh} />;
    if (!snapshot || !snapshot.activeOrg || !reports) {
      return (
        <Panel title="No Organization Found">
          <p className="text-sm text-[var(--demo-text-secondary)]">
            The Spring Boot backend returned no active organization records in MySQL. Create an organization in the database to initialize this workspace.
          </p>
        </Panel>
      );
    }

    if (section === 'dashboard') {
      const s = reports.summary;
      return (
        <div className="space-y-6">
          <PageHeader
            title={`${snapshot.activeOrg.name} — Admin Overview`}
            subtitle={`${snapshot.activeOrg.industry} • ${snapshot.activeOrg.location} • ${snapshot.activeOrg.timezone}`}
            actions={
              <>
                <DemoButton variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
                  <Mail className="w-4 h-4" />
                  Invite Member
                </DemoButton>
                <DemoButton size="sm" onClick={() => setAddEmpOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Employee
                </DemoButton>
              </>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Active Employees"
              value={s.activeEmployees}
              subtext={`${s.totalEmployees} total across ${s.departmentsCount} departments`}
              icon={Users}
              onClick={() => setSection('employees')}
            />
            <MetricTile
              label="Active Projects"
              value={s.activeProjects}
              subtext={`${s.completedTasks}/${s.totalTasks} tasks done • ${s.overdueTasks} overdue`}
              icon={FolderKanban}
              onClick={() => setSection('projects')}
            />
            <MetricTile
              label="Pending Invitations"
              value={s.pendingInvitations}
              subtext="Awaiting onboarding acceptance"
              icon={Mail}
              onClick={() => setSection('invitations')}
            />
            <MetricTile
              label="Attendance Today"
              value={`${s.attendanceRate}%`}
              subtext={`${s.totalLoggedHours}h logged • ${s.pendingApprovals} pending approvals`}
              icon={BarChart3}
              onClick={() => setSection('reports')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Panel
              title="Project Delivery Health"
              subtitle="Live task completion and budget burn across active teams."
              className="lg:col-span-2"
              bodyClassName="p-0"
              actions={
                <DemoButton size="xs" variant="secondary" onClick={() => setSection('projects')}>
                  Manage Projects
                </DemoButton>
              }
            >
              <DataTable
                columns={[
                  {
                    key: 'name',
                    label: 'Project',
                    render: (p) => (
                      <div>
                        <span className="font-mono text-xs text-[var(--demo-accent-text)] mr-2">{p.code}</span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    ),
                  },
                  { key: 'status', label: 'Status', render: (p) => <StatusLabel value={p.status} /> },
                  {
                    key: 'progress',
                    label: 'Progress',
                    render: (p) => (
                      <div className="w-28">
                        <div className="text-xs tabular-nums text-[var(--demo-text-muted)] mb-1">{p.progress}%</div>
                        <div className="h-1.5 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                          <div className="h-full bg-[var(--demo-accent)]" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'hours',
                    label: 'Logged / Budget',
                    render: (p) => (
                      <span className="tabular-nums text-xs text-[var(--demo-text-secondary)]">
                        {p.loggedHours}h / {p.budgetHours}h
                      </span>
                    ),
                  },
                ]}
                rows={reports.projectHealth}
                keyField="projectId"
              />
            </Panel>

            <Panel
              title="Department Headcount"
              subtitle="Distribution across business units"
              actions={
                <DemoButton size="xs" variant="ghost" onClick={() => setSection('departments')}>
                  View All
                </DemoButton>
              }
            >
              <div className="space-y-4">
                {reports.departmentDistribution.map((dept) => {
                  const pct = s.totalEmployees > 0 ? Math.round((dept.employeeCount / s.totalEmployees) * 100) : 0;
                  return (
                    <div key={dept.departmentId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--demo-text)]">{dept.departmentName}</span>
                        <span className="tabular-nums text-[var(--demo-text-muted)]">
                          {dept.employeeCount} people ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--demo-accent)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <Panel
            title="Recent Organization Audit Events"
            subtitle="All organization-scoped mutations are logged with actor attribution."
            actions={
              <DemoButton size="xs" variant="secondary" onClick={() => setSection('activity')}>
                Full Audit Log
              </DemoButton>
            }
            bodyClassName="p-0"
          >
            <div className="divide-y divide-[var(--demo-border)]">
              {activities.slice(0, 6).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--demo-text)]">{a.actorName}</span>{' '}
                    <span className="text-[var(--demo-text-secondary)]">{a.action}</span>
                    <span className="text-[var(--demo-text-muted)] ml-2">({a.target})</span>
                  </div>
                  <span className="text-[var(--demo-text-muted)] shrink-0 tabular-nums">
                    {formatRelativeTime(a.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      );
    }

    if (section === 'employees') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Employee Directory"
            subtitle="Manage organization members, roles, departments, teams, and active status."
            actions={
              <DemoButton onClick={() => setAddEmpOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Employee
              </DemoButton>
            }
          />

          <Panel
            title={`Employees (${filteredEmployees.length})`}
            bodyClassName="p-0"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={empSearch}
                  onChange={(v) => { setEmpSearch(v); setEmpPage(1); }}
                  placeholder="Search name, code, email..."
                  className="w-52"
                />
                <DemoSelect
                  aria-label="Filter by department"
                  value={empDeptFilter}
                  onChange={(e) => { setEmpDeptFilter(e.target.value); setEmpPage(1); }}
                  className="!w-auto py-1.5 text-xs"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </DemoSelect>
                <DemoSelect
                  aria-label="Filter by role"
                  value={empRoleFilter}
                  onChange={(e) => { setEmpRoleFilter(e.target.value); setEmpPage(1); }}
                  className="!w-auto py-1.5 text-xs"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="EMPLOYEE">Employee</option>
                </DemoSelect>
                <DemoSelect
                  aria-label="Filter by status"
                  value={empStatusFilter}
                  onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpPage(1); }}
                  className="!w-auto py-1.5 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </DemoSelect>
              </div>
            }
          >
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Employee',
                  sortable: true,
                  render: (e) => (
                    <div>
                      <div className="font-medium text-[var(--demo-text)]">{e.name}</div>
                      <div className="text-xs text-[var(--demo-text-muted)]">
                        {e.employeeCode} • {e.email}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'dept',
                  label: 'Department / Team',
                  render: (e) => (
                    <div className="text-xs">
                      <div className="font-medium text-[var(--demo-text)]">{deptMap[e.departmentId]?.name || '—'}</div>
                      <div className="text-[var(--demo-text-muted)]">{e.teamId ? teamMap[e.teamId]?.name : 'No team'}</div>
                    </div>
                  ),
                },
                { key: 'role', label: 'Role', sortable: true, render: (e) => <StatusLabel value={e.role} /> },
                { key: 'status', label: 'Status', sortable: true, render: (e) => <StatusLabel value={e.status} /> },
                { key: 'joinedAt', label: 'Joined', sortable: true, render: (e) => <span className="tabular-nums text-xs">{formatShortDate(e.joinedAt)}</span> },
              ]}
              rows={pagedEmployees.items}
              sortBy={empSortBy}
              sortDir={empSortDir}
              onSort={handleEmpSort}
              page={pagedEmployees.page}
              totalPages={pagedEmployees.totalPages}
              totalItems={pagedEmployees.totalItems}
              onPageChange={setEmpPage}
              onRowClick={openEmpDrawer}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'invitations') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Member Invitations"
            subtitle="Send onboarding invitations with email validation, resend reminders, or revoke pending invites."
            actions={
              <DemoButton onClick={() => setInviteOpen(true)}>
                <Plus className="w-4 h-4" />
                Send Invitation
              </DemoButton>
            }
          />
          <Panel title="Invitation Queue" bodyClassName="p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Invitee',
                  render: (i) => (
                    <div>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-[var(--demo-text-muted)]">{i.email}</div>
                    </div>
                  ),
                },
                { key: 'role', label: 'Assigned Role', render: (i) => <StatusLabel value={i.role} /> },
                { key: 'dept', label: 'Department', render: (i) => <span className="text-xs">{deptMap[i.departmentId]?.name || '—'}</span> },
                { key: 'status', label: 'Status', render: (i) => <StatusLabel value={i.status} /> },
                { key: 'lastSentAt', label: 'Last Sent', render: (i) => <span className="text-xs tabular-nums text-[var(--demo-text-muted)]">{formatRelativeTime(i.lastSentAt)}</span> },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'right',
                  render: (i) =>
                    i.status === 'PENDING' ? (
                      <div className="inline-flex items-center gap-1.5">
                        <DemoButton
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            runMutation(() => apiClient.resendInvitation(auth, i.id), `Resent invite to ${i.email}.`)
                          }
                        >
                          <RefreshCw className="w-3 h-3" />
                          Resend
                        </DemoButton>
                        <DemoButton size="xs" variant="dangerSoft" onClick={() => setCancelInviteTarget(i)}>
                          Revoke
                        </DemoButton>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--demo-text-muted)]">—</span>
                    ),
                },
              ]}
              rows={invitations}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'departments') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Departments"
            subtitle="Organize cost centers, department heads, and organizational structure."
            actions={
              <DemoButton onClick={() => setDeptOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Department
              </DemoButton>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => {
              const count = employees.filter((e) => e.departmentId === dept.id).length;
              const teamCount = teams.filter((t) => t.departmentId === dept.id).length;
              return (
                <Panel
                  key={dept.id}
                  title={`${dept.name} (${dept.code})`}
                  subtitle={`Budget ${dept.budgetCode} • Head: ${empMap[dept.headId]?.name || 'Unassigned'}`}
                  actions={
                    <DemoButton
                      size="xs"
                      variant="dangerSoft"
                      onClick={() => setDeleteDeptTarget(dept)}
                      aria-label={`Delete ${dept.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </DemoButton>
                  }
                >
                  <p className="text-xs text-[var(--demo-text-secondary)] leading-relaxed">
                    {dept.description || 'No description provided.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[var(--demo-border)] flex items-center gap-5 text-xs text-[var(--demo-text-muted)] tabular-nums">
                    <span>{count} employees</span>
                    <span>{teamCount} teams</span>
                    <span>Created {formatShortDate(dept.createdAt)}</span>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      );
    }

    if (section === 'teams') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Teams & Roster Allocation"
            subtitle="Create delivery squads, assign team leads, and sync member rosters."
            actions={
              <DemoButton onClick={() => openTeamModal(null)}>
                <Plus className="w-4 h-4" />
                Create Team
              </DemoButton>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <Panel
                key={team.id}
                title={team.name}
                subtitle={`${deptMap[team.departmentId]?.name || 'Department'} • Lead: ${empMap[team.leadId]?.name || 'Unassigned'}`}
                actions={
                  <div className="flex items-center gap-1.5">
                    <DemoButton size="xs" variant="secondary" onClick={() => openTeamModal(team)}>
                      Edit Roster
                    </DemoButton>
                    <DemoButton
                      size="xs"
                      variant="dangerSoft"
                      onClick={() => setDeleteTeamTarget(team)}
                      aria-label={`Delete ${team.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </DemoButton>
                  </div>
                }
              >
                <p className="text-xs text-[var(--demo-text-secondary)]">{team.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {team.memberIds.map((mId) => (
                    <span
                      key={mId}
                      className="text-xs px-2 py-1 rounded-md border border-[var(--demo-border)] bg-[var(--demo-surface-2)] text-[var(--demo-text-secondary)]"
                    >
                      {empMap[mId]?.name || mId}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--demo-border)] flex justify-between text-xs text-[var(--demo-text-muted)] tabular-nums">
                  <span>{team.memberIds.length} members</span>
                  <span>{team.capacityHoursPerWeek}h/wk capacity</span>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      );
    }

    if (section === 'projects') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Organization Projects"
            subtitle="Track cross-team initiatives, budgets, status transitions, and target dates."
            actions={
              <DemoButton onClick={() => setProjOpen(true)}>
                <Plus className="w-4 h-4" />
                New Project
              </DemoButton>
            }
          />
          <Panel title="Active & Planned Projects" bodyClassName="p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Project',
                  render: (p) => (
                    <div>
                      <span className="font-mono text-xs text-[var(--demo-accent-text)] mr-2">{p.code}</span>
                      <span className="font-medium">{p.name}</span>
                      <div className="text-xs text-[var(--demo-text-muted)] mt-0.5">{teamMap[p.teamId]?.name}</div>
                    </div>
                  ),
                },
                { key: 'priority', label: 'Priority', render: (p) => <StatusLabel value={p.priority} /> },
                {
                  key: 'status',
                  label: 'Status',
                  render: (p) => (
                    <DemoSelect
                      aria-label={`Status for ${p.name}`}
                      value={p.status}
                      onChange={(e) =>
                        runMutation(
                          () => apiClient.updateProject(auth, p.id, { status: e.target.value }),
                          `Updated ${p.code} status.`
                        )
                      }
                      className="!w-auto py-1 text-xs"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </DemoSelect>
                  ),
                },
                { key: 'budgetHours', label: 'Budget', render: (p) => <span className="tabular-nums text-xs">{p.budgetHours}h</span> },
                { key: 'dueDate', label: 'Due Date', render: (p) => <span className="tabular-nums text-xs">{formatShortDate(p.dueDate)}</span> },
              ]}
              rows={projects}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'roles') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Roles & RBAC Permissions Matrix"
            subtitle="Access boundaries enforced across UI navigation and Spring Boot REST controllers."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {snapshot.roles.map((r) => (
              <Panel key={r.role} title={r.label} subtitle={`Scope: ${r.scope}`} actions={<StatusLabel value={r.role} />}>
                <p className="text-xs text-[var(--demo-text-secondary)] leading-relaxed mb-4">
                  {r.description}
                </p>
                <div className="divide-y divide-[var(--demo-border)] border border-[var(--demo-border)] rounded-lg mb-4">
                  {r.permissions.map((perm) => (
                    <div key={perm.module} className="px-3 py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-medium text-[var(--demo-text)]">{perm.module}</div>
                        <div className="text-[var(--demo-text-muted)] mt-0.5">{perm.detail}</div>
                      </div>
                      <StatusLabel value={perm.access} />
                    </div>
                  ))}
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--demo-text-muted)] list-disc pl-4">
                  {r.safeguards.map((sg) => <li key={sg}>{sg}</li>)}
                </ul>
              </Panel>
            ))}
          </div>
        </div>
      );
    }

    if (section === 'reports') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Organization Reports & Export"
            subtitle="Live analytics computed from current tasks, worklogs, attendance, and project budgets."
            actions={
              <DemoButton onClick={exportReportsCsv}>
                <Download className="w-4 h-4" />
                Export CSV Report
              </DemoButton>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Task Status Breakdown">
              <div className="space-y-3">
                {reports.taskStatusBreakdown.map((item) => {
                  const pct = reports.summary.totalTasks
                    ? Math.round((item.count / reports.summary.totalTasks) * 100)
                    : 0;
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <StatusLabel value={item.status} />
                        <span className="tabular-nums text-[var(--demo-text-secondary)]">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                        <div className="h-full bg-[var(--demo-accent)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Member Utilization Snapshot" bodyClassName="p-0">
              <DataTable
                columns={[
                  { key: 'name', label: 'Member', render: (m) => <span className="font-medium text-xs">{m.name}</span> },
                  { key: 'openTasks', label: 'Open', render: (m) => <span className="tabular-nums text-xs">{m.openTasks}</span> },
                  { key: 'loggedHours', label: 'Logged', render: (m) => <span className="tabular-nums text-xs">{m.loggedHours}h</span> },
                  { key: 'utilizationPct', label: 'Utilization', render: (m) => <span className="tabular-nums text-xs font-semibold">{m.utilizationPct}%</span> },
                ]}
                rows={reports.workloadByMember.slice(0, 6)}
                keyField="employeeId"
              />
            </Panel>
          </div>
        </div>
      );
    }

    if (section === 'activity') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Organization Audit Log"
            subtitle="Chronological trail of directory, project, approval, and configuration changes."
          />
          <Panel bodyClassName="p-0">
            <DataTable
              columns={[
                { key: 'timestamp', label: 'Timestamp', render: (a) => <span className="tabular-nums text-xs text-[var(--demo-text-muted)]">{formatRelativeTime(a.timestamp)}</span> },
                { key: 'actorName', label: 'Actor', render: (a) => <span className="font-medium text-xs">{a.actorName}</span> },
                { key: 'category', label: 'Category', render: (a) => <StatusLabel value={a.category} /> },
                { key: 'action', label: 'Action', render: (a) => <span className="text-xs text-[var(--demo-text-secondary)]">{a.action}</span> },
                { key: 'target', label: 'Target', render: (a) => <span className="text-xs text-[var(--demo-text-muted)]">{a.target}</span> },
              ]}
              rows={activities}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'settings' && orgForm) {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Organization Settings"
            subtitle="Update corporate profile, working schedule, and attendance check-in rules."
          />
          <Panel title="Profile & Attendance Policy">
            <form onSubmit={saveOrgSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Organization Name" htmlFor="org-name" required>
                  <DemoInput id="org-name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                </FormField>
                <FormField label="Industry" htmlFor="org-ind">
                  <DemoInput id="org-ind" value={orgForm.industry} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
                </FormField>
                <FormField label="Corporate Domain" htmlFor="org-domain">
                  <DemoInput id="org-domain" value={orgForm.domain} onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })} />
                </FormField>
                <FormField label="Primary Location" htmlFor="org-loc">
                  <DemoInput id="org-loc" value={orgForm.location} onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })} />
                </FormField>
                <FormField label="Timezone" htmlFor="org-tz">
                  <DemoInput id="org-tz" value={orgForm.timezone} onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })} />
                </FormField>
                <FormField label="Work Week" htmlFor="org-week">
                  <DemoInput id="org-week" value={orgForm.workWeek} onChange={(e) => setOrgForm({ ...orgForm, workWeek: e.target.value })} />
                </FormField>
                <FormField label="Standard Shift Start" htmlFor="org-start">
                  <DemoInput id="org-start" type="time" value={orgForm.standardStart} onChange={(e) => setOrgForm({ ...orgForm, standardStart: e.target.value })} />
                </FormField>
                <FormField label="Standard Shift End" htmlFor="org-end">
                  <DemoInput id="org-end" type="time" value={orgForm.standardEnd} onChange={(e) => setOrgForm({ ...orgForm, standardEnd: e.target.value })} />
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--demo-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={orgForm.allowRemoteCheckIn}
                  onChange={(e) => setOrgForm({ ...orgForm, allowRemoteCheckIn: e.target.checked })}
                  className="rounded accent-[var(--demo-accent)]"
                />
                <span>Allow Remote & Hybrid daily attendance check-in</span>
              </label>
              <div className="pt-2 flex justify-end">
                <DemoButton type="submit">
                  <Building2 className="w-4 h-4" />
                  Save Organization Settings
                </DemoButton>
              </div>
            </form>
          </Panel>
        </div>
      );
    }

    return null;
  };

  return (
    <DemoShell
      workspaceTitle="Organization Admin"
      workspaceBadge="Admin Console"
      navItems={navItems}
      activeSection={section}
      onSelectSection={setSection}
    >
      {renderContent()}

      {/* Employee Edit Drawer */}
      <SlideDrawer
        open={Boolean(empDrawer)}
        title={empDrawer?.name || ''}
        subtitle={empDrawer ? `${empDrawer.employeeCode} • ${empDrawer.email}` : ''}
        onClose={() => setEmpDrawer(null)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setEmpDrawer(null)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={saveEmployeeEdit}>Save Changes</DemoButton>
          </>
        }
      >
        {empDrawer && (
          <div className="space-y-4">
            <FormField label="Job Title" htmlFor="edit-emp-title">
              <DemoInput id="edit-emp-title" value={empEdit.title} onChange={(e) => setEmpEdit({ ...empEdit, title: e.target.value })} />
            </FormField>
            <FormField label="Workspace Role" htmlFor="edit-emp-role">
              <DemoSelect id="edit-emp-role" value={empEdit.role} onChange={(e) => setEmpEdit({ ...empEdit, role: e.target.value })}>
                <option value="ORG_ADMIN">Organization Admin</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="EMPLOYEE">Employee</option>
              </DemoSelect>
            </FormField>
            <FormField label="Status" htmlFor="edit-emp-status">
              <DemoSelect id="edit-emp-status" value={empEdit.status} onChange={(e) => setEmpEdit({ ...empEdit, status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </DemoSelect>
            </FormField>
            <FormField label="Department" htmlFor="edit-emp-dept">
              <DemoSelect id="edit-emp-dept" value={empEdit.departmentId} onChange={(e) => setEmpEdit({ ...empEdit, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </DemoSelect>
            </FormField>
            <FormField label="Team" htmlFor="edit-emp-team">
              <DemoSelect id="edit-emp-team" value={empEdit.teamId} onChange={(e) => setEmpEdit({ ...empEdit, teamId: e.target.value })}>
                <option value="">Unassigned</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </DemoSelect>
            </FormField>
          </div>
        )}
      </SlideDrawer>

      {/* Add Employee Modal */}
      <ModalDialog
        open={addEmpOpen}
        title="Add Employee"
        subtitle="Create a new member profile in the active organization."
        onClose={() => setAddEmpOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setAddEmpOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitNewEmployee}>Create Employee</DemoButton>
          </>
        }
      >
        <form onSubmit={submitNewEmployee} className="space-y-3.5">
          <FormField label="Full Name" htmlFor="new-emp-name" required>
            <DemoInput id="new-emp-name" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="e.g. Aisha Khan" />
          </FormField>
          <FormField label="Corporate Email" htmlFor="new-emp-email" required>
            <DemoInput id="new-emp-email" type="email" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="aisha.khan@srhcodeverse.io" />
          </FormField>
          <FormField label="Initial Password" htmlFor="new-emp-password" required>
            <DemoInput id="new-emp-password" type="password" value={newEmp.password || ''} onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })} placeholder="Minimum 8 characters" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Title" htmlFor="new-emp-title">
              <DemoInput id="new-emp-title" value={newEmp.title} onChange={(e) => setNewEmp({ ...newEmp, title: e.target.value })} placeholder="Software Engineer" />
            </FormField>
            <FormField label="Role" htmlFor="new-emp-role">
              <DemoSelect id="new-emp-role" value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                <option value="EMPLOYEE">Employee</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="ORG_ADMIN">Org Admin</option>
              </DemoSelect>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department" htmlFor="new-emp-dept" required>
              <DemoSelect id="new-emp-dept" value={newEmp.departmentId || departments[0]?.id || ''} onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </DemoSelect>
            </FormField>
            <FormField label="Team" htmlFor="new-emp-team">
              <DemoSelect id="new-emp-team" value={newEmp.teamId} onChange={(e) => setNewEmp({ ...newEmp, teamId: e.target.value })}>
                <option value="">No team yet</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </DemoSelect>
            </FormField>
          </div>
        </form>
      </ModalDialog>

      {/* Invite Member Modal */}
      <ModalDialog
        open={inviteOpen}
        title="Invite Organization Member"
        onClose={() => setInviteOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitInvite}>Send Invitation</DemoButton>
          </>
        }
      >
        <form onSubmit={submitInvite} className="space-y-3.5">
          <FormField label="Full Name" htmlFor="inv-name" required>
            <DemoInput id="inv-name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Invitee full name" />
          </FormField>
          <FormField label="Email Address" htmlFor="inv-email" required>
            <DemoInput id="inv-email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="name@srhcodeverse.io" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Role" htmlFor="inv-role">
              <DemoSelect id="inv-role" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                <option value="EMPLOYEE">Employee</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="ORG_ADMIN">Org Admin</option>
              </DemoSelect>
            </FormField>
            <FormField label="Department" htmlFor="inv-dept">
              <DemoSelect id="inv-dept" value={inviteForm.departmentId || departments[0]?.id || ''} onChange={(e) => setInviteForm({ ...inviteForm, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </DemoSelect>
            </FormField>
          </div>
        </form>
      </ModalDialog>

      {/* Create Department Modal */}
      <ModalDialog
        open={deptOpen}
        title="Create Department"
        onClose={() => setDeptOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setDeptOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitDepartment}>Create Department</DemoButton>
          </>
        }
      >
        <form onSubmit={submitDepartment} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Name" htmlFor="dept-name" required className="col-span-2">
              <DemoInput id="dept-name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Cloud Security" />
            </FormField>
            <FormField label="Code" htmlFor="dept-code" required>
              <DemoInput id="dept-code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="SEC" />
            </FormField>
          </div>
          <FormField label="Department Head" htmlFor="dept-head">
            <DemoSelect id="dept-head" value={deptForm.headId} onChange={(e) => setDeptForm({ ...deptForm, headId: e.target.value })}>
              <option value="">Unassigned</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </DemoSelect>
          </FormField>
          <FormField label="Description" htmlFor="dept-desc">
            <DemoTextarea id="dept-desc" value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
          </FormField>
        </form>
      </ModalDialog>

      {/* Create / Edit Team Modal */}
      <ModalDialog
        open={teamOpen}
        title={editingTeam ? `Edit Team — ${editingTeam.name}` : 'Create Team'}
        onClose={() => setTeamOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setTeamOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitTeam}>{editingTeam ? 'Save Roster' : 'Create Team'}</DemoButton>
          </>
        }
      >
        <form onSubmit={submitTeam} className="space-y-3.5">
          <FormField label="Team Name" htmlFor="team-name" required>
            <DemoInput id="team-name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department" htmlFor="team-dept">
              <DemoSelect id="team-dept" value={teamForm.departmentId} onChange={(e) => setTeamForm({ ...teamForm, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </DemoSelect>
            </FormField>
            <FormField label="Team Lead" htmlFor="team-lead">
              <DemoSelect id="team-lead" value={teamForm.leadId} onChange={(e) => setTeamForm({ ...teamForm, leadId: e.target.value })}>
                <option value="">Unassigned</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </DemoSelect>
            </FormField>
          </div>
          <FormField label="Description" htmlFor="team-desc">
            <DemoTextarea id="team-desc" rows={2} value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
          </FormField>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[var(--demo-text-secondary)]">
              Assigned Members ({teamForm.memberIds.length})
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--demo-border)] divide-y divide-[var(--demo-border)]">
              {employees.map((e) => (
                <label key={e.id} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--demo-surface-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamForm.memberIds.includes(e.id)}
                    onChange={() => toggleTeamMember(e.id)}
                    className="rounded accent-[var(--demo-accent)]"
                  />
                  <span className="font-medium text-[var(--demo-text)]">{e.name}</span>
                  <span className="text-[var(--demo-text-muted)] ml-auto">{e.title}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </ModalDialog>

      {/* New Project Modal */}
      <ModalDialog
        open={projOpen}
        title="Create Organization Project"
        onClose={() => setProjOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setProjOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitProject}>Create Project</DemoButton>
          </>
        }
      >
        <form onSubmit={submitProject} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Project Name" htmlFor="proj-name" required className="col-span-2">
              <DemoInput id="proj-name" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} />
            </FormField>
            <FormField label="Code" htmlFor="proj-code">
              <DemoInput id="proj-code" value={projForm.code} onChange={(e) => setProjForm({ ...projForm, code: e.target.value })} placeholder="CV-NEW" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Owning Team" htmlFor="proj-team">
              <DemoSelect id="proj-team" value={projForm.teamId || teams[0]?.id || ''} onChange={(e) => setProjForm({ ...projForm, teamId: e.target.value })}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </DemoSelect>
            </FormField>
            <FormField label="Priority" htmlFor="proj-prio">
              <DemoSelect id="proj-prio" value={projForm.priority} onChange={(e) => setProjForm({ ...projForm, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </DemoSelect>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Target Due Date" htmlFor="proj-due">
              <DemoInput id="proj-due" type="date" value={projForm.dueDate} onChange={(e) => setProjForm({ ...projForm, dueDate: e.target.value })} />
            </FormField>
            <FormField label="Budget Hours" htmlFor="proj-budget">
              <DemoInput id="proj-budget" type="number" min="20" value={projForm.budgetHours} onChange={(e) => setProjForm({ ...projForm, budgetHours: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="proj-desc">
            <DemoTextarea id="proj-desc" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
          </FormField>
        </form>
      </ModalDialog>

      {/* Confirmations */}
      <ConfirmDialog
        open={Boolean(cancelInviteTarget)}
        title="Revoke Pending Invitation?"
        message={cancelInviteTarget ? `Revoke onboarding invitation for ${cancelInviteTarget.email}?` : ''}
        confirmLabel="Revoke Invite"
        onConfirm={() => runMutation(() => apiClient.cancelInvitation(auth, cancelInviteTarget.id), 'Invitation revoked.')}
        onClose={() => setCancelInviteTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteDeptTarget)}
        title="Delete Department?"
        message={deleteDeptTarget ? `Remove "${deleteDeptTarget.name}"? Departments with active employees cannot be deleted.` : ''}
        confirmLabel="Delete Department"
        onConfirm={() => runMutation(() => apiClient.deleteDepartment(auth, deleteDeptTarget.id), 'Department removed.')}
        onClose={() => setDeleteDeptTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteTeamTarget)}
        title="Delete Team?"
        message={deleteTeamTarget ? `Delete "${deleteTeamTarget.name}"? Teams owning active projects must reassign them first.` : ''}
        confirmLabel="Delete Team"
        onConfirm={() => runMutation(() => apiClient.deleteTeam(auth, deleteTeamTarget.id), 'Team removed.')}
        onClose={() => setDeleteTeamTarget(null)}
      />
    </DemoShell>
  );
}
