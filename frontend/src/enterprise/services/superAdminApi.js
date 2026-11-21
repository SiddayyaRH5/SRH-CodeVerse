const API_BASE_URL = (import.meta.env.VITE_ENTERPRISE_API_URL || 'http://localhost:8081').replace(/\/+$/, '');
const TOKEN_STORAGE_KEY = 'srh_platform_session_token';

export class SuperAdminApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', detail = null } = {}) {
    super(message);
    this.name = 'SuperAdminApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function getSuperAdminApiBaseUrl() {
  return API_BASE_URL || 'same-origin /api';
}

export function getStoredSessionToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredSessionToken(token) {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

export function clearStoredSessionToken() {
  setStoredSessionToken('');
}

async function requestSuperAdmin(path, { method = 'GET', body, tokenOverride } = {}) {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const targetLabel = getSuperAdminApiBaseUrl();
  const token = tokenOverride !== undefined ? tokenOverride : getStoredSessionToken();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SuperAdminApiError(
      `Unable to reach the SRH CodeVerse Spring Boot API at ${targetLabel}. Verify the backend server and MySQL database are running.`,
      { status: 0, code: 'NETWORK_ERROR' }
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    const text = await response.text().catch(() => '');
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    if (!isJson && (response.status === 404 || response.status === 502 || response.status === 503)) {
      throw new SuperAdminApiError(
        `Spring Boot API endpoint (${path}) is unavailable at ${targetLabel}. Configure VITE_API_BASE_URL to point to your running Spring Boot backend (e.g. http://localhost:8080).`,
        { status: 0, code: 'NETWORK_ERROR' }
      );
    }
    if (response.status === 401 || response.status === 403) {
      if (path !== '/api/super-admin/auth/login') {
        clearStoredSessionToken();
      }
    }
    const serverMessage =
      (payload && (payload.message || payload.error || payload.detail)) ||
      `Request failed with HTTP ${response.status}.`;
    throw new SuperAdminApiError(serverMessage, {
      status: response.status,
      code: response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR',
      detail: payload,
    });
  }

  return payload;
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '' && v !== 'ALL') {
      qs.set(k, String(v).trim());
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const superAdminApi = {
  async login(email, password) {
    const res = await requestSuperAdmin('/api/super-admin/auth/login', {
      method: 'POST',
      body: { email, password },
      tokenOverride: '',
    });
    if (res && res.token) {
      setStoredSessionToken(res.token);
    }
    return res;
  },

  async logout() {
    try {
      await requestSuperAdmin('/api/super-admin/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session token even if server is already unreachable
    } finally {
      clearStoredSessionToken();
    }
  },

  verifySession() {
    return requestSuperAdmin('/api/super-admin/session');
  },

  getOverview() {
    return requestSuperAdmin('/api/super-admin/overview');
  },

  listOrganizations(filters = {}) {
    return requestSuperAdmin(`/api/super-admin/organizations${buildQuery(filters)}`);
  },

  getOrganizationDetails(orgId) {
    return requestSuperAdmin(`/api/super-admin/organizations/${encodeURIComponent(orgId)}`);
  },

  createOrganization(payload) {
    return requestSuperAdmin('/api/super-admin/organizations', {
      method: 'POST',
      body: payload,
    });
  },

  updateOrganization(orgId, payload) {
    return requestSuperAdmin(`/api/super-admin/organizations/${encodeURIComponent(orgId)}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  activateOrganization(orgId) {
    return requestSuperAdmin(`/api/super-admin/organizations/${encodeURIComponent(orgId)}/activate`, {
      method: 'POST',
    });
  },

  suspendOrganization(orgId, reason) {
    return requestSuperAdmin(`/api/super-admin/organizations/${encodeURIComponent(orgId)}/suspend`, {
      method: 'POST',
      body: { reason },
    });
  },

  listPlatformUsers(filters = {}) {
    return requestSuperAdmin(`/api/super-admin/users${buildQuery(filters)}`);
  },

  createPlatformUser(payload) {
    return requestSuperAdmin('/api/super-admin/users', {
      method: 'POST',
      body: payload,
    });
  },

  updatePlatformUser(userId, payload) {
    return requestSuperAdmin(`/api/super-admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  listAuditLogs(filters = {}) {
    return requestSuperAdmin(`/api/super-admin/audit-logs${buildQuery(filters)}`);
  },

  getAnalytics() {
    return requestSuperAdmin('/api/super-admin/analytics');
  },
};
