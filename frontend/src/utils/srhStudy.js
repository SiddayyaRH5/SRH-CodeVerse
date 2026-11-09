const BOOKMARKS_KEY = "srhcodeverse_bookmarks"
const NOTES_KEY = "srhcodeverse_notes"
const GOAL_KEY = "srhcodeverse_weekly_goal"

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function getBookmarks() { return read(BOOKMARKS_KEY, []) }
export function isBookmarked(id) { return getBookmarks().some((p) => String(p.id) === String(id)) }
export function toggleBookmark(problem) {
  const current = getBookmarks()
  const exists = current.some((p) => String(p.id) === String(problem.id))
  const next = exists
    ? current.filter((p) => String(p.id) !== String(problem.id))
    : [...current, { id: problem.id, title: problem.title, difficulty: problem.difficulty, topic: problem.topic, estimatedTimeMinutes: problem.estimatedTimeMinutes }]
  write(BOOKMARKS_KEY, next)
  window.dispatchEvent(new Event("srh-bookmarks-changed"))
  return !exists
}

export function getNotes() { return read(NOTES_KEY, {}) }
export function getNote(id) { return getNotes()[String(id)] || "" }
export function saveNote(id, text) {
  const notes = getNotes()
  if (text.trim()) notes[String(id)] = text
  else delete notes[String(id)]
  write(NOTES_KEY, notes)
  window.dispatchEvent(new Event("srh-notes-changed"))
}

export function getWeeklyGoal() { return Number(localStorage.getItem(GOAL_KEY)) || 5 }
export function setWeeklyGoal(goal) { localStorage.setItem(GOAL_KEY, String(goal)) }
