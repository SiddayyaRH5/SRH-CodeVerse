import React, { useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  PauseCircle,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

export function DemoButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2',
  };

  const variants = {
    primary:
      'bg-[var(--demo-accent)] text-white hover:bg-[var(--demo-accent-hover)] border border-transparent shadow-xs',
    secondary:
      'bg-[var(--demo-surface-2)] text-[var(--demo-text)] hover:bg-[var(--demo-surface-hover)] border border-[var(--demo-border)]',
    ghost:
      'bg-transparent text-[var(--demo-text-secondary)] hover:text-[var(--demo-text)] hover:bg-[var(--demo-surface-2)] border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 border border-transparent',
    dangerSoft:
      'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/25',
    successSoft:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--demo-accent)] ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FormField({ label, htmlFor, required, error, hint, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium text-[var(--demo-text-secondary)]"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-[var(--demo-text-muted)]">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const INPUT_BASE =
  'w-full rounded-lg border border-[var(--demo-border)] bg-[var(--demo-surface)] px-3 py-2 text-sm text-[var(--demo-text)] placeholder:text-[var(--demo-text-muted)] focus:border-[var(--demo-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--demo-accent-soft)] transition-colors disabled:opacity-60';

export function DemoInput({ className = '', ...props }) {
  return <input className={`${INPUT_BASE} ${className}`} {...props} />;
}

export function DemoSelect({ className = '', children, ...props }) {
  return (
    <select className={`${INPUT_BASE} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function DemoTextarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} className={`${INPUT_BASE} resize-y ${className}`} {...props} />;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-[var(--demo-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_BASE} pl-9 py-1.5 text-sm`}
      />
    </div>
  );
}

function toTitleCase(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_META = {
  ACTIVE: { tone: 'emerald', Icon: CheckCircle2 },
  APPROVED: { tone: 'emerald', Icon: CheckCircle2 },
  COMPLETED: { tone: 'emerald', Icon: CheckCircle2 },
  DONE: { tone: 'emerald', Icon: CheckCircle2 },
  ACCEPTED: { tone: 'emerald', Icon: CheckCircle2 },
  CHECKED_IN: { tone: 'indigo', Icon: Clock },
  IN_PROGRESS: { tone: 'indigo', Icon: Clock },
  SUBMITTED: { tone: 'indigo', Icon: Clock },
  REMOTE: { tone: 'sky', Icon: Info },
  HYBRID: { tone: 'sky', Icon: Info },
  OFFICE: { tone: 'slate', Icon: Info },
  IN_REVIEW: { tone: 'amber', Icon: Clock },
  PENDING: { tone: 'amber', Icon: Clock },
  LATE: { tone: 'amber', Icon: AlertTriangle },
  ON_LEAVE: { tone: 'amber', Icon: PauseCircle },
  ON_HOLD: { tone: 'amber', Icon: PauseCircle },
  HIGH: { tone: 'amber', Icon: AlertTriangle },
  CRITICAL: { tone: 'red', Icon: ShieldAlert },
  BLOCKED: { tone: 'red', Icon: XCircle },
  REJECTED: { tone: 'red', Icon: XCircle },
  OVERDUE: { tone: 'red', Icon: AlertCircle },
  CANCELLED: { tone: 'slate', Icon: XCircle },
  INACTIVE: { tone: 'slate', Icon: PauseCircle },
  TODO: { tone: 'slate', Icon: Clock },
  DRAFT: { tone: 'slate', Icon: Clock },
  LOGGED: { tone: 'slate', Icon: Clock },
  PLANNING: { tone: 'slate', Icon: Clock },
  MEDIUM: { tone: 'indigo', Icon: Info },
  LOW: { tone: 'slate', Icon: Info },
  FULL: { tone: 'emerald', Icon: CheckCircle2 },
  TEAM: { tone: 'indigo', Icon: Info },
  SELF: { tone: 'sky', Icon: Info },
  NONE: { tone: 'slate', Icon: XCircle },
};

const TONE_CLASSES = {
  emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  indigo: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
  sky: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/20',
  amber: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
  red: 'text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20',
  slate: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
};

export function StatusLabel({ value, label }) {
  const upper = String(value || '').toUpperCase();
  const meta = STATUS_META[upper] || { tone: 'slate', Icon: Info };
  const Icon = meta.Icon;
  const text = label || toTitleCase(upper);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[meta.tone]}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{text}</span>
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[var(--demo-border)]">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--demo-text)] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--demo-text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b border-[var(--demo-border)]">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-[var(--demo-text)]">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--demo-text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </section>
  );
}

export function MetricTile({ label, value, subtext, icon: Icon, trend, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] p-4 transition-colors ${
        onClick ? 'hover:border-[var(--demo-accent)] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-[var(--demo-text-muted)]">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-[var(--demo-surface-2)] border border-[var(--demo-border)] flex items-center justify-center text-[var(--demo-accent-text)] shrink-0">
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-[var(--demo-text)] tabular-nums">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-[var(--demo-text-muted)]">{trend}</span>
        )}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-[var(--demo-text-muted)] truncate">{subtext}</p>
      )}
    </Tag>
  );
}

export function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[var(--demo-surface-2)] p-1 border border-[var(--demo-border)]"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-[var(--demo-surface)] text-[var(--demo-text)] shadow-xs border border-[var(--demo-border)]'
                : 'text-[var(--demo-text-muted)] hover:text-[var(--demo-text)] border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tabular-nums text-[11px] opacity-75">({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, description, action }) {
  return (
    <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-xl bg-[var(--demo-surface-2)] border border-[var(--demo-border)] flex items-center justify-center text-[var(--demo-text-muted)] mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-[var(--demo-text)]">{title}</p>
      {description && (
        <p className="text-xs text-[var(--demo-text-muted)] mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  keyField = 'id',
  sortBy,
  sortDir,
  onSort,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filter criteria.',
}) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--demo-border)] bg-[var(--demo-surface-2)]/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-[var(--demo-text-muted)] whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${col.className || ''}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[var(--demo-text)] cursor-pointer"
                    >
                      <span>{col.label}</span>
                      {sortBy === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--demo-border)]">
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${
                  onRowClick
                    ? 'hover:bg-[var(--demo-surface-hover)] cursor-pointer'
                    : 'hover:bg-[var(--demo-surface-hover)]/60'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-[var(--demo-text)] align-middle ${
                      col.align === 'right' ? 'text-right' : ''
                    } ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--demo-border)] text-xs text-[var(--demo-text-muted)]">
          <span className="tabular-nums">
            Page {page} of {totalPages} ({totalItems} total)
          </span>
          <div className="flex items-center gap-1.5">
            <DemoButton
              size="xs"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </DemoButton>
            <DemoButton
              size="xs"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </DemoButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3 text-sm text-red-700 dark:text-red-200">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
        <div className="space-y-1">
          <div className="font-semibold text-[var(--demo-text)]">
            Backend API Unavailable
          </div>
          <p className="text-xs leading-relaxed text-[var(--demo-text-secondary)]">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <DemoButton size="sm" variant="secondary" onClick={onRetry} className="shrink-0">
          Retry Connection
        </DemoButton>
      )}
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-[var(--demo-surface-2)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)]"
          />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)]" />
    </div>
  );
}

export function ModalDialog({ open, title, subtitle, onClose, footer, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-xl border border-[var(--demo-border)] bg-[var(--demo-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--demo-border)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--demo-text)]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--demo-text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--demo-text-muted)] hover:text-[var(--demo-text)] hover:bg-[var(--demo-surface-2)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--demo-border)] bg-[var(--demo-surface-2)]/40 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function SlideDrawer({ open, title, subtitle, onClose, footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[var(--demo-surface)] border-l border-[var(--demo-border)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--demo-border)]">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--demo-text)] truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--demo-text-muted)] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-[var(--demo-text-muted)] hover:text-[var(--demo-text)] hover:bg-[var(--demo-surface-2)] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--demo-border)] bg-[var(--demo-surface-2)]/40 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onClose,
}) {
  return (
    <ModalDialog
      open={open}
      title={title}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <DemoButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </DemoButton>
          <DemoButton
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </DemoButton>
        </>
      }
    >
      <p className="text-sm text-[var(--demo-text-secondary)] leading-relaxed">{message}</p>
    </ModalDialog>
  );
}

export function ToastRegion({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
        const tone = isError
          ? 'border-red-500/35 bg-red-950/95 text-red-100'
          : isSuccess
            ? 'border-emerald-500/35 bg-emerald-950/95 text-emerald-100'
            : 'border-indigo-500/35 bg-slate-900/95 text-slate-100';

        return (
          <div
            key={toast.id}
            className={`rounded-xl border px-3.5 py-2.5 shadow-xl flex items-start gap-2.5 text-xs ${tone}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function formatShortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatRelativeTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name) {
  return String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
