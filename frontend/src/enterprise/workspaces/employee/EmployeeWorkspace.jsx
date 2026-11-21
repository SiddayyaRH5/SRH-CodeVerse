import React, { useMemo, useState } from 'react';
import {
  Bell,
  CalendarOff,
  CheckSquare,
  Clock,
  FolderKanban,
  Home,
  Timer,
  User,
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

export function EmployeeWorkspace() {
  const { snapshot, loading, error, refresh } = useWorkspace();
  const [section, setSection] = useState('home');

  const user = snapshot?.currentUser;
  const today = snapshot?.today || new Date().toISOString().slice(0, 10);

  const myTasks = useMemo(
    () => (snapshot?.tasks || []).filter((t) => t.assigneeId === user?.id),
    [snapshot?.tasks, user?.id]
  );
  const myWorklogs = useMemo(
    () => (snapshot?.worklogs || []).filter((w) => w.employeeId === user?.id),
    [snapshot?.worklogs, user?.id]
  );
  const myLeaves = useMemo(
    () => (snapshot?.leaves || []).filter((l) => l.employeeId === user?.id),
    [snapshot?.leaves, user?.id]
  );

  const openTasks = myTasks.filter((t) => t.status !== 'DONE');
  const loggedHours = Math.round(myWorklogs.reduce((s, w) => s + w.hours, 0) * 10) / 10;
  const unreadNotifs = (snapshot?.notifications || []).filter((n) => !n.read).length;

  const navItems = [
    { id: 'home', label: 'My Home', icon: Home },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: openTasks.length },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarOff },
    { id: 'worklogs', label: 'Worklogs & Timesheets', icon: Timer },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const renderContent = () => {
    if (loading && !snapshot) return <WorkspaceSkeleton />;
    if (error && !snapshot) return <ErrorBanner message={error} onRetry={refresh} />;
    if (!snapshot || !user) {
      return (
        <Panel title="No Employee Profile Found">
          <p className="text-sm text-[var(--demo-text-secondary)]">
            No employee record with the EMPLOYEE role was found in the active organization database.
          </p>
        </Panel>
      );
    }

    if (section === 'home') {
      return (
        <div className="space-y-6">
          <PageHeader
            title={`Hello, ${user.name.split(' ')[0]}`}
            subtitle={`${user.title} • Self-Service Employee Workspace`}
            actions={
              <>
                <DemoButton variant="secondary" size="sm" onClick={() => setSection('leaves')}>
                  <CalendarOff className="w-4 h-4" />
                  Request Leave
                </DemoButton>
                <DemoButton size="sm" onClick={() => setSection('worklogs')}>
                  <Timer className="w-4 h-4" />
                  Log Work
                </DemoButton>
              </>
            }
          />

          {/* Direct Daily Shift Check-In / Check-Out Card */}
          <AttendanceModule compactBanner />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Assigned Tasks"
              value={openTasks.length}
              subtext={`${myTasks.filter((t) => isTaskOverdue(t, today)).length} overdue`}
              icon={CheckSquare}
              onClick={() => setSection('tasks')}
            />
            <MetricTile
              label="Logged Hours"
              value={`${loggedHours}h`}
              subtext="Current worklog cycle"
              icon={Timer}
              onClick={() => setSection('worklogs')}
            />
            <MetricTile
              label="Annual Leave Left"
              value={`${user.leaveBalance.annual}d`}
              subtext={`${user.leaveBalance.sick}d sick • ${user.leaveBalance.personal}d personal`}
              icon={CalendarOff}
              onClick={() => setSection('leaves')}
            />
            <MetricTile
              label="Pending Leaves"
              value={myLeaves.filter((l) => l.status === 'PENDING').length}
              subtext="Awaiting lead decision"
              icon={Clock}
              onClick={() => setSection('leaves')}
            />
          </div>

          <Panel
            title="My Active Tasks"
            subtitle="Click a task to open your task list and update progress."
            bodyClassName="p-0"
            actions={
              <DemoButton size="xs" variant="secondary" onClick={() => setSection('tasks')}>
                View All Tasks
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
                { key: 'progress', label: 'Progress', render: (t) => <span className="tabular-nums text-xs">{t.progress}%</span> },
                { key: 'dueDate', label: 'Due', render: (t) => <span className="tabular-nums text-xs">{formatShortDate(t.dueDate)}</span> },
              ]}
              rows={openTasks.slice(0, 5)}
              onRowClick={() => setSection('tasks')}
              emptyTitle="No open tasks assigned"
            />
          </Panel>
        </div>
      );
    }

    if (section === 'tasks') return <PersonalTasksModule />;
    if (section === 'attendance') return <AttendanceModule />;
    if (section === 'leaves') return <LeaveModule />;
    if (section === 'worklogs') return <WorklogsTimesheetsModule />;
    if (section === 'projects') return <PersonalProjectsModule />;
    if (section === 'notifications') return <NotificationsActivityModule />;
    if (section === 'profile') return <ProfileModule />;

    return null;
  };

  return (
    <DemoShell
      workspaceTitle="Employee Workspace"
      workspaceBadge="Self-Service"
      navItems={navItems}
      activeSection={section}
      onSelectSection={setSection}
    >
      {renderContent()}
    </DemoShell>
  );
}
