const ROLE_PERMISSIONS = {
  ORG_ADMIN: new Set([
    'org:edit',
    'employee:manage',
    'invitation:manage',
    'department:manage',
    'team:manage',
    'project:create',
    'task:create',
    'task:reassign',
    'task:update_own',
    'approval:review',
    'attendance:self',
    'leave:request',
    'worklog:self',
    'reports:org',
    'reports:team',
  ]),
  TEAM_LEAD: new Set([
    'task:create',
    'task:reassign',
    'task:update_own',
    'approval:review',
    'attendance:self',
    'leave:request',
    'worklog:self',
    'reports:team',
  ]),
  PROFESSIONAL: new Set([
    'task:update_own',
    'attendance:self',
    'leave:request',
    'worklog:self',
  ]),
  EMPLOYEE: new Set([
    'task:update_own',
    'attendance:self',
    'leave:request',
    'worklog:self',
  ]),
  STUDENT: new Set([]),
};

export function canPerformAction(role, action) {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export function isValidEmail(email) {
  const trimmed = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Counts inclusive weekday (Mon-Fri) business days between two ISO date strings (YYYY-MM-DD).
 */
export function calculateBusinessDays(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return 0;
  }
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function validateLeaveRequestInput(input, existingRequests = []) {
  const days = calculateBusinessDays(input.startDate, input.endDate);
  if (!input.startDate || !input.endDate) {
    return { valid: false, error: 'Start date and end date are required.', days: 0 };
  }
  if (input.endDate < input.startDate) {
    return { valid: false, error: 'End date cannot be earlier than start date.', days: 0 };
  }
  if (days <= 0) {
    return { valid: false, error: 'Selected date range must include at least one working day.', days: 0 };
  }
  if (!input.reason || input.reason.trim().length < 5) {
    return { valid: false, error: 'Please provide a brief reason (at least 5 characters).', days };
  }

  const overlapping = existingRequests.find(
    (req) =>
      (req.status === 'PENDING' || req.status === 'APPROVED') &&
      input.startDate <= req.endDate &&
      input.endDate >= req.startDate
  );

  if (overlapping) {
    return {
      valid: false,
      error: `Dates overlap with an existing ${overlapping.status.toLowerCase()} leave (${overlapping.startDate} to ${overlapping.endDate}).`,
      days,
    };
  }

  return { valid: true, days };
}

export function validateWorklogInput(input, existingDailyHours = 0) {
  if (!input.projectId) {
    return { valid: false, error: 'Select a project for this worklog.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { valid: false, error: 'Provide a valid worklog date.' };
  }
  if (!Number.isFinite(input.hours) || input.hours < 0.25 || input.hours > 16) {
    return { valid: false, error: 'Logged hours must be between 0.25 and 16 hours.' };
  }
  if (existingDailyHours + input.hours > 24) {
    return {
      valid: false,
      error: `Total hours on ${input.date} cannot exceed 24h (already logged ${existingDailyHours}h).`,
    };
  }
  if (!input.summary || input.summary.trim().length < 4) {
    return { valid: false, error: 'Provide a short summary of work completed.' };
  }
  return { valid: true };
}

export function computeHoursBetween(checkIn, checkOut) {
  const [inH, inM] = String(checkIn || '').split(':').map(Number);
  const [outH, outM] = String(checkOut || '').split(':').map(Number);
  if (
    !Number.isFinite(inH) ||
    !Number.isFinite(inM) ||
    !Number.isFinite(outH) ||
    !Number.isFinite(outM)
  ) {
    return 0;
  }
  const diffMins = outH * 60 + outM - (inH * 60 + inM);
  if (diffMins <= 0) return 0;
  return Math.round((diffMins / 60) * 100) / 100;
}

export function isTaskOverdue(task, today) {
  if (task.status === 'DONE') return false;
  return task.dueDate < today;
}

export function calculateProjectProgress(project, tasks) {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  if (projectTasks.length === 0) return 0;
  const totalProgress = projectTasks.reduce((sum, t) => {
    if (t.status === 'DONE') return sum + 100;
    return sum + Math.max(0, Math.min(100, t.progress));
  }, 0);
  return Math.round(totalProgress / projectTasks.length);
}

const PRIORITY_WEIGHT = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function filterAndSortTasks(tasks, options = {}) {
  const q = (options.search ?? '').trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (options.status && options.status !== 'ALL' && task.status !== options.status) return false;
    if (options.priority && options.priority !== 'ALL' && task.priority !== options.priority) return false;
    if (options.projectId && options.projectId !== 'ALL' && task.projectId !== options.projectId) return false;
    if (options.assigneeId && options.assigneeId !== 'ALL' && task.assigneeId !== options.assigneeId) return false;
    if (q) {
      const hay = `${task.key} ${task.title} ${task.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const dir = options.sortDir === 'desc' ? -1 : 1;
  const sortBy = options.sortBy ?? 'dueDate';

  return [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      return ((PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)) * dir;
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title) * dir;
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status) * dir;
    }
    return a.dueDate.localeCompare(b.dueDate) * dir;
  });
}

export function paginateItems(items, page, pageSize) {
  const safeSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const clampedPage = Math.max(1, Math.min(page, totalPages));
  const start = (clampedPage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    page: clampedPage,
    totalPages,
    totalItems,
  };
}

export function computeMemberWorkload(employees, tasks, worklogs, today) {
  return employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assigneeId === emp.id && t.status !== 'DONE');
    const overdueTasks = empTasks.filter((t) => isTaskOverdue(t, today)).length;
    const loggedHours =
      Math.round(
        worklogs
          .filter((w) => w.employeeId === emp.id)
          .reduce((sum, w) => sum + w.hours, 0) * 10
      ) / 10;
    const capacityHours = emp.weeklyCapacityHours || 40;
    const utilizationPct = Math.min(150, Math.round((loggedHours / capacityHours) * 100));

    return {
      employeeId: emp.id,
      name: emp.name,
      title: emp.title,
      teamId: emp.teamId,
      openTasks: empTasks.length,
      overdueTasks,
      loggedHours,
      capacityHours,
      utilizationPct,
    };
  });
}
