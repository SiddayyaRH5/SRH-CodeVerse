import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarOff,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Users,
  XCircle,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import {
  calculateProjectProgress,
  computeMemberWorkload,
  filterAndSortTasks,
  isTaskOverdue,
  paginateItems,
} from '../../lib/workspaceRules.js';
import { DemoShell } from '../../components/demo/DemoShell.jsx';
import { AttendanceModule, LeaveModule } from '../../components/demo/SharedModules.jsx';
import {
  DataTable,
  DemoButton,
  DemoInput,
  DemoSelect,
  DemoTextarea,
  EmptyState,
  ErrorBanner,
  FormField,
  MetricTile,
  ModalDialog,
  PageHeader,
  Panel,
  SearchInput,
  SegmentedTabs,
  SlideDrawer,
  StatusLabel,
  WorkspaceSkeleton,
  formatRelativeTime,
  formatShortDate,
} from '../../components/demo/ui.jsx';

export function TeamLeadWorkspace() {
  const { snapshot, loading, error, refresh, auth, runMutation } = useWorkspace();
  const [section, setSection] = useState('dashboard');
  const [approvalTab, setApprovalTab] = useState('leaves');

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState(null); // { kind: 'leave' | 'timesheet', item }
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Team task table state
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('ALL');
  const [taskAssignee, setTaskAssignee] = useState('ALL');
  const [taskSortBy, setTaskSortBy] = useState('dueDate');
  const [taskSortDir, setTaskSortDir] = useState('asc');
  const [taskPage, setTaskPage] = useState(1);

  // Create task modal
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const today = snapshot?.today || new Date().toISOString().slice(0, 10);
  const [newTask, setNewTask] = useState({
    title: '',
    projectId: '',
    assigneeId: '',
    priority: 'HIGH',
    dueDate: today,
    estimatedHours: '8',
    description: '',
  });

  // Member detail drawer
  const [memberDrawer, setMemberDrawer] = useState(null);

  const user = snapshot?.currentUser;
  const employees = snapshot?.employees || [];
  const teams = snapshot?.teams || [];
  const projects = snapshot?.projects || [];
  const tasks = snapshot?.tasks || [];
  const leaves = snapshot?.leaves || [];
  const timesheets = snapshot?.timesheets || [];
  const worklogs = snapshot?.worklogs || [];

  const managedTeams = useMemo(() => {
    const owned = teams.filter((t) => t.leadId === user?.id || t.id === user?.teamId);
    return owned.length > 0 ? owned : teams.slice(0, 1);
  }, [teams, user?.id, user?.teamId]);

  const managedTeamIds = useMemo(() => new Set(managedTeams.map((t) => t.id)), [managedTeams]);
  const teamMembers = useMemo(
    () => employees.filter((e) => e.teamId && managedTeamIds.has(e.teamId)),
    [employees, managedTeamIds]
  );
  const memberIds = useMemo(() => new Set(teamMembers.map((m) => m.id)), [teamMembers]);

  const teamProjects = useMemo(
    () => projects.filter((p) => managedTeamIds.has(p.teamId) || p.leadId === user?.id),
    [projects, managedTeamIds, user?.id]
  );
  const teamTasks = useMemo(
    () => tasks.filter((t) => managedTeamIds.has(t.teamId) || memberIds.has(t.assigneeId)),
    [tasks, managedTeamIds, memberIds]
  );

  const pendingLeaves = useMemo(
    () => leaves.filter((l) => l.status === 'PENDING' && (managedTeamIds.has(l.teamId) || memberIds.has(l.employeeId))),
    [leaves, managedTeamIds, memberIds]
  );
  const pendingTimesheets = useMemo(
    () => timesheets.filter((ts) => ts.status === 'SUBMITTED' && (managedTeamIds.has(ts.teamId) || memberIds.has(ts.employeeId))),
    [timesheets, managedTeamIds, memberIds]
  );
  const totalPendingApprovals = pendingLeaves.length + pendingTimesheets.length;

  const workload = useMemo(
    () => computeMemberWorkload(teamMembers, teamTasks, worklogs, today),
    [teamMembers, teamTasks, worklogs, today]
  );

  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const projMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks(teamTasks, {
        search: taskSearch,
        status: taskStatus,
        assigneeId: taskAssignee,
        sortBy: taskSortBy,
        sortDir: taskSortDir,
      }),
    [teamTasks, taskSearch, taskStatus, taskAssignee, taskSortBy, taskSortDir]
  );

  const pagedTasks = useMemo(() => paginateItems(filteredTasks, taskPage, 8), [filteredTasks, taskPage]);

  const navItems = [
    { id: 'dashboard', label: 'Team Dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals Queue', icon: ClipboardCheck, badge: totalPendingApprovals },
    { id: 'roster', label: 'Team & Workload', icon: Users },
    { id: 'tasks', label: 'Team Tasks', icon: CheckSquare, badge: teamTasks.filter((t) => t.status !== 'DONE').length },
    { id: 'projects', label: 'Project Oversight', icon: FolderKanban },
    { id: 'reports', label: 'Team Reports', icon: BarChart3 },
    { id: 'activity', label: 'Team Activity', icon: Activity },
    { id: 'attendance', label: 'My Attendance', icon: Clock },
    { id: 'leaves', label: 'My Leaves', icon: CalendarOff },
  ];

  const handleApprove = async (kind, id) => {
    if (kind === 'leave') {
      await runMutation(
        () => apiClient.reviewLeave(auth, id, { decision: 'APPROVED', note: 'Approved by Team Lead.' }),
        'Leave request approved and employee balance updated.'
      );
    } else {
      await runMutation(
        () => apiClient.reviewTimesheet(auth, id, { decision: 'APPROVED', note: 'Hours verified and approved.' }),
        'Weekly timesheet approved.'
      );
    }
  };

  const confirmReject = async (e) => {
    e.preventDefault();
    setRejectError('');
    if (rejectReason.trim().length < 4) {
      setRejectError('Please provide a clear rejection reason (at least 4 characters).');
      return;
    }
    if (!rejectTarget) return;
    const action =
      rejectTarget.kind === 'leave'
        ? () => apiClient.reviewLeave(auth, rejectTarget.item.id, { decision: 'REJECTED', note: rejectReason })
        : () => apiClient.reviewTimesheet(auth, rejectTarget.item.id, { decision: 'REJECTED', note: rejectReason });
    const res = await runMutation(
      action,
      `${rejectTarget.kind === 'leave' ? 'Leave request' : 'Timesheet'} rejected with reviewer note.`
    );
    if (res.ok) {
      setRejectTarget(null);
      setRejectReason('');
    } else {
      setRejectError(res.error);
    }
  };

  const submitNewTask = async (e) => {
    e.preventDefault();
    const res = await runMutation(
      () =>
        apiClient.createTask(auth, {
          ...newTask,
          projectId: newTask.projectId || teamProjects[0]?.id,
          assigneeId: newTask.assigneeId || teamMembers[0]?.id,
          estimatedHours: Number(newTask.estimatedHours || 6),
        }),
      `Created and assigned task "${newTask.title}".`
    );
    if (res.ok) {
      setCreateTaskOpen(false);
      setNewTask({
        title: '',
        projectId: '',
        assigneeId: '',
        priority: 'HIGH',
        dueDate: today,
        estimatedHours: '8',
        description: '',
      });
    }
  };

  const handleReassign = (taskId, assigneeId) => {
    runMutation(
      () => apiClient.updateTask(auth, taskId, { assigneeId }),
      `Reassigned task to ${empMap[assigneeId]?.name || 'member'}.`
    );
  };

  const handleTaskSort = (key) => {
    if (taskSortBy === key) setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setTaskSortBy(key);
      setTaskSortDir('asc');
    }
  };

  const renderContent = () => {
    if (loading && !snapshot) return <WorkspaceSkeleton />;
    if (error && !snapshot) return <ErrorBanner message={error} onRetry={refresh} />;
    if (!snapshot || !user) {
      return (
        <Panel title="No Team Lead Profile Found">
          <p className="text-sm text-[var(--demo-text-secondary)]">
            No employee record with the TEAM_LEAD role was found in the active organization database.
          </p>
        </Panel>
      );
    }

    if (section === 'dashboard') {
      const overdueCount = teamTasks.filter((t) => isTaskOverdue(t, today)).length;
      const doneCount = teamTasks.filter((t) => t.status === 'DONE').length;
      const avgUtil = workload.length
        ? Math.round(workload.reduce((s, w) => s + w.utilizationPct, 0) / workload.length)
        : 0;

      return (
        <div className="space-y-6">
          <PageHeader
            title={`${managedTeams[0]?.name || 'Engineering Team'} — Lead Oversight`}
            subtitle={`Led by ${user.name} • ${teamMembers.length} active members • ${teamProjects.length} projects`}
            actions={
              <>
                <DemoButton variant="secondary" size="sm" onClick={() => setSection('approvals')}>
                  <ClipboardCheck className="w-4 h-4" />
                  Approvals ({totalPendingApprovals})
                </DemoButton>
                <DemoButton size="sm" onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Assign Task
                </DemoButton>
              </>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Pending Approvals"
              value={totalPendingApprovals}
              subtext={`${pendingLeaves.length} leaves • ${pendingTimesheets.length} timesheets`}
              icon={ClipboardCheck}
              onClick={() => setSection('approvals')}
            />
            <MetricTile
              label="Team Open Tasks"
              value={teamTasks.length - doneCount}
              subtext={`${overdueCount} overdue • ${doneCount} completed`}
              icon={CheckSquare}
              onClick={() => setSection('tasks')}
            />
            <MetricTile
              label="Avg Team Utilization"
              value={`${avgUtil}%`}
              subtext={`Across ${teamMembers.length} direct members`}
              icon={Users}
              onClick={() => setSection('roster')}
            />
            <MetricTile
              label="Active Team Projects"
              value={teamProjects.filter((p) => p.status === 'ACTIVE').length}
              subtext={`${teamProjects.length} total initiatives`}
              icon={FolderKanban}
              onClick={() => setSection('projects')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Panel
              title="Team Workload Distribution"
              subtitle="Open task load and weekly logged hours against 40h capacity."
              className="lg:col-span-2"
              actions={
                <DemoButton size="xs" variant="secondary" onClick={() => setSection('roster')}>
                  Inspect Roster
                </DemoButton>
              }
            >
              <div className="space-y-4">
                {workload.map((m) => (
                  <div key={m.employeeId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => setMemberDrawer(empMap[m.employeeId])}
                        className="font-medium text-[var(--demo-text)] hover:text-[var(--demo-accent-text)] cursor-pointer text-left"
                      >
                        {m.name} <span className="text-[var(--demo-text-muted)] font-normal">• {m.title}</span>
                      </button>
                      <div className="flex items-center gap-3 tabular-nums text-[var(--demo-text-muted)] shrink-0">
                        <span>{m.openTasks} open</span>
                        {m.overdueTasks > 0 && (
                          <span className="text-red-500 font-medium">{m.overdueTasks} overdue</span>
                        )}
                        <span className="font-semibold text-[var(--demo-text)]">
                          {m.loggedHours}h / {m.capacityHours}h ({m.utilizationPct}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.utilizationPct > 100
                            ? 'bg-red-500'
                            : m.utilizationPct > 80
                              ? 'bg-amber-500'
                              : 'bg-[var(--demo-accent)]'
                        }`}
                        style={{ width: `${Math.min(100, m.utilizationPct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Action Needed: Approvals"
              subtitle="Review leaves and weekly timesheets."
              actions={
                <DemoButton size="xs" variant="ghost" onClick={() => setSection('approvals')}>
                  Open Queue
                </DemoButton>
              }
            >
              {totalPendingApprovals === 0 ? (
                <EmptyState icon={CheckCircle2} title="All approvals cleared" />
              ) : (
                <div className="space-y-3">
                  {pendingLeaves.slice(0, 3).map((lv) => (
                    <div
                      key={lv.id}
                      className="rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface-2)]/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--demo-text)]">
                          {empMap[lv.employeeId]?.name}
                        </span>
                        <StatusLabel value={lv.type} />
                      </div>
                      <p className="text-xs text-[var(--demo-text-muted)] tabular-nums">
                        {formatShortDate(lv.startDate)} – {formatShortDate(lv.endDate)} ({lv.days}d)
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <DemoButton size="xs" variant="successSoft" onClick={() => handleApprove('leave', lv.id)}>
                          Approve
                        </DemoButton>
                        <DemoButton
                          size="xs"
                          variant="dangerSoft"
                          onClick={() => {
                            setRejectReason('');
                            setRejectError('');
                            setRejectTarget({ kind: 'leave', item: lv });
                          }}
                        >
                          Reject
                        </DemoButton>
                      </div>
                    </div>
                  ))}
                  {pendingTimesheets.slice(0, 2).map((ts) => (
                    <div
                      key={ts.id}
                      className="rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface-2)]/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--demo-text)]">
                          {empMap[ts.employeeId]?.name}
                        </span>
                        <span className="tabular-nums font-medium text-[var(--demo-accent-text)]">
                          {ts.totalHours}h Timesheet
                        </span>
                      </div>
                      <p className="text-xs text-[var(--demo-text-muted)] tabular-nums">
                        Week of {formatShortDate(ts.weekStart)}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <DemoButton size="xs" variant="successSoft" onClick={() => handleApprove('timesheet', ts.id)}>
                          Approve
                        </DemoButton>
                        <DemoButton
                          size="xs"
                          variant="dangerSoft"
                          onClick={() => {
                            setRejectReason('');
                            setRejectError('');
                            setRejectTarget({ kind: 'timesheet', item: ts });
                          }}
                        >
                          Reject
                        </DemoButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      );
    }

    if (section === 'approvals') {
      const teamLeavesAll = leaves.filter((l) => managedTeamIds.has(l.teamId) || memberIds.has(l.employeeId));
      const teamTsAll = timesheets.filter((ts) => managedTeamIds.has(ts.teamId) || memberIds.has(ts.employeeId));

      return (
        <div className="space-y-6">
          <PageHeader
            title="Approvals Queue"
            subtitle="Approve or reject team leave requests and submitted weekly timesheets with audit trail."
          />

          <SegmentedTabs
            active={approvalTab}
            onChange={setApprovalTab}
            tabs={[
              { id: 'leaves', label: 'Leave Requests', count: pendingLeaves.length },
              { id: 'timesheets', label: 'Weekly Timesheets', count: pendingTimesheets.length },
            ]}
          />

          {approvalTab === 'leaves' ? (
            <Panel title="Team Leave Requests" bodyClassName="p-0">
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    label: 'Employee',
                    render: (l) => (
                      <div>
                        <div className="font-medium text-xs sm:text-sm">{empMap[l.employeeId]?.name}</div>
                        <div className="text-xs text-[var(--demo-text-muted)]">{empMap[l.employeeId]?.title}</div>
                      </div>
                    ),
                  },
                  { key: 'type', label: 'Type', render: (l) => <StatusLabel value={l.type} /> },
                  {
                    key: 'dates',
                    label: 'Dates',
                    render: (l) => (
                      <span className="tabular-nums text-xs">
                        {formatShortDate(l.startDate)} – {formatShortDate(l.endDate)} ({l.days}d)
                      </span>
                    ),
                  },
                  { key: 'reason', label: 'Reason', render: (l) => <span className="text-xs text-[var(--demo-text-secondary)]">{l.reason}</span> },
                  { key: 'status', label: 'Status', render: (l) => <StatusLabel value={l.status} /> },
                  {
                    key: 'actions',
                    label: 'Decision',
                    align: 'right',
                    render: (l) =>
                      l.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <DemoButton size="xs" variant="successSoft" onClick={() => handleApprove('leave', l.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </DemoButton>
                          <DemoButton
                            size="xs"
                            variant="dangerSoft"
                            onClick={() => {
                              setRejectReason('');
                              setRejectError('');
                              setRejectTarget({ kind: 'leave', item: l });
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </DemoButton>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--demo-text-muted)]">{l.reviewerNote || 'Reviewed'}</span>
                      ),
                  },
                ]}
                rows={teamLeavesAll}
              />
            </Panel>
          ) : (
            <Panel title="Team Weekly Timesheets" bodyClassName="p-0">
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    label: 'Member',
                    render: (ts) => <span className="font-medium text-xs sm:text-sm">{empMap[ts.employeeId]?.name}</span>,
                  },
                  {
                    key: 'week',
                    label: 'Week',
                    render: (ts) => (
                      <span className="tabular-nums text-xs">
                        {formatShortDate(ts.weekStart)} – {formatShortDate(ts.weekEnd)}
                      </span>
                    ),
                  },
                  { key: 'totalHours', label: 'Hours', render: (ts) => <span className="tabular-nums font-semibold text-xs">{ts.totalHours}h</span> },
                  { key: 'billableHours', label: 'Billable', render: (ts) => <span className="tabular-nums text-xs">{ts.billableHours}h</span> },
                  { key: 'status', label: 'Status', render: (ts) => <StatusLabel value={ts.status} /> },
                  {
                    key: 'actions',
                    label: 'Decision',
                    align: 'right',
                    render: (ts) =>
                      ts.status === 'SUBMITTED' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <DemoButton size="xs" variant="successSoft" onClick={() => handleApprove('timesheet', ts.id)}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </DemoButton>
                          <DemoButton
                            size="xs"
                            variant="dangerSoft"
                            onClick={() => {
                              setRejectReason('');
                              setRejectError('');
                              setRejectTarget({ kind: 'timesheet', item: ts });
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </DemoButton>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--demo-text-muted)]">{ts.reviewerNote || '—'}</span>
                      ),
                  },
                ]}
                rows={teamTsAll}
              />
            </Panel>
          )}
        </div>
      );
    }

    if (section === 'roster') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Team Roster & Workload"
            subtitle="Click any member to inspect active assignments, attendance status, and skills."
          />
          <Panel title={`Direct Team Members (${teamMembers.length})`} bodyClassName="p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Member',
                  render: (w) => (
                    <div>
                      <div className="font-medium">{w.name}</div>
                      <div className="text-xs text-[var(--demo-text-muted)]">{w.title}</div>
                    </div>
                  ),
                },
                { key: 'openTasks', label: 'Open Tasks', render: (w) => <span className="tabular-nums">{w.openTasks}</span> },
                {
                  key: 'overdueTasks',
                  label: 'Overdue',
                  render: (w) => (
                    <span className={`tabular-nums ${w.overdueTasks > 0 ? 'text-red-500 font-semibold' : 'text-[var(--demo-text-muted)]'}`}>
                      {w.overdueTasks}
                    </span>
                  ),
                },
                { key: 'loggedHours', label: 'Logged / Cap', render: (w) => <span className="tabular-nums text-xs">{w.loggedHours}h / {w.capacityHours}h</span> },
                { key: 'utilizationPct', label: 'Utilization', render: (w) => <span className="tabular-nums font-semibold">{w.utilizationPct}%</span> },
              ]}
              rows={workload}
              keyField="employeeId"
              onRowClick={(w) => setMemberDrawer(empMap[w.employeeId])}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'tasks') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Team Task Allocation"
            subtitle="Create deliverables, filter by status or owner, and rebalance tasks across team members."
            actions={
              <DemoButton onClick={() => setCreateTaskOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Task
              </DemoButton>
            }
          />
          <Panel
            title={`Tasks (${filteredTasks.length})`}
            bodyClassName="p-0"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={taskSearch}
                  onChange={(v) => { setTaskSearch(v); setTaskPage(1); }}
                  placeholder="Search task key or title..."
                  className="w-48"
                />
                <DemoSelect
                  aria-label="Filter by status"
                  value={taskStatus}
                  onChange={(e) => { setTaskStatus(e.target.value); setTaskPage(1); }}
                  className="!w-auto py-1.5 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </DemoSelect>
                <DemoSelect
                  aria-label="Filter by assignee"
                  value={taskAssignee}
                  onChange={(e) => { setTaskAssignee(e.target.value); setTaskPage(1); }}
                  className="!w-auto py-1.5 text-xs"
                >
                  <option value="ALL">All Members</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </DemoSelect>
              </div>
            }
          >
            <DataTable
              columns={[
                {
                  key: 'title',
                  label: 'Task',
                  sortable: true,
                  render: (t) => (
                    <div className="min-w-[200px]">
                      <span className="font-mono text-xs text-[var(--demo-accent-text)] mr-2">{t.key}</span>
                      <span className="font-medium text-xs sm:text-sm">{t.title}</span>
                      <div className="text-xs text-[var(--demo-text-muted)] mt-0.5">{projMap[t.projectId]?.name}</div>
                    </div>
                  ),
                },
                {
                  key: 'assignee',
                  label: 'Reassign Owner',
                  render: (t) => (
                    <DemoSelect
                      aria-label={`Assignee for ${t.key}`}
                      value={t.assigneeId}
                      onChange={(e) => handleReassign(t.id, e.target.value)}
                      className="!w-40 py-1 text-xs"
                    >
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </DemoSelect>
                  ),
                },
                { key: 'status', label: 'Status', sortable: true, render: (t) => <StatusLabel value={t.status} /> },
                { key: 'priority', label: 'Priority', sortable: true, render: (t) => <StatusLabel value={t.priority} /> },
                {
                  key: 'dueDate',
                  label: 'Due Date',
                  sortable: true,
                  render: (t) => (
                    <span className={`tabular-nums text-xs ${isTaskOverdue(t, today) ? 'text-red-500 font-semibold' : ''}`}>
                      {formatShortDate(t.dueDate)}
                    </span>
                  ),
                },
              ]}
              rows={pagedTasks.items}
              sortBy={taskSortBy}
              sortDir={taskSortDir}
              onSort={handleTaskSort}
              page={pagedTasks.page}
              totalPages={pagedTasks.totalPages}
              totalItems={pagedTasks.totalItems}
              onPageChange={setTaskPage}
            />
          </Panel>
        </div>
      );
    }

    if (section === 'projects') {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Project Oversight"
            subtitle="Monitor milestone progress, overdue tasks, and update project status."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamProjects.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const progress = calculateProjectProgress(p, tasks);
              const overdue = pTasks.filter((t) => isTaskOverdue(t, today)).length;
              return (
                <Panel
                  key={p.id}
                  title={`${p.code} — ${p.name}`}
                  subtitle={`Due ${formatShortDate(p.dueDate)} • ${pTasks.length} tasks (${overdue} overdue)`}
                  actions={<StatusLabel value={p.status} />}
                >
                  <p className="text-xs text-[var(--demo-text-secondary)]">{p.description}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1 tabular-nums">
                      <span className="text-[var(--demo-text-muted)]">Completion</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                      <div className="h-full bg-[var(--demo-accent)]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      );
    }

    if (section === 'reports') {
      const done = teamTasks.filter((t) => t.status === 'DONE').length;
      const blocked = teamTasks.filter((t) => t.status === 'BLOCKED').length;
      const totalHrs = Math.round(workload.reduce((s, w) => s + w.loggedHours, 0) * 10) / 10;
      return (
        <div className="space-y-6">
          <PageHeader title="Team Delivery Reports" subtitle="Squad throughput, blockers, and logged hours." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Team Completion Rate" value={`${teamTasks.length ? Math.round((done / teamTasks.length) * 100) : 0}%`} subtext={`${done}/${teamTasks.length} tasks`} icon={CheckCircle2} />
            <MetricTile label="Blocked Items" value={blocked} subtext="Requires lead unblocking" icon={XCircle} />
            <MetricTile label="Total Team Hours" value={`${totalHrs}h`} subtext="Recorded in worklogs" icon={BarChart3} />
          </div>
        </div>
      );
    }

    if (section === 'activity') {
      return (
        <div className="space-y-6">
          <PageHeader title="Team Activity Stream" subtitle="Recent task updates, approvals, and attendance events." />
          <Panel bodyClassName="p-0">
            <div className="divide-y divide-[var(--demo-border)]">
              {(snapshot.activities || []).slice(0, 20).map((a) => (
                <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-[var(--demo-text)]">{a.actorName}</span>{' '}
                    <span className="text-[var(--demo-text-secondary)]">{a.action}</span>
                    <span className="text-[var(--demo-text-muted)] ml-1.5">({a.target})</span>
                  </div>
                  <span className="text-[var(--demo-text-muted)] tabular-nums shrink-0">{formatRelativeTime(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      );
    }

    if (section === 'attendance') return <AttendanceModule />;
    if (section === 'leaves') return <LeaveModule />;

    return null;
  };

  return (
    <DemoShell
      workspaceTitle="Team Lead Workspace"
      workspaceBadge="Squad Lead"
      navItems={navItems}
      activeSection={section}
      onSelectSection={setSection}
    >
      {renderContent()}

      {/* Reject Approval Modal */}
      <ModalDialog
        open={Boolean(rejectTarget)}
        title={rejectTarget?.kind === 'leave' ? 'Reject Leave Request' : 'Reject Weekly Timesheet'}
        subtitle="A written rejection reason is required and will be shared with the employee."
        onClose={() => setRejectTarget(null)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setRejectTarget(null)}>Cancel</DemoButton>
            <DemoButton variant="danger" size="sm" onClick={confirmReject}>Confirm Rejection</DemoButton>
          </>
        }
      >
        <form onSubmit={confirmReject} className="space-y-3">
          {rejectError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
              {rejectError}
            </div>
          )}
          <FormField label="Rejection Reason" htmlFor="reject-reason" required>
            <DemoTextarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what needs adjustment or why the dates conflict..."
            />
          </FormField>
        </form>
      </ModalDialog>

      {/* Create Task Modal */}
      <ModalDialog
        open={createTaskOpen}
        title="Assign New Team Task"
        onClose={() => setCreateTaskOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setCreateTaskOpen(false)}>Cancel</DemoButton>
            <DemoButton size="sm" onClick={submitNewTask}>Create Task</DemoButton>
          </>
        }
      >
        <form onSubmit={submitNewTask} className="space-y-3.5">
          <FormField label="Task Title" htmlFor="tl-task-title" required>
            <DemoInput
              id="tl-task-title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g. Add MySQL index for attendance queries"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Project" htmlFor="tl-task-proj">
              <DemoSelect
                id="tl-task-proj"
                value={newTask.projectId || teamProjects[0]?.id || ''}
                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
              >
                {teamProjects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </DemoSelect>
            </FormField>
            <FormField label="Assignee" htmlFor="tl-task-assignee">
              <DemoSelect
                id="tl-task-assignee"
                value={newTask.assigneeId || teamMembers[0]?.id || ''}
                onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
              >
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </DemoSelect>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Priority" htmlFor="tl-task-prio">
              <DemoSelect id="tl-task-prio" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </DemoSelect>
            </FormField>
            <FormField label="Due Date" htmlFor="tl-task-due">
              <DemoInput id="tl-task-due" type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
            </FormField>
            <FormField label="Est. Hours" htmlFor="tl-task-est">
              <DemoInput id="tl-task-est" type="number" min="1" value={newTask.estimatedHours} onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="tl-task-desc">
            <DemoTextarea id="tl-task-desc" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          </FormField>
        </form>
      </ModalDialog>

      {/* Member Detail Drawer */}
      <SlideDrawer
        open={Boolean(memberDrawer)}
        title={memberDrawer?.name || ''}
        subtitle={memberDrawer ? `${memberDrawer.title} • ${memberDrawer.email}` : ''}
        onClose={() => setMemberDrawer(null)}
      >
        {memberDrawer && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <StatusLabel value={memberDrawer.role} />
              <StatusLabel value={memberDrawer.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 border-y border-[var(--demo-border)] py-3">
              <div>
                <div className="text-[var(--demo-text-muted)]">Location</div>
                <div className="font-medium mt-0.5">{memberDrawer.location}</div>
              </div>
              <div>
                <div className="text-[var(--demo-text-muted)]">Weekly Capacity</div>
                <div className="font-medium mt-0.5 tabular-nums">{memberDrawer.weeklyCapacityHours}h</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-[var(--demo-text-muted)] uppercase tracking-wider mb-2">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {memberDrawer.skills.map((s) => (
                  <span key={s} className="px-2 py-1 rounded-md border border-[var(--demo-border)] bg-[var(--demo-surface-2)]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-[var(--demo-text-muted)] uppercase tracking-wider mb-2">
                Assigned Tasks
              </div>
              <div className="divide-y divide-[var(--demo-border)] border border-[var(--demo-border)] rounded-lg">
                {teamTasks
                  .filter((t) => t.assigneeId === memberDrawer.id)
                  .map((t) => (
                    <div key={t.id} className="px-3 py-2 flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{t.key}: {t.title}</span>
                      <StatusLabel value={t.status} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </SlideDrawer>
    </DemoShell>
  );
}
