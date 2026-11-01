import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"
export const getActivity = () => cachedGet(axiosInstance, "/student/activity")
