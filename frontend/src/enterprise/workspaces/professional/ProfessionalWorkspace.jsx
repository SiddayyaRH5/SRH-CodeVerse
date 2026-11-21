import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  CalendarOff,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Timer,
  User,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { isTaskOverdue } from '../../lib/workspaceRules.js';
import { DemoShell } from '../../components/demo/DemoShell.jsx';
import {
  AttendanceModule,
  LeaveModule,
  NotificationsActivityModule,
  PersonalProjectsModule,
  PersonalTasksModule,
  ProfileModule,
  WorklogsTimesheetsModule,
} from '../../components/demo/SharedModules.jsx';
import {
  DataTable,
  DemoButton,
  ErrorBanner,
  MetricTile,
  PageHeader,
  Panel,
  StatusLabel,
  WorkspaceSkeleton,
  formatShortDate,
} from '../../components/demo/ui.jsx';

export function ProfessionalWorkspace() {
  const { snapshot, loading, error, refresh } = useWorkspace();
  const [section, setSection] = useState('dashboard');

  const user = snapshot?.currentUser;
  const today = snapshot?.today || new Date().toISOString().slice(0, 10);

  const myTasks = useMemo(
    () => (snapshot?.tasks || []).filter((t) => t.assigneeId === user?.id),
    [snapshot?.tasks, user?.id]
  );
  const myProjects = useMemo(
    () =>
      (snapshot?.projects || []).filter(
        (p) => p.memberIds.includes(user?.id) || p.leadId === user?.id
      ),
    [snapshot?.projects, user?.id]
  );
  const myWorklogs = useMemo(
    () => (snapshot?.worklogs || []).filter((w) => w.employeeId === user?.id),
    [snapshot?.worklogs, user?.id]
  );
  const myAttendanceToday = useMemo(
    () => (snapshot?.attendance || []).find((a) => a.employeeId === user?.id && a.date === today),
    [snapshot?.attendance, user?.id, today]
  );
  const myTeam = useMemo(
    () => (snapshot?.teams || []).find((t) => t.id === user?.teamId),
    [snapshot?.teams, user?.teamId]
  );
  const teamMembers = useMemo(
    () => (snapshot?.employees || []).filter((e) => e.teamId === user?.teamId),
    [snapshot?.employees, user?.teamId]
  );
  const projectsMap = useMemo(
    () => Object.fromEntries((snapshot?.projects || []).map((p) => [p.id, p])),
    [snapshot?.projects]
  );

  const openTasks = myTasks.filter((t) => t.status !== 'DONE');
  const loggedHoursTotal = Math.round(myWorklogs.reduce((s, w) => s + w.hours, 0) * 10) / 10;
  const billableHoursTotal =
    Math.round(myWorklogs.filter((w) => w.billable).reduce((s, w) => s + w.hours, 0) * 10) / 10;
  const unreadNotifs = (snapshot?.notifications || []).filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: openTasks.length },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'worklogs', label: 'Worklogs & Timesheets', icon: Timer },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarOff },
    { id: 'team', label: 'My Team', icon: Users },
    { id: 'reports', label: 'Personal Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const renderContent = () => {
    if (loading && !snapshot) return <WorkspaceSkeleton />;
    if (error && !snapshot) return <ErrorBanner message={error} onRetry={refresh} />;
    if (!snapshot || !user) {
      return (
        <Panel title="No Professional Profile Found">
          <p className="text-sm text-[var(--demo-text-secondary)]">
            No employee record with the PROFESSIONAL role was found in the active organization database.
          </p>
        </Panel>
      );
    }

    if (section === 'dashboard') {
      const priorityTasks = [...openTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return (
        <div className="space-y-6">
          <PageHeader
            title={`Welcome back, ${user.name.split(' ')[0]}`}
            subtitle={`${user.title} • ${myTeam?.name || 'Delivery Team'} • ${snapshot.activeOrg.name}`}
            actions={
              <>
                <DemoButton variant="secondary" size="sm" onClick={() => setSection('worklogs')}>
                  <Timer className="w-4 h-4" />
                  Log Work
                </DemoButton>
                <DemoButton size="sm" onClick={() => setSection('tasks')}>
                  <CheckSquare className="w-4 h-4" />
                  View Tasks
                </DemoButton>
              </>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Open Tasks"
              value={openTasks.length}
              subtext={`${myTasks.filter((t) => isTaskOverdue(t, today)).length} overdue • ${myTasks.filter((t) => t.status === 'DONE').length} done`}
              icon={CheckSquare}
              onClick={() => setSection('tasks')}
            />
            <MetricTile
              label="Active Projects"
              value={myProjects.length}
              subtext="Cross-functional assignments"
              icon={FolderKanban}
              onClick={() => setSection('projects')}
            />
            <MetricTile
              label="Logged Hours"
              value={`${loggedHoursTotal}h`}
              subtext={`${billableHoursTotal}h billable (${loggedHoursTotal > 0 ? Math.round((billableHoursTotal / loggedHoursTotal) * 100) : 0}%)`}
              icon={Timer}
              onClick={() => setSection('worklogs')}
            />
            <MetricTile
              label="Today's Shift"
              value={myAttendanceToday ? (myAttendanceToday.checkOut ? 'Done' : myAttendanceToday.checkIn) : 'Pending'}
              subtext={myAttendanceToday ? `${myAttendanceToday.workMode} mode` : 'Check in from Attendance'}
              icon={Clock}
              onClick={() => setSection('attendance')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Panel
                title="Priority Tasks & Upcoming Deadlines"
                subtitle="Sorted by earliest due date."
                bodyClassName="p-0"
                actions={
                  <DemoButton size="xs" variant="secondary" onClick={() => setSection('tasks')}>
                    Open Task Queue
                  </DemoButton>
                }
              >
                <DataTable
                  columns={[
                    {
                      key: 'title',
                      label: 'Task',
                      render: (t) => (
                        <div>
                          <span className="font-mono text-xs text-[var(--demo-accent-text)] mr-2">{t.key}</span>
                          <span className="font-medium text-xs sm:text-sm">{t.title}</span>
                        </div>
                      ),
                    },
                    { key: 'status', label: 'Status', render: (t) => <StatusLabel value={t.status} /> },
                    { key: 'priority', label: 'Priority', render: (t) => <StatusLabel value={t.priority} /> },
                    { key: 'dueDate', label: 'Due', render: (t) => <span className="tabular-nums text-xs">{formatShortDate(t.dueDate)}</span> },
                  ]}
                  rows={priorityTasks.slice(0, 5)}
                  onRowClick={() => setSection('tasks')}
                  emptyTitle="All assigned tasks completed"
                />
              </Panel>

              <Panel
                title="Recent Worklogs"
                subtitle="Latest logged entries feeding into your weekly timesheet."
                bodyClassName="p-0"
                actions={
                  <DemoButton size="xs" variant="secondary" onClick={() => setSection('worklogs')}>
                    Manage Timesheets
                  </DemoButton>
                }
              >
                <DataTable
                  columns={[
                    { key: 'date', label: 'Date', render: (w) => <span className="tabular-nums text-xs">{formatShortDate(w.date)}</span> },
                    { key: 'project', label: 'Project', render: (w) => <span className="text-xs font-medium">{projectsMap[w.projectId]?.code || w.projectId}</span> },
                    { key: 'hours', label: 'Hours', render: (w) => <span className="tabular-nums text-xs font-semibold">{w.hours}h</span> },
                    { key: 'summary', label: 'Summary', render: (w) => <span className="text-xs text-[var(--demo-text-secondary)]">{w.summary}</span> },
                    { key: 'status', label: 'Status', render: (w) => <StatusLabel value={w.status} /> },
                  ]}
                  rows={myWorklogs.slice(0, 4)}
                />
              </Panel>
            </div>

            <div className="space-y-6">
              <AttendanceModule compactBanner />

              <Panel
                title="Leave Balances"
                actions={
                  <DemoButton size="xs" variant="ghost" onClick={() => setSection('leaves')}>
                    Request
                  </DemoButton>
                }
              >
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--demo-text-secondary)]">Annual Leave</span>
                    <span className="font-semibold text-[var(--demo-text)] tabular-nums">{user.leaveBalance.annual} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--demo-text-secondary)]">Sick Leave</span>
                    <span className="font-semibold text-[var(--demo-text)] tabular-nums">{user.leaveBalance.sick} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--demo-text-secondary)]">Personal Leave</span>
                    <span className="font-semibold text-[var(--demo-text)] tabular-nums">{user.leaveBalance.personal} days</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Team Roster Snapshot" subtitle={myTeam?.name || 'Squad'}>
                <div className="space-y-2.5">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--demo-text)] truncate">{m.name}</div>
                        <div className="text-[var(--demo-text-muted)] truncate">{m.title}</div>
                      </div>
                      <StatusLabel value={m.status} />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      );
    }

    if (section === 'tasks') return <PersonalTasksModule />;
    if (section === 'projects') return <PersonalProjectsModule />;
    if (section === 'worklogs') return <WorklogsTimesheetsModule />;
    if (section === 'attendance') return <AttendanceModule />;
    if (section === 'leaves') return <LeaveModule />;
    if (section === 'notifications') return <NotificationsActivityModule />;
    if (section === 'profile') return <ProfileModule />;

    if (section === 'team') {
      return (
        <div className="space-y-6">
          <PageHeader
            title={myTeam ? `My Team — ${myTeam.name}` : 'My Team'}
            subtitle={myTeam?.description || 'Collaborators working alongside you.'}
          />
          <Panel title={`Team Members (${teamMembers.length})`} bodyClassName="p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Member',
                  render: (m) => (
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-[var(--demo-text-muted)]">{m.email}</div>
                    </div>
                  ),
                },
                { key: 'title', label: 'Title', render: (m) => <span className="text-xs">{m.title}</span> },
                { key: 'role', label: 'Role', render: (m) => <StatusLabel value={m.role} /> },
                { key: 'location', label: 'Location', render: (m) => <span className="text-xs text-[var(--demo-text-muted)]">{m.location}</span> },
                { key: 'status', label: 'Status', render: (m) => <StatusLabel value={m.status} /> },
              ]}
              rows={teamMembers}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'reports') {
      const doneCount = myTasks.filter((t) => t.status === 'DONE').length;
      const completionRate = myTasks.length ? Math.round((doneCount / myTasks.length) * 100) : 0;
      const utilization = Math.min(150, Math.round((loggedHoursTotal / (user.weeklyCapacityHours || 40)) * 100));
      return (
        <div className="space-y-6">
          <PageHeader
            title="Personal Delivery Reports"
            subtitle="Summary of your task completion rate, project utilization, and billable ratio."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Task Completion Rate" value={`${completionRate}%`} subtext={`${doneCount} of ${myTasks.length} tasks done`} icon={CheckSquare} />
            <MetricTile label="Weekly Utilization" value={`${utilization}%`} subtext={`${loggedHoursTotal}h of ${user.weeklyCapacityHours}h target`} icon={BarChart3} />
            <MetricTile label="Billable Ratio" value={`${loggedHoursTotal ? Math.round((billableHoursTotal / loggedHoursTotal) * 100) : 0}%`} subtext={`${billableHoursTotal}h billable`} icon={Calendar} />
          </div>
          <Panel title="Hours Logged by Project">
            <div className="space-y-4">
              {myProjects.map((proj) => {
                const hrs =
                  Math.round(
                    myWorklogs.filter((w) => w.projectId === proj.id).reduce((s, w) => s + w.hours, 0) * 10
                  ) / 10;
                const pct = loggedHoursTotal ? Math.round((hrs / loggedHoursTotal) * 100) : 0;
                return (
                  <div key={proj.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[var(--demo-text)]">
                        {proj.code} — {proj.name}
                      </span>
                      <span className="tabular-nums text-[var(--demo-text-muted)]">
                        {hrs}h ({pct}%)
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
        </div>
      );
    }

    return null;
  };

  return (
    <DemoShell
      workspaceTitle="Professional Workspace"
      workspaceBadge="Contributor Pro"
      navItems={navItems}
      activeSection={section}
      onSelectSection={setSection}
    >
      {renderContent()}
    </DemoShell>
  );
}
