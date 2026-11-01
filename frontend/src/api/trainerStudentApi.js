import axiosInstance from "./axiosInstance"
import { cachedGet } from "../utils/cache"
export const getAllStudents = () => cachedGet(axiosInstance, "/trainer/students")
export const getStudentDetail = (username) => cachedGet(axiosInstance, `/trainer/students/${username}`)
export const getStudentActivity = (username) => cachedGet(axiosInstance, `/trainer/students/${username}/activity`)
