import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBusinessDays,
  calculateProjectProgress,
  canPerformAction,
  computeHoursBetween,
  computeMemberWorkload,
  filterAndSortTasks,
  isTaskOverdue,
  isValidEmail,
  paginateItems,
  validateLeaveRequestInput,
  validateWorklogInput,
} from './workspaceRules.js';

test('RBAC permission matrix enforces role boundaries strictly', () => {
  assert.equal(canPerformAction('ORG_ADMIN', 'org:edit'), true);
  assert.equal(canPerformAction('ORG_ADMIN', 'department:manage'), true);
  assert.equal(canPerformAction('ORG_ADMIN', 'approval:review'), true);

  assert.equal(canPerformAction('TEAM_LEAD', 'approval:review'), true);
  assert.equal(canPerformAction('TEAM_LEAD', 'task:reassign'), true);
  assert.equal(canPerformAction('TEAM_LEAD', 'department:manage'), false);
  assert.equal(canPerformAction('TEAM_LEAD', 'org:edit'), false);

  assert.equal(canPerformAction('PROFESSIONAL', 'task:update_own'), true);
  assert.equal(canPerformAction('PROFESSIONAL', 'approval:review'), false);
  assert.equal(canPerformAction('PROFESSIONAL', 'task:reassign'), false);

  assert.equal(canPerformAction('EMPLOYEE', 'attendance:self'), true);
  assert.equal(canPerformAction('EMPLOYEE', 'leave:request'), true);
  assert.equal(canPerformAction('EMPLOYEE', 'approval:review'), false);
  assert.equal(canPerformAction('EMPLOYEE', 'employee:manage'), false);

  assert.equal(canPerformAction('STUDENT', 'org:edit'), false);
});

test('email validation accepts valid corporate emails and rejects malformed input', () => {
  assert.equal(isValidEmail('ananya.sharma@srhcodeverse.io'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('missing@domain'), false);
  assert.equal(isValidEmail(''), false);
});

test('calculateBusinessDays excludes weekends and rejects inverted ranges', () => {
  assert.equal(calculateBusinessDays('2026-11-16', '2026-11-20'), 5);
  assert.equal(calculateBusinessDays('2026-11-20', '2026-11-23'), 2);
  assert.equal(calculateBusinessDays('2026-11-21', '2026-11-22'), 0);
  assert.equal(calculateBusinessDays('2026-11-25', '2026-11-20'), 0);
});

test('validateLeaveRequestInput catches overlaps, short reasons, and invalid dates', () => {
  const existing = [
    { startDate: '2026-11-24', endDate: '2026-11-26', status: 'APPROVED' },
    { startDate: '2026-12-01', endDate: '2026-12-02', status: 'REJECTED' },
  ];

  const ok = validateLeaveRequestInput(
    { startDate: '2026-12-01', endDate: '2026-12-02', reason: 'Family travel planned' },
    existing
  );
  assert.equal(ok.valid, true);
  assert.equal(ok.days, 2);

  const overlap = validateLeaveRequestInput(
    { startDate: '2026-11-25', endDate: '2026-11-27', reason: 'Medical checkup' },
    existing
  );
  assert.equal(overlap.valid, false);
  assert.match(overlap.error ?? '', /overlap/i);

  const shortReason = validateLeaveRequestInput(
    { startDate: '2026-12-08', endDate: '2026-12-08', reason: 'Off' },
    existing
  );
  assert.equal(shortReason.valid, false);
});

test('validateWorklogInput enforces duration bounds and daily 24h cap', () => {
  assert.equal(
    validateWorklogInput(
      { projectId: 'proj-1', date: '2026-11-19', hours: 3.5, summary: 'API integration tests' },
      6
    ).valid,
    true
  );
  assert.equal(
    validateWorklogInput(
      { projectId: 'proj-1', date: '2026-11-19', hours: 0.1, summary: 'Too short' },
      0
    ).valid,
    false
  );
  assert.equal(
    validateWorklogInput(
      { projectId: 'proj-1', date: '2026-11-19', hours: 10, summary: 'Exceeds daily limit' },
      16
    ).valid,
    false
  );
});

test('computeHoursBetween calculates decimal hours accurately', () => {
  assert.equal(computeHoursBetween('09:00', '17:30'), 8.5);
  assert.equal(computeHoursBetween('09:15', '18:00'), 8.75);
  assert.equal(computeHoursBetween('18:00', '09:00'), 0);
});

test('task filtering, sorting, overdue detection, progress, and pagination work deterministically', () => {
  const tasks = [
    {
      id: 't1',
      orgId: 'org-1',
      key: 'CV-101',
      projectId: 'p1',
      teamId: 'tm1',
      title: 'Audit RBAC policies',
      description: 'Verify server endpoints',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'e1',
      reporterId: 'e0',
      dueDate: '2026-11-18',
      estimatedHours: 8,
      loggedHours: 4,
      progress: 50,
      updatedAt: '2026-11-19T10:00:00Z',
    },
    {
      id: 't2',
      orgId: 'org-1',
      key: 'CV-102',
      projectId: 'p1',
      teamId: 'tm1',
      title: 'Ship timesheet approvals',
      description: 'Add rejection notes',
      status: 'DONE',
      priority: 'CRITICAL',
      assigneeId: 'e2',
      reporterId: 'e0',
      dueDate: '2026-11-15',
      estimatedHours: 6,
      loggedHours: 6,
      progress: 100,
      updatedAt: '2026-11-15T16:00:00Z',
    },
    {
      id: 't3',
      orgId: 'org-1',
      key: 'CV-103',
      projectId: 'p2',
      teamId: 'tm1',
      title: 'Refactor pagination hook',
      description: 'Keep URL synced',
      status: 'TODO',
      priority: 'LOW',
      assigneeId: 'e1',
      reporterId: 'e0',
      dueDate: '2026-11-28',
      estimatedHours: 4,
      loggedHours: 0,
      progress: 0,
      updatedAt: '2026-11-19T08:00:00Z',
    },
  ];

  assert.equal(isTaskOverdue(tasks[0], '2026-11-19'), true);
  assert.equal(isTaskOverdue(tasks[1], '2026-11-19'), false);
  assert.equal(isTaskOverdue(tasks[2], '2026-11-19'), false);
  assert.equal(calculateProjectProgress({ id: 'p1' }, tasks), 75);

  const sortedByPriority = filterAndSortTasks(tasks, { sortBy: 'priority', sortDir: 'asc' });
  assert.equal(sortedByPriority[0].id, 't2');
  assert.equal(sortedByPriority[2].id, 't3');

  const searched = filterAndSortTasks(tasks, { search: 'rbac' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].key, 'CV-101');

  const page2 = paginateItems(tasks, 2, 2);
  assert.equal(page2.items.length, 1);
  assert.equal(page2.totalPages, 2);
  assert.equal(page2.items[0].id, 't3');

  const employees = [
    {
      id: 'e1',
      orgId: 'org-1',
      employeeCode: 'EMP-001',
      name: 'Riya Patel',
      email: 'riya@example.com',
      title: 'Senior Engineer',
      role: 'PROFESSIONAL',
      departmentId: 'd1',
      teamId: 'tm1',
      status: 'ACTIVE',
      location: 'Bengaluru',
      phone: '+91 90000 00001',
      skills: ['React', 'Java'],
      joinedAt: '2024-01-10',
      weeklyCapacityHours: 40,
      leaveBalance: { annual: 14, sick: 8, personal: 4 },
    },
  ];
  const worklogs = [
    {
      id: 'w1',
      orgId: 'org-1',
      employeeId: 'e1',
      projectId: 'p1',
      taskId: 't1',
      date: '2026-11-19',
      hours: 20,
      billable: true,
      summary: 'Implemented RBAC middleware',
      status: 'LOGGED',
      createdAt: '2026-11-19T12:00:00Z',
    },
  ];
  const workload = computeMemberWorkload(employees, tasks, worklogs, '2026-11-19');
  assert.equal(workload[0].openTasks, 2);
  assert.equal(workload[0].overdueTasks, 1);
  assert.equal(workload[0].utilizationPct, 50);
});
