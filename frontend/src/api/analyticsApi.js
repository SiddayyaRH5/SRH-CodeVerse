import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"
export const getAnalytics = () => cachedGet(axiosInstance, "/trainer/analytics")
