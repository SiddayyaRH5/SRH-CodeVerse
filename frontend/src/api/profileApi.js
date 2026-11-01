import axiosInstance from "./axiosInstance"
import { cachedGet, invalidateApiCache } from "../utils/cache"
export const getProfile = () => cachedGet(axiosInstance, "/profile")
export const updateProfile = async (data) => {
  const response = await axiosInstance.put("/profile", data)
  invalidateApiCache(["/profile", "/student/dashboard", "/student/activity"])
  return response
}
export const changePassword = (data) => axiosInstance.put("/profile/password", data)
