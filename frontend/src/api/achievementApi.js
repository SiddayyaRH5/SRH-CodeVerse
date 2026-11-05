
import axiosInstance from "./axiosInstance"
export const getAchievements = () => axiosInstance.get("/student/achievements")
export const getAllAchievements = () => axiosInstance.get("/student/achievements/all")