import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"
export const getLeaderboard = () => cachedGet(axiosInstance, "/leaderboard")
