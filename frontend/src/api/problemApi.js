import axiosInstance from "./axiosInstance"


// Student-facing
export const getProblems = () => axiosInstance.get("/problems")

// Trainer-facing
export const getTrainerProblems = () => axiosInstance.get("/trainer/problems")
export const getTrainerProblem = (id) => axiosInstance.get(`/trainer/problems/${id}`)
export const createProblem = (data) => axiosInstance.post("/trainer/problems", data)
export const updateProblem = (id, data) => axiosInstance.put(`/trainer/problems/${id}`, data)
export const deleteProblem = (id) => axiosInstance.delete(`/trainer/problems/${id}`)
export const getProblemDetail = (id) => axiosInstance.get(`/problems/${id}`)
export const getHint = (id, hintNumber) => axiosInstance.get(`/problems/${id}/hints/${hintNumber}`)
export const runCode = (id, code, language = "java") => axiosInstance.post(`/problems/${id}/run`, { code, language })
export const submitCode = (id, code, language = "java") => axiosInstance.post(`/problems/${id}/submit`, { code, language })
export const getMyLastCode = (id) => axiosInstance.get(`/problems/${id}/my-code`)

// Imported LeetCode starter snippets, visible examples, and judge readiness.
export const getImportedProblemData = (id) => axiosInstance.get(`/problems/${id}/imported-data`)
