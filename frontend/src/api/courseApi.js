import axiosInstance from './axiosInstance'
export const getCourses = () => axiosInstance.get('/courses')
export const getCourse = (slug) => axiosInstance.get(`/courses/${slug}`)
export const getCourseProblems = (slug) => axiosInstance.get(`/courses/${slug}/problems`)
export const updateCourseProgress = (slug, lessonId, completed) => axiosInstance.post(`/courses/${slug}/progress`, { lessonId, completed })
