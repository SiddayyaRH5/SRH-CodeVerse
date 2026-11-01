import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"

export const getDashboard = () => cachedGet(axiosInstance, "/student/dashboard")
