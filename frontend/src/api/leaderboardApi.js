import axiosInstance from "./axiosInstance"
export const getLeaderboard = () => axiosInstance.get("/leaderboard")