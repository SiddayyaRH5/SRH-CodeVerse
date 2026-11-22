import axiosInstance from "./axiosInstance"

export const getLearningCourses = (params) => axiosInstance.get("/learning/courses", { params })
export const getLearningCourse = (slug) => axiosInstance.get(`/learning/courses/${slug}`)
export const enrollLearningCourse = (slug) => axiosInstance.post(`/learning/courses/${slug}/enroll`)
export const getMyLearning = () => axiosInstance.get("/learning/my")
export const getLearningLesson = (lessonId) => axiosInstance.get(`/learning/lessons/${lessonId}`)
export const completeLearningLesson = (lessonId, completed) =>
  axiosInstance.post(`/learning/lessons/${lessonId}/complete`, { completed })
export const toggleLessonBookmark = (lessonId) =>
  axiosInstance.post(`/learning/lessons/${lessonId}/bookmark`)
export const saveLessonNote = (lessonId, content) =>
  axiosInstance.put(`/learning/lessons/${lessonId}/note`, { content })
export const getLearningBookmarks = () => axiosInstance.get("/learning/bookmarks")
export const getLearningProgress = () => axiosInstance.get("/learning/progress")
export const getLearningRecommendations = () => axiosInstance.get("/learning/recommendations")
