import axiosInstance from "./axiosInstance"

export const getInterviewCategories = () => axiosInstance.get("/interviews/categories")
export const getInterviewQuestions = (params) => axiosInstance.get("/interviews/questions", { params })
export const startInterviewSession = (payload) => axiosInstance.post("/interviews/sessions", payload)
export const getInterviewSession = (id) => axiosInstance.get(`/interviews/sessions/${id}`, { skipCache: true })
export const saveInterviewAnswer = (id, sessionQuestionId, payload) =>
  axiosInstance.patch(`/interviews/sessions/${id}/answers/${sessionQuestionId}`, payload)
export const submitInterviewSession = (id) => axiosInstance.post(`/interviews/sessions/${id}/submit`)
export const getInterviewResult = (id) => axiosInstance.get(`/interviews/sessions/${id}/result`)
export const getInterviewHistory = (params) => axiosInstance.get("/interviews/history", { params })
export const getInterviewAnalytics = () => axiosInstance.get("/interviews/analytics")
