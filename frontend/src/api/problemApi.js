import axiosInstance from "./axiosInstance"
import { cachedGet, invalidateApiCache } from "../utils/cache"


// Student-facing
export const getProblems = () => cachedGet(axiosInstance, "/problems")

// Trainer-facing
export const getTrainerProblems = () => cachedGet(axiosInstance, "/trainer/problems")
export const getTrainerProblem = (id) => cachedGet(axiosInstance, `/trainer/problems/${id}`)
export const createProblem = async (data) => {
  const response = await axiosInstance.post("/trainer/problems", data)
  invalidateApiCache(["/problems", "/courses", "/trainer/problems", "/trainer/dashboard", "/trainer/analytics"])
  return response
}
export const updateProblem = async (id, data) => {
  const response = await axiosInstance.put(`/trainer/problems/${id}`, data)
  invalidateApiCache(["/problems", "/courses", "/trainer/problems", "/trainer/dashboard", "/trainer/analytics"])
  return response
}
export const deleteProblem = async (id) => {
  const response = await axiosInstance.delete(`/trainer/problems/${id}`)
  invalidateApiCache(["/problems", "/courses", "/trainer/problems", "/trainer/dashboard", "/trainer/analytics"])
  return response
}
export const getProblemDetail = (id) => cachedGet(axiosInstance, `/problems/${id}`)
export const getHint = (id, hintNumber) => cachedGet(axiosInstance, `/problems/${id}/hints/${hintNumber}`)
export const runCode = (id, code, language = "java") => axiosInstance.post(`/problems/${id}/run`, { code, language })
export const submitCode = async (id, code, language = "java") => {
  const response = await axiosInstance.post(`/problems/${id}/submit`, { code, language })
  invalidateApiCache([
    "/problems",
    "/student/dashboard",
    "/student/activity",
    "/student/achievements",
    "/leaderboard",
    "/submissions/my",
    "/trainer/dashboard",
    "/trainer/analytics",
  ])
  return response
}
export const getMyLastCode = (id) => cachedGet(axiosInstance, `/problems/${id}/my-code`)

// Imported LeetCode starter snippets, visible examples, and judge readiness.
export const getImportedProblemData = (id) => cachedGet(axiosInstance, `/problems/${id}/imported-data`)
