import axiosInstance from "./axiosInstance"
export const getActivity = () => axiosInstance.get("/student/activity")