import axiosInstance from "./axiosInstance"

export const getDashboard = () => axiosInstance.get("/student/dashboard")