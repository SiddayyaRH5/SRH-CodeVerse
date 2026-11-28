import axiosInstance from './axiosInstance'

export const getCourses = () => axiosInstance.get('/courses')
export const getCourse = (slug) => axiosInstance.get(`/courses/${slug}`)
export const getCourseProblems = (slug) => axiosInstance.get(`/courses/${slug}/problems`)
export const updateCourseProgress = (slug, lessonId, completed) =>
  axiosInstance.post(`/courses/${slug}/progress`, { lessonId, completed })
export const getCourseProblem = (slug, problemId) =>
  axiosInstance.get(`/courses/${slug}/problems/${problemId}`)
export const getCourseLessons = (slug) => axiosInstance.get(`/courses/${slug}/lessons`)

/** Free-course enrollment. Paid courses are rejected unless already entitled. */
export const enrollCourse = (slug) => axiosInstance.post(`/courses/${slug}/enroll`)

/**
 * Authenticated payment calls. The server computes and verifies the payable
 * amount; the browser only sends identifiers and the gateway signature.
 */
export const createPaymentOrder = (slug) =>
  axiosInstance.post('/payments/orders', { slug })

export const verifyPayment = (orderId, paymentId, signature) =>
  axiosInstance.post('/payments/verify', { orderId, paymentId, signature })
