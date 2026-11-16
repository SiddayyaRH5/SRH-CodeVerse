import axiosInstance from './axiosInstance'

export const getAnnouncements = () => axiosInstance.get('/announcements')
export const createAnnouncement = (data) => axiosInstance.post('/announcements', data)
export const updateAnnouncement = (id, data) => axiosInstance.patch(`/announcements/${id}`, data)
export const deleteAnnouncement = (id) => axiosInstance.delete(`/announcements/${id}`)