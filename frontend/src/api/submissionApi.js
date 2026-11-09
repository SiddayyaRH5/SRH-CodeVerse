import axiosInstance from "./axiosInstance"

export const getMySubmissions = () =>
  axiosInstance.get("/submissions/my")
