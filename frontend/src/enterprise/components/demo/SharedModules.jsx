import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  CalendarOff,
  CheckCircle2,
  Clock,
  FolderKanban,
  LogIn,
  LogOut,
  Plus,
  Send,
  Timer,
  User,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import {
  calculateBusinessDays,
  calculateProjectProgress,
  filterAndSortTasks,
  isTaskOverdue,
  paginateItems,
} from '../../lib/workspaceRules.js';
import {
  ConfirmDialog,
  DataTable,
  DemoButton,
  DemoInput,
  DemoSelect,
  DemoTextarea,
  EmptyState,
  FormField,
  MetricTile,
  ModalDialog,
  PageHeader,
  Panel,
  SearchInput,
  SegmentedTabs,
  SlideDrawer,
  StatusLabel,
  formatRelativeTime,
  formatShortDate,
} from './ui.jsx';

/* ============================================================
   1. PERSONAL TASKS MODULE
   ============================================================ */
export function PersonalTasksModule({ title = 'My Tasks', subtitle = 'Track assigned deliverables, progress, and due dates.' }) {
  const { snapshot, auth, runMutation } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editStatus, setEditStatus] = useState('IN_PROGRESS');
  const [editProgress, setEditProgress] = useState(50);

  const userId = snapshot?.currentUser?.id;
  const today = snapshot?.today || new Date().toISOString().slice(0, 10);
  const projectsMap = useMemo(
    () => Object.fromEntries((snapshot?.projects || []).map((p) => [p.id, p])),
    [snapshot?.projects]
  );

  const myTasks = useMemo(
    () => (snapshot?.tasks || []).filter((t) => t.assigneeId === userId),
    [snapshot?.tasks, userId]
  );

  const filtered = useMemo(
    () =>
      filterAndSortTasks(myTasks, {
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortDir,
      }),
    [myTasks, search, statusFilter, priorityFilter, sortBy, sortDir]
  );

  const paged = useMemo(() => paginateItems(filtered, page, 8), [filtered, page]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditProgress(task.progress);
  };

  const saveTaskUpdate = async () => {
    if (!selectedTask) return;
    const res = await runMutation(
      () =>
        apiClient.updateTask(auth, selectedTask.id, {
          status: editStatus,
          progress: Number(editProgress),
        }),
      `Updated ${selectedTask.key} progress.`
    );
    if (res.ok) setSelectedTask(null);
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (t) => (
        <div className="min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--demo-accent-text)]">{t.key}</span>
            <span className="font-medium text-[var(--demo-text)]">{t.title}</span>
          </div>
          <div className="text-xs text-[var(--demo-text-muted)] mt-0.5">
            {projectsMap[t.projectId]?.name || 'General'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (t) => <StatusLabel value={t.status} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (t) => <StatusLabel value={t.priority} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (t) => (
        <div className="w-28">
          <div className="flex justify-between text-xs text-[var(--demo-text-muted)] tabular-nums mb-1">
            <span>{t.progress}%</span>
            <span>{t.loggedHours}/{t.estimatedHours}h</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
            <div
              className="h-full bg-[var(--demo-accent)] rounded-full"
              style={{ width: `${t.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (t) => {
        const overdue = isTaskOverdue(t, today);
        return (
          <div className="flex items-center gap-2 whitespace-nowrap tabular-nums text-xs">
            <span className={overdue ? 'text-red-500 font-medium' : 'text-[var(--demo-text-secondary)]'}>
              {formatShortDate(t.dueDate)}
            </span>
            {overdue && <StatusLabel value="OVERDUE" />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile label="Assigned Tasks" value={myTasks.length} icon={CheckCircle2} />
        <MetricTile
          label="In Progress"
          value={myTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length}
          icon={Clock}
        />
        <MetricTile
          label="Completed"
          value={myTasks.filter((t) => t.status === 'DONE').length}
          icon={CheckCircle2}
        />
        <MetricTile
          label="Overdue"
          value={myTasks.filter((t) => isTaskOverdue(t, today)).length}
          icon={CalendarOff}
        />
      </div>

      <Panel
        title="Task Queue"
        subtitle="Click any task row to inspect details or update status and completion percentage."
        bodyClassName="p-0"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search task key or title..."
              className="w-52"
            />
            <DemoSelect
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
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
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="!w-auto py-1.5 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </DemoSelect>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={paged.items}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          page={paged.page}
          totalPages={paged.totalPages}
          totalItems={paged.totalItems}
          onPageChange={setPage}
          onRowClick={openTask}
          emptyTitle="No tasks match your filters"
          emptyDescription="Clear search filters or wait for new task assignments from your Team Lead."
        />
      </Panel>

      <SlideDrawer
        open={Boolean(selectedTask)}
        title={selectedTask ? `${selectedTask.key}: ${selectedTask.title}` : ''}
        subtitle={selectedTask ? projectsMap[selectedTask.projectId]?.name : ''}
        onClose={() => setSelectedTask(null)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
              Cancel
            </DemoButton>
            <DemoButton size="sm" onClick={saveTaskUpdate}>
              Save Update
            </DemoButton>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusLabel value={selectedTask.status} />
              <StatusLabel value={selectedTask.priority} />
              {isTaskOverdue(selectedTask, today) && <StatusLabel value="OVERDUE" />}
            </div>

            <div className="text-sm text-[var(--demo-text-secondary)] leading-relaxed">
              {selectedTask.description || 'No additional description provided.'}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-y border-[var(--demo-border)] py-3">
              <div>
                <div className="text-[var(--demo-text-muted)]">Due Date</div>
                <div className="font-medium text-[var(--demo-text)] mt-0.5 tabular-nums">
                  {formatShortDate(selectedTask.dueDate)}
                </div>
              </div>
              <div>
                <div className="text-[var(--demo-text-muted)]">Logged / Estimated</div>
                <div className="font-medium text-[var(--demo-text)] mt-0.5 tabular-nums">
                  {selectedTask.loggedHours}h / {selectedTask.estimatedHours}h
                </div>
              </div>
            </div>

            <FormField label="Update Status" htmlFor="task-status-select">
              <DemoSelect
                id="task-status-select"
                value={editStatus}
                onChange={(e) => {
                  const next = e.target.value;
                  setEditStatus(next);
                  if (next === 'DONE') setEditProgress(100);
                  else if (next === 'TODO') setEditProgress(0);
                }}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </DemoSelect>
            </FormField>

            <FormField label={`Completion Progress (${editProgress}%)`} htmlFor="task-progress-range">
              <input
                id="task-progress-range"
                type="range"
                min="0"
                max="100"
                step="5"
                value={editProgress}
                onChange={(e) => setEditProgress(Number(e.target.value))}
                className="w-full accent-[var(--demo-accent)] cursor-pointer"
              />
            </FormField>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}

/* ============================================================
   2. PERSONAL PROJECTS MODULE
   ============================================================ */
export function PersonalProjectsModule() {
  const { snapshot } = useWorkspace();
  const [selectedProject, setSelectedProject] = useState(null);
  const userId = snapshot?.currentUser?.id;
  const tasks = snapshot?.tasks || [];
  const employeesMap = useMemo(
    () => Object.fromEntries((snapshot?.employees || []).map((e) => [e.id, e])),
    [snapshot?.employees]
  );

  const myProjects = useMemo(
    () =>
      (snapshot?.projects || []).filter(
        (p) => p.memberIds.includes(userId) || p.leadId === userId
      ),
    [snapshot?.projects, userId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Projects"
        subtitle="Assigned initiatives, delivery milestones, and linked project tasks."
      />

      {myProjects.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FolderKanban}
            title="No assigned projects yet"
            description="Projects where you are a contributor or lead will appear here."
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProjects.map((project) => {
            const pTasks = tasks.filter((t) => t.projectId === project.id);
            const progress = calculateProjectProgress(project, tasks);
            const lead = employeesMap[project.leadId];
            return (
              <Panel key={project.id} className="hover:border-[var(--demo-border-strong)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-[var(--demo-accent-text)]">
                      {project.code}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--demo-text)] mt-0.5">
                      {project.name}
                    </h3>
                  </div>
                  <StatusLabel value={project.status} />
                </div>

                <p className="text-xs text-[var(--demo-text-secondary)] mt-2 line-clamp-2">
                  {project.description}
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[var(--demo-text-muted)] mb-1 tabular-nums">
                    <span>Delivery Progress</span>
                    <span className="font-semibold text-[var(--demo-text)]">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--demo-surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--demo-accent)] rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--demo-border)] flex items-center justify-between text-xs text-[var(--demo-text-muted)]">
                  <span>Lead: {lead?.name || 'Unassigned'}</span>
                  <span className="tabular-nums">Due {formatShortDate(project.dueDate)}</span>
                  <DemoButton size="xs" variant="secondary" onClick={() => setSelectedProject(project)}>
                    Inspect ({pTasks.length})
                  </DemoButton>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <SlideDrawer
        open={Boolean(selectedProject)}
        title={selectedProject?.name || ''}
        subtitle={selectedProject ? `${selectedProject.code} • Due ${formatShortDate(selectedProject.dueDate)}` : ''}
        onClose={() => setSelectedProject(null)}
      >
        {selectedProject && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusLabel value={selectedProject.status} />
              <StatusLabel value={selectedProject.priority} />
            </div>
            <p className="text-sm text-[var(--demo-text-secondary)] leading-relaxed">
              {selectedProject.description}
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--demo-text-muted)] mb-2">
                Team Contributors ({selectedProject.memberIds.length})
              </h4>
              <div className="divide-y divide-[var(--demo-border)] border border-[var(--demo-border)] rounded-lg">
                {selectedProject.memberIds.map((mId) => {
                  const emp = employeesMap[mId];
                  if (!emp) return null;
                  return (
                    <div key={mId} className="px-3 py-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--demo-text)]">{emp.name}</span>
                      <span className="text-[var(--demo-text-muted)]">{emp.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--demo-text-muted)] mb-2">
                Project Tasks
              </h4>
              <div className="divide-y divide-[var(--demo-border)] border border-[var(--demo-border)] rounded-lg">
                {tasks
                  .filter((t) => t.projectId === selectedProject.id)
                  .map((t) => (
                    <div key={t.id} className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--demo-text)] truncate">{t.title}</div>
                        <div className="text-[var(--demo-text-muted)] mt-0.5">
                          {t.key} • {employeesMap[t.assigneeId]?.name || 'Unassigned'}
                        </div>
                      </div>
                      <StatusLabel value={t.status} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}

/* ============================================================
   3. ATTENDANCE MODULE (CHECK-IN / CHECK-OUT + HISTORY)
   ============================================================ */
export function AttendanceModule({ compactBanner = false }) {
  const { snapshot, auth, runMutation } = useWorkspace();
  const [workMode, setWorkMode] = useState('OFFICE');
  const [notes, setNotes] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const userId = snapshot?.currentUser?.id;
  const today = snapshot?.today || new Date().toISOString().slice(0, 10);
  const myAttendance = useMemo(
    () =>
      (snapshot?.attendance || [])
        .filter((a) => a.employeeId === userId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [snapshot?.attendance, userId]
  );

  const todayRecord = myAttendance.find((a) => a.date === today);
  const filteredHistory = myAttendance.filter((a) => modeFilter === 'ALL' || a.workMode === modeFilter);
  const totalHours =
    Math.round(myAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0) * 10) / 10;

  const handleCheckIn = async () => {
    const res = await runMutation(
      () => apiClient.checkIn(auth, { workMode, notes }),
      `Checked in (${workMode}) for ${today}.`
    );
    if (res.ok) setNotes('');
  };

  const handleCheckOut = async () => {
    const res = await runMutation(
      () => apiClient.checkOut(auth, { notes }),
      'Checked out and recorded daily worked hours.'
    );
    if (res.ok) setNotes('');
  };

  const shiftCard = (
    <Panel
      title={`Daily Attendance — ${formatShortDate(today)}`}
      subtitle={
        todayRecord
          ? todayRecord.checkOut
            ? `Shift completed (${todayRecord.checkIn} – ${todayRecord.checkOut})`
            : `Currently checked in since ${todayRecord.checkIn} (${todayRecord.workMode})`
          : 'You have not checked in yet today.'
      }
      actions={todayRecord ? <StatusLabel value={todayRecord.status} /> : <StatusLabel value="PENDING" label="Not Checked In" />}
    >
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        {!todayRecord && (
          <FormField label="Work Mode" htmlFor="att-mode" className="w-full md:w-44">
            <DemoSelect
              id="att-mode"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
            >
              <option value="OFFICE">Office</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </DemoSelect>
          </FormField>
        )}

        {(!todayRecord || !todayRecord.checkOut) && (
          <FormField label="Shift Note (Optional)" htmlFor="att-note" className="flex-1">
            <DemoInput
              id="att-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={todayRecord ? 'Add end-of-day handoff note...' : 'Focus area for today...'}
            />
          </FormField>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {!todayRecord ? (
            <DemoButton onClick={handleCheckIn}>
              <LogIn className="w-4 h-4" />
              Check In Now
            </DemoButton>
          ) : !todayRecord.checkOut ? (
            <DemoButton variant="secondary" onClick={handleCheckOut}>
              <LogOut className="w-4 h-4" />
              Check Out
            </DemoButton>
          ) : (
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
              {todayRecord.hoursWorked}h logged today
            </div>
          )}
        </div>
      </div>
    </Panel>
  );

  if (compactBanner) return shiftCard;

  const columns = [
    { key: 'date', label: 'Date', render: (a) => <span className="tabular-nums font-medium">{formatShortDate(a.date)}</span> },
    { key: 'checkIn', label: 'Check In', render: (a) => <span className="tabular-nums">{a.checkIn || '—'}</span> },
    { key: 'checkOut', label: 'Check Out', render: (a) => <span className="tabular-nums">{a.checkOut || 'Active'}</span> },
    { key: 'workMode', label: 'Mode', render: (a) => <StatusLabel value={a.workMode} /> },
    { key: 'hoursWorked', label: 'Hours', render: (a) => <span className="tabular-nums">{a.hoursWorked ? `${a.hoursWorked}h` : '—'}</span> },
    { key: 'status', label: 'Status', render: (a) => <StatusLabel value={a.status} /> },
    { key: 'notes', label: 'Notes', render: (a) => <span className="text-xs text-[var(--demo-text-muted)]">{a.notes || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Shift Logs"
        subtitle={`Standard hours: ${snapshot?.activeOrg?.attendancePolicy?.standardStart || '09:30'} – ${snapshot?.activeOrg?.attendancePolicy?.standardEnd || '18:30'} (${snapshot?.activeOrg?.timezone || 'IST'})`}
      />

      {shiftCard}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile label="Recorded Days" value={myAttendance.length} icon={Calendar} />
        <MetricTile label="Total Worked Hours" value={`${totalHours}h`} icon={Clock} />
        <MetricTile
          label="Remote / Hybrid Days"
          value={myAttendance.filter((a) => a.workMode !== 'OFFICE').length}
          icon={Activity}
        />
      </div>

      <Panel
        title="Attendance History"
        bodyClassName="p-0"
        actions={
          <DemoSelect
            aria-label="Filter by work mode"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="!w-auto py-1.5 text-xs"
          >
            <option value="ALL">All Work Modes</option>
            <option value="OFFICE">Office</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
          </DemoSelect>
        }
      >
        <DataTable columns={columns} rows={filteredHistory} emptyTitle="No attendance records" />
      </Panel>
    </div>
  );
}

/* ============================================================
   4. LEAVE REQUESTS MODULE (BALANCES + VALIDATION + CANCEL)
   ============================================================ */
export function LeaveModule() {
  const { snapshot, auth, runMutation } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const todayIso = snapshot?.today || new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: 'ANNUAL',
    startDate: todayIso,
    endDate: todayIso,
    reason: '',
  });
  const [formError, setFormError] = useState('');

  const user = snapshot?.currentUser;
  const myLeaves = useMemo(
    () => (snapshot?.leaves || []).filter((l) => l.employeeId === user?.id),
    [snapshot?.leaves, user?.id]
  );

  const previewDays = calculateBusinessDays(form.startDate, form.endDate);

  const submitLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    const res = await runMutation(
      () => apiClient.createLeave(auth, form),
      'Leave request submitted for Team Lead approval.'
    );
    if (res.ok) {
      setModalOpen(false);
      setForm({ type: 'ANNUAL', startDate: todayIso, endDate: todayIso, reason: '' });
    } else {
      setFormError(res.error);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    await runMutation(
      () => apiClient.cancelLeave(auth, cancelTarget.id),
      'Pending leave request cancelled.'
    );
    setCancelTarget(null);
  };

  const columns = [
    { key: 'type', label: 'Type', render: (l) => <StatusLabel value={l.type} /> },
    {
      key: 'dates',
      label: 'Date Range',
      render: (l) => (
        <span className="tabular-nums text-xs font-medium">
          {formatShortDate(l.startDate)} – {formatShortDate(l.endDate)}
        </span>
      ),
    },
    { key: 'days', label: 'Business Days', render: (l) => <span className="tabular-nums">{l.days}d</span> },
    { key: 'reason', label: 'Reason', render: (l) => <span className="text-xs text-[var(--demo-text-secondary)]">{l.reason}</span> },
    { key: 'status', label: 'Status', render: (l) => <StatusLabel value={l.status} /> },
    {
      key: 'reviewerNote',
      label: 'Reviewer Note',
      render: (l) => <span className="text-xs text-[var(--demo-text-muted)]">{l.reviewerNote || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (l) =>
        l.status === 'PENDING' ? (
          <DemoButton size="xs" variant="dangerSoft" onClick={() => setCancelTarget(l)}>
            Cancel
          </DemoButton>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests & Balances"
        subtitle="Request time off with automatic business-day calculation and overlap checks."
        actions={
          <DemoButton onClick={() => { setFormError(''); setModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Request Leave
          </DemoButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Annual Leave Available"
          value={`${user?.leaveBalance?.annual ?? 0} days`}
          icon={Calendar}
        />
        <MetricTile
          label="Sick Leave Available"
          value={`${user?.leaveBalance?.sick ?? 0} days`}
          icon={CalendarOff}
        />
        <MetricTile
          label="Personal Leave Available"
          value={`${user?.leaveBalance?.personal ?? 0} days`}
          icon={Clock}
        />
      </div>

      <Panel title="My Leave History" bodyClassName="p-0">
        <DataTable
          columns={columns}
          rows={myLeaves}
          emptyTitle="No leave requests submitted"
          emptyDescription="Use Request Leave to schedule annual, sick, or personal time off."
        />
      </Panel>

      <ModalDialog
        open={modalOpen}
        title="New Leave Request"
        subtitle="Overlap and leave balance validation runs automatically."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </DemoButton>
            <DemoButton size="sm" onClick={submitLeave}>
              Submit Request
            </DemoButton>
          </>
        }
      >
        <form onSubmit={submitLeave} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
              {formError}
            </div>
          )}
          <FormField label="Leave Type" htmlFor="leave-type" required>
            <DemoSelect
              id="leave-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="ANNUAL">Annual Leave ({user?.leaveBalance?.annual ?? 0}d left)</option>
              <option value="SICK">Sick Leave ({user?.leaveBalance?.sick ?? 0}d left)</option>
              <option value="PERSONAL">Personal Leave ({user?.leaveBalance?.personal ?? 0}d left)</option>
              <option value="UNPAID">Unpaid Leave</option>
            </DemoSelect>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" htmlFor="leave-start" required>
              <DemoInput
                id="leave-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date" htmlFor="leave-end" required>
              <DemoInput
                id="leave-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="rounded-lg bg-[var(--demo-surface-2)] px-3 py-2 text-xs text-[var(--demo-text-secondary)] flex items-center justify-between">
            <span>Calculated Working Days (Mon–Fri)</span>
            <span className="font-semibold text-[var(--demo-text)] tabular-nums">{previewDays} day(s)</span>
          </div>

          <FormField label="Reason & Coverage Plan" htmlFor="leave-reason" required>
            <DemoTextarea
              id="leave-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Explain reason and who covers ongoing tasks..."
            />
          </FormField>
        </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Leave Request?"
        message={
          cancelTarget
            ? `Are you sure you want to cancel your pending ${cancelTarget.type.toLowerCase()} leave (${cancelTarget.startDate} to ${cancelTarget.endDate})?`
            : ''
        }
        confirmLabel="Cancel Leave"
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}

/* ============================================================
   5. WORKLOGS & WEEKLY TIMESHEETS MODULE
   ============================================================ */
export function WorklogsTimesheetsModule() {
  const { snapshot, auth, runMutation } = useWorkspace();
  const [tab, setTab] = useState('worklogs');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const userId = snapshot?.currentUser?.id;
  const projects = snapshot?.projects || [];
  const tasks = (snapshot?.tasks || []).filter((t) => t.assigneeId === userId);
  const projectsMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    taskId: '',
    date: snapshot?.today || new Date().toISOString().slice(0, 10),
    hours: '2.5',
    billable: true,
    summary: '',
  });

  const myWorklogs = useMemo(
    () => (snapshot?.worklogs || []).filter((w) => w.employeeId === userId),
    [snapshot?.worklogs, userId]
  );

  const myTimesheets = useMemo(
    () => (snapshot?.timesheets || []).filter((ts) => ts.employeeId === userId),
    [snapshot?.timesheets, userId]
  );

  const totalLogged = Math.round(myWorklogs.reduce((s, w) => s + w.hours, 0) * 10) / 10;
  const billableHours =
    Math.round(myWorklogs.filter((w) => w.billable).reduce((s, w) => s + w.hours, 0) * 10) / 10;

  const submitWorklog = async (e) => {
    e.preventDefault();
    setFormError('');
    const res = await runMutation(
      () =>
        apiClient.createWorklog(auth, {
          projectId: form.projectId || projects[0]?.id,
          taskId: form.taskId || null,
          date: form.date,
          hours: Number(form.hours),
          billable: form.billable,
          summary: form.summary,
        }),
      'Worklog entry saved and added to your weekly timesheet.'
    );
    if (res.ok) {
      setModalOpen(false);
      setForm({ ...form, summary: '', hours: '2' });
    } else {
      setFormError(res.error);
    }
  };

  const handleSubmitTimesheet = (id) => {
    runMutation(
      () => apiClient.submitTimesheet(auth, id),
      'Weekly timesheet submitted for Team Lead review.'
    );
  };

  const worklogCols = [
    { key: 'date', label: 'Date', render: (w) => <span className="tabular-nums font-medium">{formatShortDate(w.date)}</span> },
    {
      key: 'project',
      label: 'Project',
      render: (w) => (
        <span className="text-xs font-medium">{projectsMap[w.projectId]?.name || w.projectId}</span>
      ),
    },
    { key: 'hours', label: 'Hours', render: (w) => <span className="tabular-nums font-semibold">{w.hours}h</span> },
    {
      key: 'billable',
      label: 'Billing',
      render: (w) => (
        <span className="text-xs text-[var(--demo-text-secondary)]">
          {w.billable ? 'Billable' : 'Internal'}
        </span>
      ),
    },
    { key: 'summary', label: 'Summary', render: (w) => <span className="text-xs text-[var(--demo-text-secondary)]">{w.summary}</span> },
    { key: 'status', label: 'Status', render: (w) => <StatusLabel value={w.status} /> },
  ];

  const tsCols = [
    {
      key: 'week',
      label: 'Week Window',
      render: (ts) => (
        <span className="tabular-nums font-medium text-xs">
          {formatShortDate(ts.weekStart)} – {formatShortDate(ts.weekEnd)}
        </span>
      ),
    },
    { key: 'totalHours', label: 'Total Hours', render: (ts) => <span className="tabular-nums font-semibold">{ts.totalHours}h</span> },
    { key: 'billableHours', label: 'Billable', render: (ts) => <span className="tabular-nums">{ts.billableHours}h</span> },
    { key: 'entriesCount', label: 'Entries', render: (ts) => <span className="tabular-nums">{ts.entriesCount}</span> },
    { key: 'status', label: 'Status', render: (ts) => <StatusLabel value={ts.status} /> },
    {
      key: 'reviewerNote',
      label: 'Review Note',
      render: (ts) => <span className="text-xs text-[var(--demo-text-muted)]">{ts.reviewerNote || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (ts) =>
        ts.status === 'DRAFT' || ts.status === 'REJECTED' ? (
          <DemoButton size="xs" onClick={() => handleSubmitTimesheet(ts.id)}>
            <Send className="w-3.5 h-3.5" />
            Submit
          </DemoButton>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worklogs & Weekly Timesheets"
        subtitle="Log project time with 24h daily cap enforcement and submit timesheets for approval."
        actions={
          <DemoButton
            onClick={() => {
              setFormError('');
              setForm((prev) => ({ ...prev, projectId: prev.projectId || projects[0]?.id || '' }));
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Log Work
          </DemoButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile label="Total Logged Hours" value={`${totalLogged}h`} icon={Timer} />
        <MetricTile label="Billable Hours" value={`${billableHours}h`} icon={Clock} />
        <MetricTile
          label="Timesheets Submitted"
          value={myTimesheets.filter((t) => t.status === 'SUBMITTED' || t.status === 'APPROVED').length}
          icon={CheckCircle2}
        />
      </div>

      <SegmentedTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'worklogs', label: 'Worklog Entries', count: myWorklogs.length },
          { id: 'timesheets', label: 'Weekly Timesheets', count: myTimesheets.length },
        ]}
      />

      {tab === 'worklogs' ? (
        <Panel title="Worklog Entries" bodyClassName="p-0">
          <DataTable columns={worklogCols} rows={myWorklogs} emptyTitle="No worklogs yet" />
        </Panel>
      ) : (
        <Panel title="Weekly Timesheets" bodyClassName="p-0">
          <DataTable columns={tsCols} rows={myTimesheets} emptyTitle="No timesheets yet" />
        </Panel>
      )}

      <ModalDialog
        open={modalOpen}
        title="Log Project Work"
        subtitle="Entries must be between 0.25h and 16h and cannot exceed 24h in a single day."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <DemoButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </DemoButton>
            <DemoButton size="sm" onClick={submitWorklog}>
              Save Worklog
            </DemoButton>
          </>
        }
      >
        <form onSubmit={submitWorklog} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
              {formError}
            </div>
          )}
          <FormField label="Project" htmlFor="wl-project" required>
            <DemoSelect
              id="wl-project"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </DemoSelect>
          </FormField>

          <FormField label="Linked Task (Optional)" htmlFor="wl-task">
            <DemoSelect
              id="wl-task"
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
            >
              <option value="">No specific task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.key} — {t.title}
                </option>
              ))}
            </DemoSelect>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date" htmlFor="wl-date" required>
              <DemoInput
                id="wl-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
            <FormField label="Hours Worked" htmlFor="wl-hours" required>
              <DemoInput
                id="wl-hours"
                type="number"
                step="0.25"
                min="0.25"
                max="16"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--demo-text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              className="rounded accent-[var(--demo-accent)]"
            />
            <span>Mark hours as billable client/project delivery</span>
          </label>

          <FormField label="Work Summary" htmlFor="wl-summary" required>
            <DemoTextarea
              id="wl-summary"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Summarize features completed, bugs fixed, or reviews done..."
            />
          </FormField>
        </form>
      </ModalDialog>
    </div>
  );
}

/* ============================================================
   6. NOTIFICATIONS & ACTIVITY MODULE
   ============================================================ */
export function NotificationsActivityModule() {
  const { snapshot, auth, runMutation } = useWorkspace();
  const [tab, setTab] = useState('notifications');
  const notifications = snapshot?.notifications || [];
  const activities = snapshot?.activities || [];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Activity"
        subtitle="Workspace alerts, approval decisions, and recent audit events."
        actions={
          unread > 0 && (
            <DemoButton
              size="sm"
              variant="secondary"
              onClick={() =>
                runMutation(
                  () => apiClient.markAllNotificationsRead(auth),
                  'Marked all notifications as read.'
                )
              }
            >
              Mark All Read ({unread})
            </DemoButton>
          )
        }
      />

      <SegmentedTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'notifications', label: 'Notifications', count: notifications.length },
          { id: 'activity', label: 'Recent Activity', count: activities.length },
        ]}
      />

      {tab === 'notifications' ? (
        <Panel bodyClassName="p-0">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="You are all caught up" />
          ) : (
            <div className="divide-y divide-[var(--demo-border)]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex items-start justify-between gap-4 ${
                    !n.read ? 'bg-[var(--demo-accent-soft)]/35' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--demo-text)]">{n.title}</span>
                      <StatusLabel value={n.category} />
                    </div>
                    <p className="text-xs text-[var(--demo-text-secondary)] mt-1">{n.message}</p>
                    <p className="text-[11px] text-[var(--demo-text-muted)] mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <DemoButton
                      size="xs"
                      variant="secondary"
                      onClick={() => runMutation(() => apiClient.markNotificationRead(auth, n.id))}
                    >
                      Mark Read
                    </DemoButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : (
        <Panel bodyClassName="p-0">
          {activities.length === 0 ? (
            <EmptyState icon={Activity} title="No activity logged yet" />
          ) : (
            <div className="divide-y divide-[var(--demo-border)]">
              {activities.slice(0, 25).map((act) => (
                <div key={act.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--demo-text)]">
                      <span className="font-medium">{act.actorName}</span>{' '}
                      <span className="text-[var(--demo-text-secondary)]">{act.action}</span>
                    </div>
                    <div className="text-xs text-[var(--demo-text-muted)] mt-0.5">
                      {act.target} • {formatRelativeTime(act.timestamp)}
                    </div>
                  </div>
                  <StatusLabel value={act.category} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   7. EDITABLE PROFILE MODULE
   ============================================================ */
export function ProfileModule() {
  const { snapshot, auth, runMutation } = useWorkspace();
  const user = snapshot?.currentUser;
  const dept = (snapshot?.departments || []).find((d) => d.id === user?.departmentId);
  const team = (snapshot?.teams || []).find((t) => t.id === user?.teamId);

  const [form, setForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    location: user?.location || '',
    phone: user?.phone || '',
    skills: (user?.skills || []).join(', '),
  });

  if (!user) return null;

  const saveProfile = async (e) => {
    e.preventDefault();
    await runMutation(
      () =>
        apiClient.updateEmployee(auth, user.id, {
          name: form.name,
          title: form.title,
          location: form.location,
          phone: form.phone,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      'Personal profile updated.'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Update your contact details, role title, and technical skills."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Panel title="Employment Summary">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--demo-border)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--demo-accent)] text-white font-semibold flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[var(--demo-text)] truncate">{user.name}</div>
              <div className="text-xs text-[var(--demo-text-muted)] truncate">{user.email}</div>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-[var(--demo-text-muted)]">Employee Code</dt>
              <dd className="font-mono font-medium text-[var(--demo-text)]">{user.employeeCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--demo-text-muted)]">Department</dt>
              <dd className="font-medium text-[var(--demo-text)]">{dept?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--demo-text-muted)]">Team</dt>
              <dd className="font-medium text-[var(--demo-text)]">{team?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--demo-text-muted)]">Role</dt>
              <dd><StatusLabel value={user.role} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--demo-text-muted)]">Joined</dt>
              <dd className="tabular-nums text-[var(--demo-text)]">{formatShortDate(user.joinedAt)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Editable Details" className="lg:col-span-2">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" htmlFor="prof-name" required>
                <DemoInput
                  id="prof-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </FormField>
              <FormField label="Job Title" htmlFor="prof-title" required>
                <DemoInput
                  id="prof-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </FormField>
              <FormField label="Location" htmlFor="prof-loc">
                <DemoInput
                  id="prof-loc"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </FormField>
              <FormField label="Phone" htmlFor="prof-phone">
                <DemoInput
                  id="prof-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </FormField>
            </div>
            <FormField
              label="Skills (comma-separated)"
              htmlFor="prof-skills"
              hint="Visible to Team Leads during task allocation."
            >
              <DemoInput
                id="prof-skills"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </FormField>
            <div className="pt-2 flex justify-end">
              <DemoButton type="submit">Save Profile Changes</DemoButton>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
