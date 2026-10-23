import axiosInstance from "./axiosInstance"
export const getTodaysChallenge = () => axiosInstance.get("/daily-challenge")
export const setTodaysChallenge = (data) => axiosInstance.put("/trainer/daily-challenge", data)