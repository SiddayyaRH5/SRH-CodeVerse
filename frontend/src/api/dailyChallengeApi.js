import axiosInstance from "./axiosInstance"
import { cachedGet, invalidateApiCache } from "../utils/cache"
export const getTodaysChallenge = () => cachedGet(axiosInstance, "/daily-challenge")
export const setTodaysChallenge = async (data) => {
  const response = await axiosInstance.put("/trainer/daily-challenge", data)
  invalidateApiCache("/daily-challenge")
  return response
}
