import axiosInstance from './axiosInstance'
import { cachedGet, invalidateApiCache } from "../utils/cache"
export const getCourses = () => cachedGet(axiosInstance, '/courses')
export const getCourse = (slug) => cachedGet(axiosInstance, `/courses/${slug}`)
export const getCourseProblems = (slug) => cachedGet(axiosInstance, `/courses/${slug}/problems`)
export const updateCourseProgress = async (slug, lessonId, completed) => {
  const response = await axiosInstance.post(`/courses/${slug}/progress`, { lessonId, completed })
  invalidateApiCache([
    "/courses",
    "/student/dashboard",
    "/student/activity",
    "/student/achievements",
    "/leaderboard",
  ])
  return response
}
export const getCourseProblem = (slug, problemId) =>
    cachedGet(axiosInstance, `/courses/${slug}/problems/${problemId}`)

export const getCourseLessons = (slug) => cachedGet(axiosInstance, `/courses/${slug}/lessons`)


