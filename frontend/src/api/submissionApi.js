import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"

export const getMySubmissions = () =>
  cachedGet(axiosInstance, "/submissions/my")
