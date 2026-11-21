import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient, workspaceAuthApi, setWorkspaceSessionToken, getWorkspaceSessionToken, clearWorkspaceSessionToken } from '../services/apiClient.js';
import WorkspaceLogin from '../components/WorkspaceLogin.jsx';

const VALID_WORKSPACES = new Set(['admin', 'professional', 'team_lead', 'employee', 'student']);

export const WORKSPACE_ROLE_MAP = {
  admin: 'ORG_ADMIN',
  team_lead: 'TEAM_LEAD',
  professional: 'PROFESSIONAL',
  employee: 'EMPLOYEE',
  student: 'STUDENT',
};

export const WORKSPACE_META = {
  admin: {
    key: 'admin',
    label: 'Organization Admin',
    shortLabel: 'Org Admin',
    role: 'ORG_ADMIN',
    description: 'Directory, invitations, departments, teams, roles, reports & org settings',
  },
  professional: {
    key: 'professional',
    label: 'Professional Workspace',
    shortLabel: 'Professional',
    role: 'PROFESSIONAL',
    description: 'Project delivery, tasks, billable worklogs, timesheets & attendance',
  },
  team_lead: {
    key: 'team_lead',
    label: 'Team Lead Workspace',
    shortLabel: 'Team Lead',
    role: 'TEAM_LEAD',
    description: 'Team oversight, task allocation, workload balancing & approval queue',
  },
  employee: {
    key: 'employee',
    label: 'Employee Workspace',
    shortLabel: 'Employee',
    role: 'EMPLOYEE',
    description: 'Self-service shift attendance, assigned tasks, leaves & worklogs',
  },
  student: {
    key: 'student',
    label: 'Student Academy',
    shortLabel: 'Student',
    role: 'STUDENT',
    description: 'Protected SRH CodeVerse learning academy & coding practice',
  },
};

function readInitialWorkspace() {
  if (typeof window === 'undefined') return 'admin';
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('workspace');
  if (raw && VALID_WORKSPACES.has(raw)) return raw;
  return 'admin';
}

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('srh_codeverse_theme');
  return saved === 'light' ? 'light' : 'dark';
}

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children, initialWorkspace = null }) {
  const [workspace, setWorkspaceState] = useState(() => (initialWorkspace && VALID_WORKSPACES.has(initialWorkspace) ? initialWorkspace : readInitialWorkspace()));
  const [theme, setThemeState] = useState(readInitialTheme);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const snapshotSeqRef = useRef(0);

  const role = snapshot?.currentUser?.role || WORKSPACE_ROLE_MAP[workspace] || 'ORG_ADMIN';

  const auth = useMemo(() => ({
    orgId: snapshot?.activeOrg?.id || '',
    role,
    userId: snapshot?.currentUser?.id || '',
  }), [snapshot?.activeOrg?.id, role, snapshot?.currentUser?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('srh_codeverse_theme', theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      setWorkspaceState(readInitialWorkspace());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const notify = useCallback((type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadSnapshot = useCallback(async (showSpinner = false) => {
    const seq = ++snapshotSeqRef.current;
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const data = await apiClient.fetchSnapshot();
      if (seq !== snapshotSeqRef.current) return false;
      setSnapshot(data);
      return true;
    } catch (err) {
      if (seq !== snapshotSeqRef.current) return false;
      setSnapshot(null);
      setError(err instanceof Error ? err.message : 'Unable to load workspace data from backend.');
      return false;
    } finally {
      if (seq === snapshotSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const orgId = snapshot?.activeOrg?.id || '';

  useEffect(() => {
    loadSnapshot(true);
  }, [loadSnapshot]);

  const refresh = useCallback(async () => {
    await loadSnapshot(true);
  }, [loadSnapshot]);

  const setWorkspace = useCallback((nextWorkspace) => {
    if (!VALID_WORKSPACES.has(nextWorkspace)) return;
    setWorkspaceState(nextWorkspace);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('workspace', nextWorkspace);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const setOrgId = useCallback(() => {
    notify('info', 'Organization is determined by your authenticated session.');
  }, [notify]);

  const login = useCallback(async (email, password) => {
    const res = await workspaceAuthApi.login(email, password);
    if (res && res.token) {
      setWorkspaceSessionToken(res.token);
    }
    setSnapshot(null);
    await loadSnapshot(true);
    return res;
  }, [loadSnapshot]);

  const logout = useCallback(async () => {
    try {
      await workspaceAuthApi.logout();
    } catch {
      // ignore
    } finally {
      clearWorkspaceSessionToken();
      setSnapshot(null);
      setError(null);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const runMutation = useCallback(
    async (actionFn, successMessage) => {
      let res;
      try {
        res = await actionFn();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Backend operation failed.';
        notify('error', msg);
        return { ok: false, error: msg };
      }
      if (successMessage) notify('success', successMessage);
      const refreshed = await loadSnapshot(false);
      if (!refreshed) {
        notify('info', 'Saved to backend, but workspace refresh needs retry.');
      }
      return { ok: true, data: res };
    },
    [loadSnapshot, notify]
  );

  const value = useMemo(
    () => ({
      workspace,
      setWorkspace,
      orgId,
      setOrgId,
      role,
      auth,
      theme,
      toggleTheme,
      snapshot,
      loading,
      error,
      refresh,
      runMutation,
      toasts,
      notify,
      dismissToast,
      login,
      logout,
      isAuthenticated: !!getWorkspaceSessionToken(),
    }),
    [
      workspace,
      setWorkspace,
      orgId,
      setOrgId,
      role,
      auth,
      theme,
      toggleTheme,
      snapshot,
      loading,
      error,
      refresh,
      runMutation,
      toasts,
      notify,
      dismissToast,
      login,
      logout,
    ]
  );

  if (!getWorkspaceSessionToken()) {
    return <WorkspaceLogin />;
  }
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider.');
  return ctx;
}
