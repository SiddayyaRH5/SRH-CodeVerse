import axiosInstance from "./axiosInstance"
export const getProfile = () => axiosInstance.get("/profile")
export const updateProfile = (data) => axiosInstance.put("/profile", data)
export const changePassword = (data) => axiosInstance.put("/profile/password", data)