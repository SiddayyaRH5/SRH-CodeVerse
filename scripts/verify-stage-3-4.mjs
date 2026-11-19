import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const root = path.basename(cwd) === 'frontend' ? path.resolve(cwd, '..') : cwd
const frontend = path.resolve(root, 'frontend/src')
const workspace = path.join(frontend, 'features/workspace')
const checks = [
  ['Student route file', 'routes/AppRoutes.jsx'],
  ['Student dashboard', 'pages/student/Dashboard.jsx'],
  ['Course catalog', 'pages/student/Courses.jsx'],
  ['Course details', 'pages/student/CourseDetail.jsx'],
  ['Lesson detail', 'pages/student/CourseLessonDetail.jsx'],
  ['Coding problems', 'pages/student/Problems.jsx'],
  ['Problem detail', 'pages/student/ProblemDetail.jsx'],
  ['Submission history', 'pages/student/MySubmissions.jsx'],
  ['Playground', 'pages/student/Playground.jsx'],
  ['Mock interview', 'pages/student/MockInterview.jsx'],
  ['Interview arena', 'pages/student/InterviewArena.jsx'],
  ['Live coding', 'pages/student/LiveCodingArena.jsx'],
  ['Learning path', 'pages/student/LearningPath.jsx'],
  ['Roadmap', 'pages/student/Roadmap.jsx'],
  ['Study hub', 'pages/student/StudyHub.jsx'],
  ['Analytics', 'pages/student/Analytics.jsx'],
  ['Leaderboard', 'pages/student/Leaderboard.jsx'],
  ['Achievements', 'pages/student/Achievements.jsx'],
  ['Certificates', 'pages/student/Certificates.jsx'],
  ['Calendar', 'pages/student/Calendar.jsx'],
  ['Notifications', 'pages/student/Notifications.jsx'],
  ['Student API layer', 'api/dashboardApi.js'],
  ['Professional workspace nav', path.join('features/workspace', 'demoData.js')],
  ['Professional workspace screens', path.join('features/workspace', 'WorkspaceScreens.jsx')],
  ['Professional workspace shell', path.join('features/workspace', 'WorkspaceLayout.jsx')],
  ['Demo workspace service', path.join('features/workspace', 'demoService.js')],
  ['Demo workspace tests', path.join('features/workspace', 'demoService.test.js')],
]
let failed = 0
let passed = 0
for (const [label, relative] of checks) {
  const exists = fs.existsSync(path.join(frontend, relative))
  console.log(`${exists ? 'PASS' : 'FAIL'} ${label}`)
  if (!exists) failed++
  else passed++
}
const routes = fs.readFileSync(path.join(frontend, 'routes/AppRoutes.jsx'), 'utf8')
for (const route of ['/playground', '/mock-interview', '/live-coding', '/study-hub', '/roadmap', '/analytics', '/leaderboard', '/achievements', '/certificates', '/my-submissions']) {
  const exists = routes.includes(route)
  console.log(`${exists ? 'PASS' : 'FAIL'} student route ${route}`)
  if (!exists) failed++
  else passed++
}
const nav = fs.readFileSync(path.join(workspace, 'demoData.js'), 'utf8')
for (const route of ['"projects"', '"tasks"', '"teams"', '"worklogs"', '"timesheets"', '"attendance"', '"attendance-history"', '"leave"', '"leave-balance"', '"calendar"', '"directory"', '"notifications"']) {
  const exists = nav.includes(route)
  console.log(`${exists ? 'PASS' : 'FAIL'} professional nav contains ${route}`)
  if (!exists) failed++
  else passed++
}
console.log(`\nStage 3/4 static checks: ${passed} passed, ${failed} failed`)
process.exitCode = failed ? 1 : 0
