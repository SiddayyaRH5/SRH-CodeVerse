
import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"
export const getAchievements = () => cachedGet(axiosInstance, "/student/achievements")
export const getAllAchievements = () => cachedGet(axiosInstance, "/student/achievements/all")
