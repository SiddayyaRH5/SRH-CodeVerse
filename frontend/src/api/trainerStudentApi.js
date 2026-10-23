import axiosInstance from "./axiosInstance"
export const getAllStudents = () => axiosInstance.get("/trainer/students")
export const getStudentDetail = (username) => axiosInstance.get(`/trainer/students/${username}`)
export const getStudentActivity = (username) => axiosInstance.get(`/trainer/students/${username}/activity`)