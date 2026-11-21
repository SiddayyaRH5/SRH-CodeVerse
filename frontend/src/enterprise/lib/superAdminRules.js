export const SUPER_ADMIN_CONSOLE_PATH = '/platform/console';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Matches ONLY the dedicated hidden console pathname.
 * Rejects query-param attempts like ?workspace=super_admin on ordinary routes.
 */
export function isHiddenSuperAdminPath(pathname) {
  if (typeof pathname !== 'string') return false;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === SUPER_ADMIN_CONSOLE_PATH;
}

export function normalizeOrgSlug(rawSlug, fallbackName = '') {
  const source = rawSlug && String(rawSlug).trim() ? String(rawSlug) : String(fallbackName || '');
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateOrganizationForm({ name, slug }) {
  const trimmedName = String(name || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 140) {
    return 'Organization name must be between 2 and 140 characters.';
  }
  const normalizedSlug = normalizeOrgSlug(slug, trimmedName);
  if (normalizedSlug.length < 2 || !SLUG_RE.test(normalizedSlug)) {
    return 'Organization slug must use lowercase letters, numbers, and hyphens (min 2 chars).';
  }
  return null;
}

export function validateSuspensionReason(reason) {
  const trimmed = String(reason || '').trim();
  if (trimmed.length < 5) {
    return 'Provide a suspension reason of at least 5 characters for the platform audit trail.';
  }
  return null;
}

export function validatePlatformUserForm({ name, email, password, platformRole }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');
  const role = String(platformRole || '').trim().toUpperCase();

  if (trimmedName.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return 'Enter a valid platform email address.';
  }
  if (rawPassword.length < 12) {
    return 'Password must be at least 12 characters.';
  }
  if (role !== 'SUPER_ADMIN' && role !== 'USER') {
    return 'Platform role must be SUPER_ADMIN or USER.';
  }
  return null;
}
