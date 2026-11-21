import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Menu,
  Moon,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import { WORKSPACE_META, useWorkspace } from '../../context/WorkspaceContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import { ToastRegion, formatRelativeTime, getInitials } from './ui.jsx';

export function DemoShell({
  workspaceTitle,
  workspaceBadge,
  navItems,
  activeSection,
  onSelectSection,
  children,
}) {
  const {
    workspace,
    setWorkspace,
    orgId,
    setOrgId,
    theme,
    toggleTheme,
    snapshot,
    auth,
    runMutation,
    toasts,
    dismissToast,
  } = useWorkspace();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // 'org' | 'notif' | 'workspace'
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const currentNav = navItems.find((item) => item.id === activeSection) || navItems[0];
  const notifications = snapshot?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeOrg = snapshot?.activeOrg;
  const organizations = snapshot?.organizations || [];
  const currentUser = snapshot?.currentUser;

  const handleMarkRead = (id) => {
    runMutation(() => apiClient.markNotificationRead(auth, id));
  };

  const handleMarkAllRead = () => {
    runMutation(() => apiClient.markAllNotificationsRead(auth), 'All notifications marked as read.');
  };

  const renderSidebarNav = (isMobile = false) => (
    <div className="flex flex-col h-full">
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--demo-border)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            CV
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-[var(--demo-text)] truncate">
                SRH CodeVerse
              </div>
              <div className="text-[11px] text-[var(--demo-text-muted)] truncate">
                {workspaceBadge}
              </div>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-[var(--demo-text-muted)] hover:bg-[var(--demo-surface-2)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[var(--demo-text-muted)] hover:text-[var(--demo-text)] hover:bg-[var(--demo-surface-2)] cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1" aria-label={workspaceTitle}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-[var(--demo-accent-soft)] text-[var(--demo-accent-text)]'
                  : 'text-[var(--demo-text-secondary)] hover:bg-[var(--demo-surface-2)] hover:text-[var(--demo-text)]'
              } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-[var(--demo-accent)] text-white tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--demo-border)] shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => {
            setWorkspace('student');
            if (isMobile) setMobileOpen(false);
          }}
          title="Return to Student Academy"
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--demo-text-secondary)] hover:text-[var(--demo-text)] hover:bg-[var(--demo-surface-2)] transition-colors cursor-pointer ${
            collapsed && !isMobile ? 'justify-center px-2' : ''
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0 text-indigo-400" />
          {(!collapsed || isMobile) && <span className="truncate">Student Academy</span>}
        </button>

        {currentUser && (!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[var(--demo-surface-2)]/70">
            <div className="w-8 h-8 rounded-full bg-[var(--demo-accent)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--demo-text)] truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-[var(--demo-text-muted)] truncate">
                {currentUser.title}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="demo-workspace-root min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-[var(--demo-border)] bg-[var(--demo-sidebar)] transition-[width] duration-200 sticky top-0 h-screen ${
          collapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        {renderSidebarNav(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/60 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-[264px] h-full bg-[var(--demo-sidebar)] border-r border-[var(--demo-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarNav(true)}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-30 border-b border-[var(--demo-border)] bg-[var(--demo-sidebar)]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-[var(--demo-text-secondary)] hover:bg-[var(--demo-surface-2)] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-[var(--demo-text-muted)] hidden sm:inline truncate">
                {workspaceTitle}
              </span>
              <span className="text-[var(--demo-text-muted)] hidden sm:inline">/</span>
              <span className="font-semibold text-[var(--demo-text)] truncate">
                {currentNav?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div ref={menuRef} className="flex items-center gap-2 shrink-0">
            {/* Organization Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'org' ? null : 'org')}
                className="flex items-center gap-2 rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface)] hover:bg-[var(--demo-surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--demo-text)] cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[var(--demo-accent-text)] shrink-0" />
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {activeOrg?.name || 'No Organization'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--demo-text-muted)]" />
              </button>

              {openMenu === 'org' && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] shadow-2xl p-1.5 z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--demo-text-muted)]">
                    Active Organization
                  </div>
                  {organizations.length === 0 ? (
                    <div className="px-2.5 py-3 text-xs text-[var(--demo-text-muted)]">
                      No organizations returned by backend.
                    </div>
                  ) : (
                    organizations.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setOrgId(org.id);
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[var(--demo-surface-2)] cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--demo-text)] truncate">
                            {org.name}
                          </div>
                          <div className="text-[11px] text-[var(--demo-text-muted)] truncate">
                            {org.location}
                          </div>
                        </div>
                        {org.id === (orgId || activeOrg?.id) && (
                          <Check className="w-4 h-4 text-[var(--demo-accent-text)] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setOpenMenu(openMenu === 'notif' ? null : 'notif')}
                className="relative p-2 rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface)] hover:bg-[var(--demo-surface-2)] text-[var(--demo-text-secondary)] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--demo-accent)] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openMenu === 'notif' && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--demo-border)]">
                    <span className="text-xs font-semibold text-[var(--demo-text)]">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-[var(--demo-accent-text)] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--demo-border)]">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-[var(--demo-text-muted)]">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-[var(--demo-surface-2)] transition-colors cursor-pointer ${
                            !n.read ? 'bg-[var(--demo-accent-soft)]/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-[var(--demo-text)]">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[var(--demo-accent)] mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--demo-text-muted)] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="text-[10px] text-[var(--demo-text-muted)] mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface)] hover:bg-[var(--demo-surface-2)] text-[var(--demo-text-secondary)] cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Workspace Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'workspace' ? null : 'workspace')}
                className="flex items-center gap-2 rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface)] hover:bg-[var(--demo-surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--demo-text)] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[var(--demo-accent-text)] shrink-0" />
                <span className="hidden md:inline">{WORKSPACE_META[workspace]?.shortLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--demo-text-muted)]" />
              </button>

              {openMenu === 'workspace' && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] shadow-2xl p-1.5 z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--demo-text-muted)]">
                    Switch Role Workspace
                  </div>
                  {['admin', 'professional', 'team_lead', 'employee', 'student'].map((key) => {
                    const meta = WORKSPACE_META[key];
                    const active = workspace === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setWorkspace(key);
                          setOpenMenu(null);
                        }}
                        className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[var(--demo-surface-2)] cursor-pointer ${
                          active ? 'bg-[var(--demo-accent-soft)]' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--demo-text)]">
                            {meta.label}
                          </div>
                          <div className="text-[11px] text-[var(--demo-text-muted)] mt-0.5 line-clamp-1">
                            {meta.description}
                          </div>
                        </div>
                        {active && (
                          <Check className="w-4 h-4 text-[var(--demo-accent-text)] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
