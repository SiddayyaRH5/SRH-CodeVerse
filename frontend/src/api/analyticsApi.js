import axiosInstance from "./axiosInstance"
export const getAnalytics = () => axiosInstance.get("/trainer/analytics")