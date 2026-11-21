import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  ServerOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  getSuperAdminApiBaseUrl,
  superAdminApi,
} from '../../services/superAdminApi.js';
import {
  normalizeOrgSlug,
  validateOrganizationForm,
  validatePlatformUserForm,
  validateSuspensionReason,
} from '../../lib/superAdminRules.js';

const NAV_ITEMS = [
  { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'users', label: 'Platform Users', icon: Users },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
];

const AUDIT_ACTIONS = [
  'ALL',
  'SUPER_ADMIN_LOGIN',
  'SUPER_ADMIN_LOGOUT',
  'SUPER_ADMIN_ACCESS_DENIED',
  'BOOTSTRAP_SUPER_ADMIN',
  'ORG_CREATED',
  'ORG_UPDATED',
  'ORG_ACTIVATED',
  'ORG_SUSPENDED',
  'PLATFORM_USER_CREATED',
  'PLATFORM_USER_UPDATED',
];

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();
  const isPositive = normalized === 'ACTIVE' || normalized === 'SUPER_ADMIN';
  const isNegative = normalized === 'SUSPENDED' || normalized === 'ORG_SUSPENDED';
  const styles = isPositive
    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
    : isNegative
    ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25'
    : 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${styles}`}>
      {normalized || 'UNKNOWN'}
    </span>
  );
}

function ConsoleCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] shadow-xs ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--sa-border)]">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-[var(--sa-text)] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--sa-text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyNotice({ icon: Icon = Shield, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-11 h-11 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface-2)] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[var(--sa-text-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--sa-text)]">{title}</h3>
      <p className="text-xs text-[var(--sa-text-muted)] max-w-md mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ModalDialog({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--sa-border)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--sa-text)]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--sa-text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--sa-text-muted)] hover:bg-[var(--sa-surface-hover)] hover:text-[var(--sa-text)]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function SuperAdminWorkspace() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem('srh_codeverse_theme') !== 'light';
    } catch {
      return true;
    }
  });

  // Auth / session state: 'checking' | 'unauthenticated' | 'forbidden' | 'authenticated'
  const [authState, setAuthState] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [backendOfflineMsg, setBackendOfflineMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigation & shell
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Module data states (real MySQL only)
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [orgDetail, setOrgDetail] = useState(null);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Filter states
  const [orgQuery, setOrgQuery] = useState('');
  const [debouncedOrgQuery, setDebouncedOrgQuery] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('ALL');
  const [userQuery, setUserQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [auditQuery, setAuditQuery] = useState('');
  const [debouncedAuditQuery, setDebouncedAuditQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const requestSeqRef = useRef(0);

  // Modals
  const [orgModalMode, setOrgModalMode] = useState(null); // 'create' | 'edit' | null
  const [orgForm, setOrgForm] = useState({
    id: '',
    name: '',
    slug: '',
    slugEdited: false,
    industry: '',
    domain: '',
    timezone: 'UTC',
    location: '',
    workWeek: 'Mon - Fri',
    plan: 'Enterprise Workspace',
    standardStart: '09:30',
    standardEnd: '18:30',
    graceMinutes: 15,
    allowRemoteCheckIn: true,
  });
  const [orgFormError, setOrgFormError] = useState('');
  const [orgSubmitting, setOrgSubmitting] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  const [activateTarget, setActivateTarget] = useState(null);
  const [activateSubmitting, setActivateSubmitting] = useState(false);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    platformRole: 'USER',
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  const [confirmUserAction, setConfirmUserAction] = useState(null); // { user, nextRole, nextStatus, label }
  const [userActionSubmitting, setUserActionSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem('srh_codeverse_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage restrictions
    }
  }, [darkMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedOrgQuery(orgQuery), 250);
    return () => window.clearTimeout(timer);
  }, [orgQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUserQuery(userQuery), 250);
    return () => window.clearTimeout(timer);
  }, [userQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedAuditQuery(auditQuery), 250);
    return () => window.clearTimeout(timer);
  }, [auditQuery]);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4500);
  }, []);

  const handleAuthFailure = useCallback((err) => {
    if (err && err.status === 401) {
      setCurrentUser(null);
      setAuthState('unauthenticated');
      return true;
    }
    if (err && err.status === 403) {
      setCurrentUser(null);
      setAuthState('forbidden');
      return true;
    }
    return false;
  }, []);

  const verifyCurrentSession = useCallback(async () => {
    setAuthState('checking');
    setBackendOfflineMsg('');
    try {
      const res = await superAdminApi.verifySession();
      setCurrentUser(res.user);
      setAuthState('authenticated');
    } catch (err) {
      if (err.status === 403) {
        setAuthState('forbidden');
      } else if (err.status === 401) {
        setAuthState('unauthenticated');
      } else {
        setBackendOfflineMsg(err.message || 'Backend API unavailable.');
        setAuthState('unauthenticated');
      }
    }
  }, []);

  useEffect(() => {
    verifyCurrentSession();
  }, [verifyCurrentSession]);

  const loadActiveSection = useCallback(async () => {
    if (authState !== 'authenticated') return;
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setApiError('');
    try {
      if (activeTab === 'overview') {
        const data = await superAdminApi.getOverview();
        if (seq !== requestSeqRef.current) return;
        setOverview(data);
      } else if (activeTab === 'organizations') {
        const data = await superAdminApi.listOrganizations({
          q: debouncedOrgQuery,
          status: orgStatusFilter,
        });
        if (seq !== requestSeqRef.current) return;
        setOrganizations(Array.isArray(data) ? data : []);
      } else if (activeTab === 'org-detail' && selectedOrgId) {
        const data = await superAdminApi.getOrganizationDetails(selectedOrgId);
        if (seq !== requestSeqRef.current) return;
        setOrgDetail(data);
      } else if (activeTab === 'users') {
        const data = await superAdminApi.listPlatformUsers({
          q: debouncedUserQuery,
          role: userRoleFilter,
          status: userStatusFilter,
        });
        if (seq !== requestSeqRef.current) return;
        setPlatformUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'audit-logs') {
        const data = await superAdminApi.listAuditLogs({
          q: debouncedAuditQuery,
          action: auditActionFilter,
        });
        if (seq !== requestSeqRef.current) return;
        setAuditLogs(Array.isArray(data) ? data : []);
      } else if (activeTab === 'analytics') {
        const data = await superAdminApi.getAnalytics();
        if (seq !== requestSeqRef.current) return;
        setAnalytics(data);
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      if (!handleAuthFailure(err)) {
        setApiError(err.message || 'Failed to load data from backend API.');
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [
    authState,
    activeTab,
    selectedOrgId,
    debouncedOrgQuery,
    orgStatusFilter,
    debouncedUserQuery,
    userRoleFilter,
    userStatusFilter,
    debouncedAuditQuery,
    auditActionFilter,
    handleAuthFailure,
  ]);

  useEffect(() => {
    loadActiveSection();
  }, [loadActiveSection]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setBackendOfflineMsg('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Enter your authorized email and password.');
      return;
    }
    setLoginSubmitting(true);
    try {
      const res = await superAdminApi.login(loginEmail.trim(), loginPassword);
      setCurrentUser(res.user);
      setLoginPassword('');
      setAuthState('authenticated');
      setActiveTab('overview');
    } catch (err) {
      if (err.status === 403) {
        setAuthState('forbidden');
      } else if (err.status === 0) {
        setBackendOfflineMsg(err.message);
      } else {
        setLoginError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await superAdminApi.logout();
    setCurrentUser(null);
    setOverview(null);
    setOrganizations([]);
    setOrgDetail(null);
    setPlatformUsers([]);
    setAuditLogs([]);
    setAnalytics(null);
    setAuthState('unauthenticated');
  };

  const openOrgDetails = (orgId) => {
    setSelectedOrgId(orgId);
    setActiveTab('org-detail');
  };

  const openCreateOrgModal = () => {
    setOrgFormError('');
    setOrgForm({
      id: '',
      name: '',
      slug: '',
      slugEdited: false,
      industry: '',
      domain: '',
      timezone: 'UTC',
      location: '',
      workWeek: 'Mon - Fri',
      plan: 'Enterprise Workspace',
      standardStart: '09:30',
      standardEnd: '18:30',
      graceMinutes: 15,
      allowRemoteCheckIn: true,
    });
    setOrgModalMode('create');
  };

  const openEditOrgModal = (org) => {
    const policy = org.attendancePolicy || {};
    setOrgFormError('');
    setOrgForm({
      id: org.id,
      name: org.name || '',
      slug: org.slug || '',
      slugEdited: true,
      industry: org.industry || '',
      domain: org.domain || '',
      timezone: org.timezone || 'UTC',
      location: org.location || '',
      workWeek: org.workWeek || 'Mon - Fri',
      plan: org.plan || 'Enterprise Workspace',
      standardStart: policy.standardStart || '09:30',
      standardEnd: policy.standardEnd || '18:30',
      graceMinutes: Number.isFinite(Number(policy.graceMinutes)) ? Number(policy.graceMinutes) : 15,
      allowRemoteCheckIn: policy.allowRemoteCheckIn !== false,
    });
    setOrgModalMode('edit');
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validateOrganizationForm(orgForm);
    if (validationErr) {
      setOrgFormError(validationErr);
      return;
    }
    setOrgFormError('');
    setOrgSubmitting(true);
    try {
      const payload = {
        name: orgForm.name.trim(),
        slug: normalizeOrgSlug(orgForm.slug, orgForm.name),
        industry: orgForm.industry.trim(),
        domain: orgForm.domain.trim(),
        timezone: orgForm.timezone.trim() || 'UTC',
        location: orgForm.location.trim(),
        workWeek: orgForm.workWeek.trim() || 'Mon - Fri',
        plan: orgForm.plan.trim() || 'Enterprise Workspace',
        attendancePolicy: {
          standardStart: orgForm.standardStart || '09:30',
          standardEnd: orgForm.standardEnd || '18:30',
          graceMinutes: Number(orgForm.graceMinutes) || 0,
          allowRemoteCheckIn: Boolean(orgForm.allowRemoteCheckIn),
        },
      };
      if (orgModalMode === 'create') {
        await superAdminApi.createOrganization(payload);
        showToast(`Created organization "${payload.name}".`);
      } else {
        await superAdminApi.updateOrganization(orgForm.id, payload);
        showToast(`Updated organization "${payload.name}".`);
      }
      setOrgModalMode(null);
      await loadActiveSection();
    } catch (err) {
      if (!handleAuthFailure(err)) {
        setOrgFormError(err.message || 'Could not save organization.');
      }
    } finally {
      setOrgSubmitting(false);
    }
  };

  const handleSuspendConfirm = async (e) => {
    e.preventDefault();
    const errMsg = validateSuspensionReason(suspendReason);
    if (errMsg) {
      setSuspendError(errMsg);
      return;
    }
    setSuspendError('');
    setSuspendSubmitting(true);
    try {
      await superAdminApi.suspendOrganization(suspendTarget.id, suspendReason.trim());
      showToast(`Suspended organization "${suspendTarget.name}".`, 'warning');
      setSuspendTarget(null);
      setSuspendReason('');
      await loadActiveSection();
    } catch (err) {
      if (!handleAuthFailure(err)) {
        setSuspendError(err.message || 'Could not suspend organization.');
      }
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateConfirm = async () => {
    if (!activateTarget) return;
    setActivateSubmitting(true);
    try {
      await superAdminApi.activateOrganization(activateTarget.id);
      showToast(`Activated organization "${activateTarget.name}".`);
      setActivateTarget(null);
      await loadActiveSection();
    } catch (err) {
      if (!handleAuthFailure(err)) {
        setApiError(err.message || 'Could not activate organization.');
      }
    } finally {
      setActivateSubmitting(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    const errMsg = validatePlatformUserForm(userForm);
    if (errMsg) {
      setUserFormError(errMsg);
      return;
    }
    setUserFormError('');
    setUserSubmitting(true);
    try {
      await superAdminApi.createPlatformUser({
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password,
        platformRole: userForm.platformRole,
      });
      showToast(`Provisioned platform account for ${userForm.email.trim().toLowerCase()}.`);
      setCreateUserOpen(false);
      setUserForm({ name: '', email: '', password: '', platformRole: 'USER' });
      await loadActiveSection();
    } catch (err) {
      if (!handleAuthFailure(err)) {
        setUserFormError(err.message || 'Could not provision platform user.');
      }
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleConfirmUserUpdate = async () => {
    if (!confirmUserAction) return;
    setUserActionSubmitting(true);
    try {
      await superAdminApi.updatePlatformUser(confirmUserAction.user.id, {
        platformRole: confirmUserAction.nextRole,
        status: confirmUserAction.nextStatus,
      });
      showToast(`Updated platform account ${confirmUserAction.user.email}.`);
      setConfirmUserAction(null);
      await loadActiveSection();
    } catch (err) {
      if (!handleAuthFailure(err)) {
        setApiError(err.message || 'Could not update platform user.');
        setConfirmUserAction(null);
      }
    } finally {
      setUserActionSubmitting(false);
    }
  };

  const navigateHome = () => {
    window.location.assign('/');
  };

  // ===========================================================================
  // GATE STATES (Checking / Forbidden / Unauthenticated Sign-In)
  // ===========================================================================
  if (authState === 'checking') {
    return (
      <div className="super-admin-root min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] p-6 text-center shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-[var(--sa-accent-soft)] text-[var(--sa-accent-text)] mx-auto flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <h1 className="text-base font-semibold text-[var(--sa-text)]">
            Verifying Session
          </h1>
          <p className="text-xs text-[var(--sa-text-muted)] mt-1">
            Contacting SRH CodeVerse authorization server...
          </p>
        </div>
      </div>
    );
  }

  if (authState === 'forbidden') {
    return (
      <div className="super-admin-root min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] p-7 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/25 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--sa-text)]">
            Access Restricted
          </h1>
          <p className="text-sm text-[var(--sa-text-muted)] mt-2 leading-relaxed">
            Your account does not hold the required platform authorization to access this endpoint.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={navigateHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authState !== 'authenticated') {
    return (
      <div className="super-admin-root min-h-screen flex flex-col justify-between p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
          <button
            type="button"
            onClick={navigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--sa-text-muted)] hover:text-[var(--sa-text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to SRH CodeVerse
          </button>
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="p-2 rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface)] text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-hover)]"
            aria-label="Toggle color theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <main className="w-full max-w-md mx-auto my-8">
          <div className="rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--sa-border)] bg-[var(--sa-surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--sa-accent)] text-white flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-[var(--sa-text)] tracking-tight">
                    Platform Governance Console
                  </h1>
                  <p className="text-xs text-[var(--sa-text-muted)] mt-0.5">
                    Server-verified authentication required
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {backendOfflineMsg && (
                <div className="mb-5 rounded-lg border border-amber-500/35 bg-amber-500/10 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <ServerOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Backend API Unavailable
                      </p>
                      <p className="text-xs text-[var(--sa-text-secondary)] mt-1 leading-relaxed break-words">
                        {backendOfflineMsg}
                      </p>
                      <button
                        type="button"
                        onClick={verifyCurrentSession}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sa-accent-text)] hover:underline"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="mb-4 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1.5">
                    Authorized Email
                  </label>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operator@organization.domain"
                    className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3.5 py-2.5 text-sm text-[var(--sa-text)] placeholder:text-[var(--sa-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--sa-text)] placeholder:text-[var(--sa-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--sa-text-muted)] hover:text-[var(--sa-text)]"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  {loginSubmitting ? 'Verifying Credentials...' : 'Authenticate'}
                </button>
              </form>

              <p className="mt-5 pt-4 border-t border-[var(--sa-border)] text-[11px] text-[var(--sa-text-muted)] leading-relaxed">
                Sessions are verified against Spring Boot + MySQL (<span className="font-mono">{getSuperAdminApiBaseUrl()}</span>). Every administrative action is permanently recorded in platform audit logs.
              </p>
            </div>
          </div>
        </main>

        <footer className="text-center text-[11px] text-[var(--sa-text-muted)]">
          SRH CodeVerse Platform Governance
        </footer>
      </div>
    );
  }

  // ===========================================================================
  // AUTHENTICATED SUPER ADMIN GOVERNANCE WORKSPACE
  // ===========================================================================
  const metrics = overview?.metrics || {};

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Organizations',
            value: metrics.totalOrganizations ?? 0,
            detail: `${metrics.activeOrganizations ?? 0} active · ${metrics.suspendedOrganizations ?? 0} suspended`,
            icon: Building2,
          },
          {
            label: 'Platform Accounts',
            value: metrics.totalPlatformUsers ?? 0,
            detail: `${metrics.activeSuperAdmins ?? 0} active Super Admins`,
            icon: ShieldCheck,
          },
          {
            label: 'Organization Members',
            value: metrics.totalEmployees ?? 0,
            detail: `${metrics.totalTeams ?? 0} teams across tenants`,
            icon: Users,
          },
          {
            label: 'Projects & Tasks',
            value: metrics.totalProjects ?? 0,
            detail: `${metrics.totalTasks ?? 0} tracked tasks in MySQL`,
            icon: Activity,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--sa-text-muted)]">
                  {card.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[var(--sa-accent-soft)] text-[var(--sa-accent-text)] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-[var(--sa-text)]">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-[var(--sa-text-muted)]">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ConsoleCard
          title="Recent Organizations"
          subtitle="Latest tenant workspaces registered in MySQL"
          className="xl:col-span-2"
          action={
            <button
              type="button"
              onClick={() => setActiveTab('organizations')}
              className="text-xs font-semibold text-[var(--sa-accent-text)] hover:underline"
            >
              Manage All
            </button>
          }
        >
          {!overview?.recentOrganizations?.length ? (
            <EmptyNotice
              icon={Building2}
              title="No organizations registered"
              description="Create the first organization tenant to begin managing enterprise workspaces on SRH CodeVerse."
              action={
                <button
                  type="button"
                  onClick={openCreateOrgModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] text-white text-xs font-semibold px-3.5 py-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Organization
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--sa-border)] text-[11px] uppercase tracking-wider text-[var(--sa-text-muted)]">
                    <th className="py-2.5 pr-4 font-semibold">Organization</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 pr-4 font-semibold">Members</th>
                    <th className="py-2.5 pr-4 font-semibold">Projects</th>
                    <th className="py-2.5 text-right font-semibold">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sa-border)] text-sm">
                  {overview.recentOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-[var(--sa-surface-hover)]">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-[var(--sa-text)]">{org.name}</div>
                        <div className="text-xs text-[var(--sa-text-muted)] font-mono">
                          {org.slug}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {org.employeeCount ?? 0}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {org.projectCount ?? 0}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openOrgDetails(org.id)}
                          className="text-xs font-semibold text-[var(--sa-accent-text)] hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsoleCard>

        <ConsoleCard
          title="Recent Governance Activity"
          subtitle="Immutable platform audit stream"
          action={
            <button
              type="button"
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs font-semibold text-[var(--sa-accent-text)] hover:underline"
            >
              View Ledger
            </button>
          }
        >
          {!overview?.recentAuditLogs?.length ? (
            <EmptyNotice
              icon={FileText}
              title="No audit events yet"
              description="Administrative logins and mutations will appear here automatically."
            />
          ) : (
            <ul className="space-y-3">
              {overview.recentAuditLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={log.action} />
                    <span className="text-[11px] text-[var(--sa-text-muted)]">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--sa-text)] mt-1.5 leading-relaxed">
                    {log.details}
                  </p>
                  <p className="text-[11px] text-[var(--sa-text-muted)] mt-1 font-mono truncate">
                    {log.actorEmail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ConsoleCard>
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <ConsoleCard
      title="Organization Management"
      subtitle="Create, edit, inspect, suspend, and reactivate tenant organizations in MySQL"
      action={
        <button
          type="button"
          onClick={openCreateOrgModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] text-white text-xs font-semibold px-3.5 py-2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Organization
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--sa-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={orgQuery}
            onChange={(e) => setOrgQuery(e.target.value)}
            placeholder="Search by organization name, slug, domain, industry, or location..."
            className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] pl-9 pr-3 py-2 text-sm text-[var(--sa-text)] placeholder:text-[var(--sa-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
          />
        </div>
        <select
          value={orgStatusFilter}
          onChange={(e) => setOrgStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {!organizations.length ? (
        <EmptyNotice
          icon={Building2}
          title="No matching organizations"
          description="Adjust your search filters or create a new tenant organization."
        />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sa-border)] text-[11px] uppercase tracking-wider text-[var(--sa-text-muted)]">
                <th className="py-2.5 pr-4 font-semibold">Organization</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 font-semibold">Plan / Industry</th>
                <th className="py-2.5 pr-4 font-semibold">Footprint</th>
                <th className="py-2.5 pr-4 font-semibold">Created</th>
                <th className="py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sa-border)] text-sm">
              {organizations.map((org) => {
                const isSuspended = String(org.status || '').toUpperCase() === 'SUSPENDED';
                return (
                  <tr key={org.id} className="hover:bg-[var(--sa-surface-hover)]">
                    <td className="py-3.5 pr-4">
                      <button
                        type="button"
                        onClick={() => openOrgDetails(org.id)}
                        className="font-semibold text-[var(--sa-text)] hover:text-[var(--sa-accent-text)] text-left"
                      >
                        {org.name}
                      </button>
                      <div className="text-xs text-[var(--sa-text-muted)] font-mono">
                        {org.slug} {org.domain ? `· ${org.domain}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={org.status} />
                      {isSuspended && org.suspensionReason && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 max-w-[200px] truncate" title={org.suspensionReason}>
                          {org.suspensionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="text-xs font-medium text-[var(--sa-text)]">{org.plan || 'Standard'}</div>
                      <div className="text-xs text-[var(--sa-text-muted)]">{org.industry || '—'}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs tabular-nums text-[var(--sa-text-secondary)]">
                      <div>{org.employeeCount ?? 0} members · {org.adminCount ?? 0} admins</div>
                      <div className="text-[var(--sa-text-muted)]">
                        {org.teamCount ?? 0} teams · {org.projectCount ?? 0} projects
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[var(--sa-text-muted)] tabular-nums">
                      {org.createdAt || '—'}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOrgDetails(org.id)}
                          className="px-2.5 py-1.5 rounded-md border border-[var(--sa-border)] text-xs font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-2)]"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditOrgModal(org)}
                          className="p-1.5 rounded-md border border-[var(--sa-border)] text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-2)]"
                          title="Edit organization"
                          aria-label={`Edit ${org.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isSuspended ? (
                          <button
                            type="button"
                            onClick={() => setActivateTarget(org)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSuspendTarget(org);
                              setSuspendReason('');
                              setSuspendError('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-500/20"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleCard>
  );

  const renderOrganizationDetails = () => {
    const org = orgDetail?.organization;
    if (!org) {
      return (
        <ConsoleCard title="Organization Details">
          <EmptyNotice
            icon={Building2}
            title="Organization not loaded"
            description="Select an organization from the directory to inspect its governance profile."
            action={
              <button
                type="button"
                onClick={() => setActiveTab('organizations')}
                className="px-3.5 py-2 rounded-lg bg-[var(--sa-accent)] text-white text-xs font-semibold"
              >
                Back to Organizations
              </button>
            }
          />
        </ConsoleCard>
      );
    }

    const isSuspended = String(org.status || '').toUpperCase() === 'SUSPENDED';
    const policy = org.attendancePolicy || {};

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('organizations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface)] text-xs font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-hover)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Organizations
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-[var(--sa-text)]">{org.name}</h2>
                <StatusBadge status={org.status} />
              </div>
              <p className="text-xs text-[var(--sa-text-muted)] font-mono">
                {org.id} · slug: {org.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openEditOrgModal(org)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface)] text-xs font-semibold text-[var(--sa-text)] hover:bg-[var(--sa-surface-hover)]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            {isSuspended ? (
              <button
                type="button"
                onClick={() => setActivateTarget(org)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Activate Tenant
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSuspendTarget(org);
                  setSuspendReason('');
                  setSuspendError('');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                Suspend Tenant
              </button>
            )}
          </div>
        </div>

        {isSuspended && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-rose-700 dark:text-rose-300">
                Organization Suspended ({formatDateTime(org.suspendedAt)})
              </p>
              <p className="text-[var(--sa-text-secondary)] mt-1">
                Reason: {org.suspensionReason || 'No reason recorded.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Employees', value: org.employeeCount ?? 0 },
            { label: 'Org Admins', value: org.adminCount ?? 0 },
            { label: 'Departments', value: org.departmentCount ?? 0 },
            { label: 'Teams', value: org.teamCount ?? 0 },
            { label: 'Projects', value: org.projectCount ?? 0 },
            { label: 'Tasks', value: org.taskCount ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] p-4"
            >
              <div className="text-[11px] font-medium text-[var(--sa-text-muted)]">
                {stat.label}
              </div>
              <div className="mt-1.5 text-xl font-bold tabular-nums text-[var(--sa-text)]">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsoleCard title="Organization Profile & Policy" subtitle="Tenant configuration stored in MySQL">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-[var(--sa-text-muted)]">Industry</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">{org.industry || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--sa-text-muted)]">Corporate Domain</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">{org.domain || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--sa-text-muted)]">Plan</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">{org.plan || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--sa-text-muted)]">Location / Timezone</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">
                  {[org.location, org.timezone].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--sa-text-muted)]">Work Schedule</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">
                  {org.workWeek || 'Mon - Fri'} ({policy.standardStart || '09:30'}–{policy.standardEnd || '18:30'})
                </dd>
              </div>
              <div>
                <dt className="text-[var(--sa-text-muted)]">Attendance Policy</dt>
                <dd className="font-medium text-[var(--sa-text)] mt-0.5">
                  Grace {policy.graceMinutes ?? 15}m · Remote {policy.allowRemoteCheckIn !== false ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
            </dl>
          </ConsoleCard>

          <ConsoleCard
            title="Organization Administrators"
            subtitle="Scoped governance roster (private employee fields omitted)"
          >
            {!orgDetail?.administrators?.length ? (
              <EmptyNotice
                icon={Users}
                title="No Organization Admins assigned"
                description="This organization currently has no employee records with the ORG_ADMIN role."
              />
            ) : (
              <ul className="divide-y divide-[var(--sa-border)]">
                {orgDetail.administrators.map((adm) => (
                  <li key={adm.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--sa-text)] truncate">{adm.name}</p>
                      <p className="text-xs text-[var(--sa-text-muted)] truncate">
                        {adm.email} · {adm.title || 'Organization Admin'}
                      </p>
                    </div>
                    <StatusBadge status={adm.status} />
                  </li>
                ))}
              </ul>
            )}
          </ConsoleCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsoleCard title="Recent Organization Activity" subtitle="Latest tenant workspace events">
            {!orgDetail?.recentOrgActivity?.length ? (
              <EmptyNotice
                icon={Clock}
                title="No workspace activity recorded"
                description="Organization-level events will appear as tenant members use SRH CodeVerse."
              />
            ) : (
              <ul className="space-y-2.5">
                {orgDetail.recentOrgActivity.map((act) => (
                  <li
                    key={act.id}
                    className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--sa-text)]">{act.action}</span>
                      <span className="text-[11px] text-[var(--sa-text-muted)]">
                        {formatDateTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-[var(--sa-text-muted)] mt-0.5">
                      {act.actorName} ({act.actorRole}) · {act.target}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ConsoleCard>

          <ConsoleCard title="Platform Governance History" subtitle="Super Admin actions on this tenant">
            {!orgDetail?.governanceHistory?.length ? (
              <EmptyNotice
                icon={FileText}
                title="No platform governance events"
                description="Status changes and profile updates performed from this console will be logged here."
              />
            ) : (
              <ul className="space-y-2.5">
                {orgDetail.governanceHistory.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={log.action} />
                      <span className="text-[11px] text-[var(--sa-text-muted)]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-[var(--sa-text)] mt-1">{log.details}</p>
                    <p className="text-[11px] text-[var(--sa-text-muted)] font-mono mt-0.5">
                      {log.actorEmail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ConsoleCard>
        </div>
      </div>
    );
  };

  const renderPlatformUsers = () => (
    <ConsoleCard
      title="Platform User Management"
      subtitle="Manage platform-level accounts and SUPER_ADMIN privileges (last active Super Admin & self-demotion protected)"
      action={
        <button
          type="button"
          onClick={() => {
            setUserFormError('');
            setUserForm({ name: '', email: '', password: '', platformRole: 'USER' });
            setCreateUserOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] text-white text-xs font-semibold px-3.5 py-2 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Provision Account
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--sa-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Search platform users by name or email..."
            className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] pl-9 pr-3 py-2 text-sm text-[var(--sa-text)] placeholder:text-[var(--sa-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
          />
        </div>
        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="USER">Standard Platform User</option>
        </select>
        <select
          value={userStatusFilter}
          onChange={(e) => setUserStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {!platformUsers.length ? (
        <EmptyNotice
          icon={Users}
          title="No platform accounts found"
          description="Adjust your search filter or provision a new platform account."
        />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sa-border)] text-[11px] uppercase tracking-wider text-[var(--sa-text-muted)]">
                <th className="py-2.5 pr-4 font-semibold">Account</th>
                <th className="py-2.5 pr-4 font-semibold">Platform Role</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 font-semibold">Last Login</th>
                <th className="py-2.5 text-right font-semibold">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sa-border)] text-sm">
              {platformUsers.map((u) => {
                const isSelf = currentUser && currentUser.id === u.id;
                const isSuperAdmin = u.platformRole === 'SUPER_ADMIN';
                const isSuspended = u.status === 'SUSPENDED';
                return (
                  <tr key={u.id} className="hover:bg-[var(--sa-surface-hover)]">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--sa-text)]">{u.name}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--sa-accent-soft)] text-[var(--sa-accent-text)] text-[10px] font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--sa-text-muted)] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={u.platformRole} />
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[var(--sa-text-muted)]">
                      {formatDateTime(u.lastLoginAt)}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      {isSelf ? (
                        <span className="text-xs text-[var(--sa-text-muted)]">Protected active session</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmUserAction({
                                user: u,
                                nextRole: isSuperAdmin ? 'USER' : 'SUPER_ADMIN',
                                nextStatus: u.status,
                                label: isSuperAdmin
                                  ? `Demote ${u.email} from SUPER_ADMIN to USER? Active governance sessions will be revoked.`
                                  : `Grant platform SUPER_ADMIN access to ${u.email}?`,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-md border border-[var(--sa-border)] text-xs font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-2)]"
                          >
                            {isSuperAdmin ? 'Demote to User' : 'Promote to Super Admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmUserAction({
                                user: u,
                                nextRole: u.platformRole,
                                nextStatus: isSuspended ? 'ACTIVE' : 'SUSPENDED',
                                label: isSuspended
                                  ? `Reactivate platform account ${u.email}?`
                                  : `Suspend platform account ${u.email}? All active sessions will be revoked immediately.`,
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold ${
                              isSuspended
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleCard>
  );

  const renderAuditLogs = () => (
    <ConsoleCard
      title="Platform Audit Logs"
      subtitle="Append-only immutable record of Super Admin authentication and governance mutations in MySQL"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--sa-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={auditQuery}
            onChange={(e) => setAuditQuery(e.target.value)}
            placeholder="Search by actor email, target ID, or audit details..."
            className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] pl-9 pr-3 py-2 text-sm text-[var(--sa-text)] placeholder:text-[var(--sa-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sa-accent)]"
          />
        </div>
        <select
          value={auditActionFilter}
          onChange={(e) => setAuditActionFilter(e.target.value)}
          className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
        >
          {AUDIT_ACTIONS.map((act) => (
            <option key={act} value={act}>
              {act === 'ALL' ? 'All Actions' : act}
            </option>
          ))}
        </select>
      </div>

      {!auditLogs.length ? (
        <EmptyNotice
          icon={FileText}
          title="No matching audit records"
          description="No immutable audit log entries matched your current search criteria."
        />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sa-border)] text-[11px] uppercase tracking-wider text-[var(--sa-text-muted)]">
                <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                <th className="py-2.5 pr-4 font-semibold">Action</th>
                <th className="py-2.5 pr-4 font-semibold">Actor</th>
                <th className="py-2.5 pr-4 font-semibold">Target</th>
                <th className="py-2.5 pr-4 font-semibold">Details</th>
                <th className="py-2.5 text-right font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sa-border)] text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--sa-surface-hover)]">
                  <td className="py-3 pr-4 whitespace-nowrap text-[var(--sa-text-muted)] tabular-nums">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <StatusBadge status={log.action} />
                  </td>
                  <td className="py-3 pr-4 font-mono text-[var(--sa-text)]">
                    {log.actorEmail}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[var(--sa-text-secondary)] whitespace-nowrap">
                    {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                  </td>
                  <td className="py-3 pr-4 text-[var(--sa-text-secondary)] max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 text-right font-mono text-[var(--sa-text-muted)] whitespace-nowrap">
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleCard>
  );

  const renderAnalytics = () => {
    const growth = analytics?.organizationGrowth || [];
    const userGrowth = analytics?.userGrowth || [];
    const statusBreakdown = analytics?.organizationStatusBreakdown || [];
    const projectStatusBreakdown = analytics?.projectStatusBreakdown || [];
    const footprint = analytics?.organizationFootprint || [];
    const accountBreakdown = analytics?.platformAccountBreakdown || [];
    const maxGrowth = Math.max(1, ...growth.map((g) => Number(g.count || 0)));
    const maxUserGrowth = Math.max(1, ...userGrowth.map((g) => Number(g.count || 0)));
    const totalStatusOrgs = statusBreakdown.reduce((sum, s) => sum + Number(s.count || 0), 0);
    const totalProjects = projectStatusBreakdown.reduce((sum, s) => sum + Number(s.count || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConsoleCard
            title="Organization Growth by Month"
            subtitle="Computed directly from MySQL organization creation dates"
          >
            {!growth.length ? (
              <EmptyNotice
                icon={BarChart3}
                title="No organization timeline data"
                description="Monthly onboarding counts will appear once organizations exist in MySQL."
              />
            ) : (
              <div className="space-y-3">
                {growth.map((bucket) => {
                  const pct = Math.round((Number(bucket.count || 0) / maxGrowth) * 100);
                  return (
                    <div key={bucket.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[var(--sa-text-secondary)]">{bucket.month}</span>
                        <span className="font-semibold tabular-nums text-[var(--sa-text)]">
                          {bucket.count} org{Number(bucket.count) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--sa-surface-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--sa-accent)]"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ConsoleCard>

          <ConsoleCard
            title="User Growth by Month"
            subtitle="Computed directly from MySQL employee join dates & platform account records"
          >
            {!userGrowth.length ? (
              <EmptyNotice
                icon={Users}
                title="No user onboarding data"
                description="Monthly user totals will populate from live MySQL accounts and tenant directories."
              />
            ) : (
              <div className="space-y-3">
                {userGrowth.map((bucket) => {
                  const pct = Math.round((Number(bucket.count || 0) / maxUserGrowth) * 100);
                  return (
                    <div key={bucket.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[var(--sa-text-secondary)]">{bucket.month}</span>
                        <span className="font-semibold tabular-nums text-[var(--sa-text)]">
                          {bucket.count} user{Number(bucket.count) === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--sa-surface-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ConsoleCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ConsoleCard
            title="Tenant Status Distribution"
            subtitle="Live active vs suspended tenant share"
          >
            {totalStatusOrgs === 0 ? (
              <p className="text-xs text-[var(--sa-text-muted)]">No tenants registered yet.</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map((item) => {
                  const count = Number(item.count || 0);
                  const pct = Math.round((count / totalStatusOrgs) * 100);
                  const barColor = item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500';
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--sa-text)]">{item.status}</span>
                        <span className="tabular-nums text-[var(--sa-text-muted)]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--sa-surface-2)] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ConsoleCard>

          <ConsoleCard
            title="Project Activity Breakdown"
            subtitle="Live MySQL projects grouped by lifecycle status"
          >
            {totalProjects === 0 ? (
              <p className="text-xs text-[var(--sa-text-muted)]">No projects recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {projectStatusBreakdown.map((item) => {
                  const count = Number(item.count || 0);
                  const pct = Math.round((count / totalProjects) * 100);
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--sa-text)]">{item.status}</span>
                        <span className="tabular-nums text-[var(--sa-text-muted)]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--sa-surface-2)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--sa-accent)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ConsoleCard>

          <ConsoleCard
            title="Platform Account Breakdown"
            subtitle="Real counts from platform_users"
          >
            <div className="grid grid-cols-2 gap-3">
              {accountBreakdown.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] p-3"
                >
                  <p className="text-[11px] text-[var(--sa-text-muted)]">{row.label}</p>
                  <p className="text-lg font-bold tabular-nums text-[var(--sa-text)] mt-1">
                    {row.count ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </ConsoleCard>
        </div>

        <ConsoleCard
          title="Per-Organization Footprint, Activity & Task Completion"
          subtitle={`Aggregated live from MySQL (${analytics?.totalOrganizationActivityEvents ?? 0} total tenant activity events)`}
        >
          {!footprint.length ? (
            <EmptyNotice
              icon={Globe}
              title="No tenant metrics available"
              description="Tenant footprint statistics will populate automatically as organizations are provisioned."
            />
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--sa-border)] text-[11px] uppercase tracking-wider text-[var(--sa-text-muted)]">
                    <th className="py-2.5 pr-4 font-semibold">Organization</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 pr-4 font-semibold">Employees</th>
                    <th className="py-2.5 pr-4 font-semibold">Teams</th>
                    <th className="py-2.5 pr-4 font-semibold">Projects</th>
                    <th className="py-2.5 pr-4 font-semibold">Activity</th>
                    <th className="py-2.5 pr-4 font-semibold">Tasks Done</th>
                    <th className="py-2.5 font-semibold">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sa-border)] text-xs">
                  {footprint.map((row) => (
                    <tr key={row.orgId} className="hover:bg-[var(--sa-surface-hover)]">
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => openOrgDetails(row.orgId)}
                          className="font-semibold text-[var(--sa-text)] hover:text-[var(--sa-accent-text)]"
                        >
                          {row.name}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {row.employees}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {row.teams}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {row.projects}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {row.activityEvents ?? 0}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[var(--sa-text-secondary)]">
                        {row.completedTasks} / {row.totalTasks}
                      </td>
                      <td className="py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-[var(--sa-surface-2)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--sa-accent)]"
                              style={{ width: `${row.completionRate || 0}%` }}
                            />
                          </div>
                          <span className="tabular-nums font-semibold text-[var(--sa-text)] w-9 text-right">
                            {row.completionRate || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsoleCard>
      </div>
    );
  };

  return (
    <div className="super-admin-root min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[var(--sa-sidebar)] border-r border-[var(--sa-sidebar-border)] text-[var(--sa-sidebar-text)]">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--sa-sidebar-border)]">
          <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight truncate">
              Platform Console
            </div>
            <div className="text-[11px] text-[var(--sa-sidebar-muted)] truncate">
              SRH CodeVerse Governance
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Platform governance navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (activeTab === 'org-detail' && item.id === 'organizations');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'organizations') setSelectedOrgId(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    : 'text-[var(--sa-sidebar-text)] hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--sa-sidebar-border)]">
          <div className="rounded-lg bg-white/5 border border-[var(--sa-sidebar-border)] p-3">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser?.name || 'Super Admin'}
            </p>
            <p className="text-[11px] text-[var(--sa-sidebar-muted)] font-mono truncate mt-0.5">
              {currentUser?.email}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-white/8 hover:bg-rose-500/20 hover:text-rose-200 text-xs font-semibold text-slate-200 py-1.5 px-2.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[var(--sa-sidebar)] text-[var(--sa-sidebar-text)] flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--sa-sidebar-border)]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">Platform Console</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (activeTab === 'org-detail' && item.id === 'organizations');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-300'
                        : 'text-[var(--sa-sidebar-text)] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[var(--sa-sidebar-border)]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 text-white text-xs font-semibold py-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-6 border-b border-[var(--sa-border)] bg-[var(--sa-surface)] flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[var(--sa-border)] text-[var(--sa-text-secondary)]"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[var(--sa-text)] truncate">
                {activeTab === 'org-detail'
                  ? 'Organization Details'
                  : NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Platform Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadActiveSection}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] text-xs font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-hover)] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] text-[var(--sa-text-secondary)] hover:bg-[var(--sa-surface-hover)]"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
          {toast && (
            <div
              className={`rounded-lg border px-4 py-3 text-xs font-medium flex items-center justify-between gap-3 ${
                toast.tone === 'warning'
                  ? 'border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-200'
                  : 'border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button type="button" onClick={() => setToast(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {apiError && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">API Request Failed</p>
                  <p className="text-[var(--sa-text-secondary)] mt-0.5">{apiError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadActiveSection}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {loading && !overview && activeTab === 'overview' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-xl border border-[var(--sa-border)] bg-[var(--sa-surface)] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'organizations' && renderOrganizations()}
              {activeTab === 'org-detail' && renderOrganizationDetails()}
              {activeTab === 'users' && renderPlatformUsers()}
              {activeTab === 'audit-logs' && renderAuditLogs()}
              {activeTab === 'analytics' && renderAnalytics()}
            </>
          )}
        </main>
      </div>

      {/* Create / Edit Organization Modal */}
      <ModalDialog
        open={Boolean(orgModalMode)}
        title={orgModalMode === 'create' ? 'Create Organization' : 'Edit Organization'}
        subtitle="Changes are persisted directly in MySQL and recorded in platform audit logs."
        onClose={() => setOrgModalMode(null)}
      >
        <form onSubmit={handleOrgSubmit} className="space-y-4">
          {orgFormError && (
            <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {orgFormError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setOrgForm((prev) => ({
                    ...prev,
                    name: nextName,
                    slug: prev.slugEdited ? prev.slug : normalizeOrgSlug('', nextName),
                  }));
                }}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Unique Slug *
              </label>
              <input
                type="text"
                required
                value={orgForm.slug}
                onChange={(e) =>
                  setOrgForm((prev) => ({ ...prev, slug: e.target.value, slugEdited: true }))
                }
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm font-mono text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Industry
              </label>
              <input
                type="text"
                value={orgForm.industry}
                onChange={(e) => setOrgForm((p) => ({ ...p, industry: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Corporate Domain
              </label>
              <input
                type="text"
                value={orgForm.domain}
                onChange={(e) => setOrgForm((p) => ({ ...p, domain: e.target.value }))}
                placeholder="company.com"
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={orgForm.location}
                onChange={(e) => setOrgForm((p) => ({ ...p, location: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={orgForm.timezone}
                onChange={(e) => setOrgForm((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Plan Tier
              </label>
              <input
                type="text"
                value={orgForm.plan}
                onChange={(e) => setOrgForm((p) => ({ ...p, plan: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
                Work Week
              </label>
              <input
                type="text"
                value={orgForm.workWeek}
                onChange={(e) => setOrgForm((p) => ({ ...p, workWeek: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--sa-border)]">
            <button
              type="button"
              onClick={() => setOrgModalMode(null)}
              className="px-3.5 py-2 rounded-lg border border-[var(--sa-border)] text-xs font-semibold text-[var(--sa-text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={orgSubmitting}
              className="px-4 py-2 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] disabled:opacity-60 text-white text-xs font-semibold"
            >
              {orgSubmitting ? 'Saving...' : orgModalMode === 'create' ? 'Create Organization' : 'Save Changes'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Suspend Organization Confirmation Modal */}
      <ModalDialog
        open={Boolean(suspendTarget)}
        title="Suspend Organization"
        subtitle={
          suspendTarget
            ? `Suspending "${suspendTarget.name}" immediately blocks ordinary workspace API access for this tenant.`
            : ''
        }
        onClose={() => setSuspendTarget(null)}
      >
        <form onSubmit={handleSuspendConfirm} className="space-y-4">
          {suspendError && (
            <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {suspendError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1.5">
              Mandatory Suspension Reason (recorded in immutable audit log)
            </label>
            <textarea
              rows={3}
              required
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Document the compliance, security, or billing reason..."
              className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)] focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--sa-border)]">
            <button
              type="button"
              onClick={() => setSuspendTarget(null)}
              className="px-3.5 py-2 rounded-lg border border-[var(--sa-border)] text-xs font-semibold text-[var(--sa-text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={suspendSubmitting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold"
            >
              {suspendSubmitting ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Activate Organization Confirmation Modal */}
      <ModalDialog
        open={Boolean(activateTarget)}
        title="Activate Organization"
        subtitle="Restore full workspace access for this tenant organization."
        onClose={() => setActivateTarget(null)}
      >
        <p className="text-sm text-[var(--sa-text-secondary)] leading-relaxed">
          Confirm reactivation of <strong className="text-[var(--sa-text)]">{activateTarget?.name}</strong>. Suspension metadata will be cleared and an immutable <span className="font-mono">ORG_ACTIVATED</span> audit entry will be recorded.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[var(--sa-border)]">
          <button
            type="button"
            onClick={() => setActivateTarget(null)}
            className="px-3.5 py-2 rounded-lg border border-[var(--sa-border)] text-xs font-semibold text-[var(--sa-text-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={activateSubmitting}
            onClick={handleActivateConfirm}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold"
          >
            {activateSubmitting ? 'Activating...' : 'Confirm Activation'}
          </button>
        </div>
      </ModalDialog>

      {/* Provision Platform User Modal */}
      <ModalDialog
        open={createUserOpen}
        title="Provision Platform Account"
        subtitle="Creates a BCrypt-secured account in MySQL platform_users."
        onClose={() => setCreateUserOpen(false)}
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          {userFormError && (
            <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {userFormError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
              Initial Password (min 12 characters) *
            </label>
            <div className="relative">
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                required
                minLength={12}
                value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] pl-3 pr-10 py-2 text-sm text-[var(--sa-text)]"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--sa-text-muted)]"
              >
                {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--sa-text-secondary)] mb-1">
              Platform Role *
            </label>
            <select
              value={userForm.platformRole}
              onChange={(e) => setUserForm((p) => ({ ...p, platformRole: e.target.value }))}
              className="w-full rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-2)] px-3 py-2 text-sm text-[var(--sa-text)]"
            >
              <option value="USER">USER (Standard Platform Account)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Governance Access)</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--sa-border)]">
            <button
              type="button"
              onClick={() => setCreateUserOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[var(--sa-border)] text-xs font-semibold text-[var(--sa-text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={userSubmitting}
              className="px-4 py-2 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] disabled:opacity-60 text-white text-xs font-semibold"
            >
              {userSubmitting ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Confirm Platform User Role/Status Update */}
      <ModalDialog
        open={Boolean(confirmUserAction)}
        title="Confirm Governance Change"
        subtitle="This operation updates MySQL platform_users and writes an immutable audit log."
        onClose={() => setConfirmUserAction(null)}
      >
        <p className="text-sm text-[var(--sa-text-secondary)] leading-relaxed">
          {confirmUserAction?.label}
        </p>
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[var(--sa-border)]">
          <button
            type="button"
            onClick={() => setConfirmUserAction(null)}
            className="px-3.5 py-2 rounded-lg border border-[var(--sa-border)] text-xs font-semibold text-[var(--sa-text-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={userActionSubmitting}
            onClick={handleConfirmUserUpdate}
            className="px-4 py-2 rounded-lg bg-[var(--sa-accent)] hover:bg-[var(--sa-accent-hover)] disabled:opacity-60 text-white text-xs font-semibold"
          >
            {userActionSubmitting ? 'Applying...' : 'Confirm Change'}
          </button>
        </div>
      </ModalDialog>
    </div>
  );
}
