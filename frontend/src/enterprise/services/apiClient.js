const API_BASE = (import.meta.env.VITE_ENTERPRISE_API_URL || 'http://localhost:8081').replace(/\/+$/, '');

const WORKSPACE_TOKEN_KEY = 'srh_workspace_session_token';

export function getWorkspaceSessionToken() {
  try {
    return window.sessionStorage.getItem(WORKSPACE_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setWorkspaceSessionToken(token) {
  try {
    if (token) window.sessionStorage.setItem(WORKSPACE_TOKEN_KEY, token);
    else window.sessionStorage.removeItem(WORKSPACE_TOKEN_KEY);
  } catch {
    // ignore storage failure
  }
}

export function clearWorkspaceSessionToken() {
  setWorkspaceSessionToken('');
}

function buildUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getWorkspaceSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const target = API_BASE || 'same-origin /api';
    throw new Error(
      `Unable to reach the Spring Boot backend at ${target} (${networkErr?.message || 'network error'}). Ensure the Java/Spring Boot server and MySQL database are running and VITE_API_BASE_URL is configured.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let message = `Backend API error (${response.status} ${response.statusText || ''}).`.trim();
    if (isJson) {
      try {
        const errBody = await response.json();
        if (errBody?.message) message = errBody.message;
        else if (errBody?.error) message = errBody.error;
      } catch {
        // keep status message
      }
    } else if (response.status === 404) {
      message =
        'Spring Boot REST API endpoint returned 404. Configure VITE_API_BASE_URL to point to your running Spring Boot backend (e.g. http://localhost:8080).';
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) return { ok: true };
  if (!isJson) {
    throw new Error(
      'Received non-JSON response from API endpoint. Verify VITE_API_BASE_URL points to the running Spring Boot backend instead of the Vite static server.'
    );
  }
  return response.json();
}

export const apiClient = {
  fetchSnapshot() {
    return request('GET', '/api/workspace-data');
  },

  updateOrganization(payload) {
    return request('PATCH', '/api/organization', payload);
  },

  createEmployee(payload) {
    return request('POST', '/api/employees', payload);
  },

  updateEmployee(id, payload) {
    return request('PATCH', `/api/employees/${encodeURIComponent(id)}`, payload);
  },

  createInvitation(payload) {
    return request('POST', '/api/invitations', payload);
  },

  resendInvitation(id) {
    return request('POST', `/api/invitations/${encodeURIComponent(id)}/resend`, {});
  },

  cancelInvitation(id) {
    return request('POST', `/api/invitations/${encodeURIComponent(id)}/cancel`, {});
  },

  createDepartment(payload) {
    return request('POST', '/api/departments', payload);
  },

  updateDepartment(id, payload) {
    return request('PATCH', `/api/departments/${encodeURIComponent(id)}`, payload);
  },

  deleteDepartment(id) {
    return request('DELETE', `/api/departments/${encodeURIComponent(id)}`);
  },

  createTeam(payload) {
    return request('POST', '/api/teams', payload);
  },

  updateTeam(id, payload) {
    return request('PATCH', `/api/teams/${encodeURIComponent(id)}`, payload);
  },

  deleteTeam(id) {
    return request('DELETE', `/api/teams/${encodeURIComponent(id)}`);
  },

  createProject(payload) {
    return request('POST', '/api/projects', payload);
  },

  updateProject(id, payload) {
    return request('PATCH', `/api/projects/${encodeURIComponent(id)}`, payload);
  },

  createTask(payload) {
    return request('POST', '/api/tasks', payload);
  },

  updateTask(id, payload) {
    return request('PATCH', `/api/tasks/${encodeURIComponent(id)}`, payload);
  },

  checkIn(payload) {
    return request('POST', '/api/attendance/check-in', payload);
  },

  checkOut(payload) {
    return request('POST', '/api/attendance/check-out', payload);
  },

  createLeave(payload) {
    return request('POST', '/api/leaves', payload);
  },

  cancelLeave(id) {
    return request('POST', `/api/leaves/${encodeURIComponent(id)}/cancel`, {});
  },

  reviewLeave(id, payload) {
    return request('POST', `/api/leaves/${encodeURIComponent(id)}/review`, payload);
  },

  createWorklog(payload) {
    return request('POST', '/api/worklogs', payload);
  },

  submitTimesheet(id) {
    return request('POST', `/api/timesheets/${encodeURIComponent(id)}/submit`, {});
  },

  reviewTimesheet(id, payload) {
    return request('POST', `/api/timesheets/${encodeURIComponent(id)}/review`, payload);
  },

  markNotificationRead(id) {
    return request('POST', `/api/notifications/${encodeURIComponent(id)}/read`, {});
  },

  markAllNotificationsRead() {
    return request('POST', '/api/notifications/read-all');
  },
};

export const workspaceAuthApi = {
  login(email, password) {
    return request('POST', '/api/auth/login', { email, password });
  },
  logout() {
    return request('POST', '/api/auth/logout');
  },
  verifySession() {
    return request('GET', '/api/auth/session');
  },
};