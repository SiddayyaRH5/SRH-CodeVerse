import axiosInstance from "./axiosInstance"

export const getRoadmaps = (params) => axiosInstance.get("/roadmaps", { params })
export const getRoadmap = (slug) => axiosInstance.get(`/roadmaps/${slug}`)
export const getMyRoadmaps = () => axiosInstance.get("/roadmaps/my")
export const enrollRoadmap = (slug) => axiosInstance.post(`/roadmaps/${slug}/enroll`)
export const unenrollRoadmap = (slug) => axiosInstance.delete(`/roadmaps/${slug}/enroll`)
export const updateRoadmapTopic = (slug, topicId, completed) =>
  axiosInstance.patch(`/roadmaps/${slug}/topics/${topicId}`, { completed })
