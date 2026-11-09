import axiosInstance from "./axiosInstance"

export const getTrainerDashboard = () => axiosInstance.get("/trainer/dashboard")
export const getRecentSubmissions = () => axiosInstance.get("/trainer/dashboard/recent-submissions")
export const getProblemPerformance = () => axiosInstance.get("/trainer/dashboard/problem-performance")