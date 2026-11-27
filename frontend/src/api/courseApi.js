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
 * Payment-ready calls. No Razorpay checkout is activated here: the server
 * returns 503 while payment credentials are absent, and only a server-side
 * verified payment can unlock a paid course.
 */
export const createPaymentOrder = (slug) =>
  axiosInstance.post('/payments/orders', { slug })

export const verifyPayment = (orderId, paymentId, signature) =>
  axiosInstance.post('/payments/verify', { orderId, paymentId, signature })
