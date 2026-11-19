import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const cssPath = path.join(root, 'frontend/src/index.css')
const navPath = path.join(root, 'frontend/src/features/workspace/demoData.js')
const routePath = path.join(root, 'frontend/src/features/workspace/WorkspaceRouter.jsx')
const accessPath = path.join(root, 'frontend/src/features/workspace/WorkspaceAccess.jsx')
const layoutPath = path.join(root, 'frontend/src/components/layout/PageLayout.jsx')
const policyPath = path.join(root, 'frontend/src/features/workspace/workspacePolicy.js')
const testPaths = [
  'frontend/src/features/workspace/workspacePortalNav.test.jsx',
  'frontend/src/features/workspace/workspacePortalRoutes.test.jsx',
  'frontend/src/features/workspace/workspaceRoutes.test.js',
  'frontend/src/features/workspace/demoMode.test.jsx',
  'frontend/src/features/workspace/demoService.test.js',
  'frontend/src/components/common/Foundation.test.jsx',
].map((file) => path.join(root, file))

const read = (file) => fs.readFileSync(file, 'utf8')
const css = read(cssPath)
const nav = read(navPath)
const route = read(routePath)
const access = read(accessPath)
const layout = read(layoutPath)
const policy = read(policyPath)
const failures = []
const checks = []
function check(name, condition, detail = '') {
  checks.push({ name, pass: Boolean(condition), detail })
  if (!condition) failures.push(name)
}

const requiredCssTokens = [
  '--cv-bg', '--cv-surface', '--cv-surface-2', '--cv-text', '--cv-muted',
  '--cv-subtle', '--cv-border', '--cv-primary', '--cv-purple', '--cv-blue',
  '--cv-cyan', '--cv-pink', '--cv-glass', '--cv-card-shadow',
  '--cv-card-shadow-hover', '--cv-duration-normal', '--cv-duration-slow',
  '--cv-ease-standard', '--cv-ease-emphasized', '--cv-radius-lg',
]
for (const token of requiredCssTokens) {
  check(`CSS token defined: ${token}`, new RegExp(`${token}\\s*:`).test(css))
}
for (const selector of ['.cv-surface', '.cv-surface-raised', '.cv-glass-surface', '.cv-interactive-card', '.cv-gradient-text', '.cv-ambient-orb', '.cv-enter', '.cv-section-heading', '.cv-eyebrow']) {
  check(`Shared style selector: ${selector}`, css.includes(selector))
}
check('Keyboard focus style exists', css.includes(':focus-visible'))
check('Skip-link style exists', css.includes('.cv-skip-link'))
check('Reduced-motion media query exists', css.includes('@media (prefers-reduced-motion: reduce)'))
check('Responsive mobile breakpoint exists', css.includes('@media (max-width: 640px)'))
check('Responsive tablet breakpoint exists', css.includes('@media (max-width: 900px)') || css.includes('@media (max-width: 1023px)'))
check('Theme light variables exist', css.includes(':root[data-theme="light"]'))
check('Theme dark variables exist', css.includes(':root[data-theme="dark"]'))
check('Five portal identifiers exist in navigation config', ['student', 'trainer', 'employee', 'organization', 'superadmin'].every((key) => nav.includes(`${key}:`)))
const navCounts = {}
for (const portal of ['student', 'trainer', 'employee', 'organization', 'superadmin']) {
  const start = nav.indexOf(`${portal}: [`)
  const end = start < 0 ? -1 : nav.indexOf('\n  ],', start)
  const block = start < 0 || end < 0 ? '' : nav.slice(start, end)
  navCounts[portal] = (block.match(/\[\s*['\"`][^\n]+?,\s*['\"`][^\n]+?\]/g) || []).length
}
check('Student nav inventory has 17 entries', navCounts.student === 17, `found ${navCounts.student}`)
check('Trainer nav inventory has 19 entries', navCounts.trainer === 19, `found ${navCounts.trainer}`)
check('Professional/employee nav inventory has 27 entries', navCounts.employee === 27, `found ${navCounts.employee}`)
check('Organization admin nav inventory has 27 entries', navCounts.organization === 27, `found ${navCounts.organization}`)
check('Super admin nav inventory has 12 entries', navCounts.superadmin === 12, `found ${navCounts.superadmin}`)
check('Workspace router composes layout and screen renderer', route.includes('WorkspaceLayout') && route.includes('WorkspaceScreens'))
check('Workspace access policy component exists', access.length > 0)
check('Shared layout has skip-link markup', layout.includes('cv-skip-link') && layout.includes('main-content'))
check('Professional portal alias is normalized', policy.includes('professional: \"employee\"'))
check('Portal nav and route test files exist', testPaths.every((file) => fs.existsSync(file)))

console.log(`Foundation verification: ${checks.filter((c) => c.pass).length}/${checks.length} checks passed`)
for (const result of checks) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`)
if (failures.length) {
  console.error(`\nFailed checks: ${failures.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('\nAll dependency-free foundation checks passed.')
}
