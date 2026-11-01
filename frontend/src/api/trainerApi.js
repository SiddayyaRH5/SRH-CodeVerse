import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"

export const getTrainerDashboard = () => cachedGet(axiosInstance, "/trainer/dashboard")
export const getRecentSubmissions = () => cachedGet(axiosInstance, "/trainer/dashboard/recent-submissions")
export const getProblemPerformance = () => cachedGet(axiosInstance, "/trainer/dashboard/problem-performance")
