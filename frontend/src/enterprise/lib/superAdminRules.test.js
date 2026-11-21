import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isHiddenSuperAdminPath,
  normalizeOrgSlug,
  validateOrganizationForm,
  validateSuspensionReason,
  validatePlatformUserForm,
} from './superAdminRules.js';

test('hidden Super Admin path matches only /platform/console', () => {
  assert.equal(isHiddenSuperAdminPath('/platform/console'), true);
  assert.equal(isHiddenSuperAdminPath('/platform/console/'), true);
  assert.equal(isHiddenSuperAdminPath('/'), false);
  assert.equal(isHiddenSuperAdminPath('/?workspace=super_admin'), false);
  assert.equal(isHiddenSuperAdminPath('/admin'), false);
  assert.equal(isHiddenSuperAdminPath('/platform'), false);
});

test('organization slug normalization produces clean kebab-case slugs', () => {
  assert.equal(normalizeOrgSlug('', 'Acme Cloud Labs!'), 'acme-cloud-labs');
  assert.equal(normalizeOrgSlug('  SRH__Enterprise 2026 ', 'Ignored'), 'srh-enterprise-2026');
});

test('organization form validation rejects short names and invalid slugs', () => {
  assert.ok(validateOrganizationForm({ name: 'A', slug: 'ab' }));
  assert.ok(validateOrganizationForm({ name: 'Acme Corp', slug: '!' }));
  assert.equal(validateOrganizationForm({ name: 'Acme Corp', slug: 'acme-corp' }), null);
});

test('suspension reason requires at least 5 non-whitespace characters', () => {
  assert.ok(validateSuspensionReason(''));
  assert.ok(validateSuspensionReason('  no '));
  assert.equal(validateSuspensionReason('Policy compliance hold'), null);
});

test('platform user validation enforces 12-char password and valid roles', () => {
  assert.ok(validatePlatformUserForm({ name: 'Ada', email: 'ada@srh.io', password: 'short', platformRole: 'SUPER_ADMIN' }));
  assert.ok(validatePlatformUserForm({ name: 'Ada', email: 'bad-email', password: 'StrongPassword123', platformRole: 'SUPER_ADMIN' }));
  assert.ok(validatePlatformUserForm({ name: 'Ada', email: 'ada@srh.io', password: 'StrongPassword123', platformRole: 'ORG_ADMIN' }));
  assert.equal(validatePlatformUserForm({ name: 'Ada Lovelace', email: 'ada@srh.io', password: 'StrongPassword123', platformRole: 'SUPER_ADMIN' }), null);
});
