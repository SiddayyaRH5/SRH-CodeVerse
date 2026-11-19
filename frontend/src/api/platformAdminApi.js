import axiosInstance from './axiosInstance'

/** Super-admin APIs; server-side authorization is required for every request. */
export const getPlatformOverview = () => axiosInstance.get('/admin/platform/overview')
export const getPlatformUsers = (query = '') => axiosInstance.get('/admin/platform/users', { params: query ? { q: query } : {} })
export const getPlatformUser = (id) => axiosInstance.get(`/admin/platform/users/${id}`)
export const updatePlatformUserRole = (id, role) => axiosInstance.put(`/admin/platform/users/${id}/role`, { role })
export const getPlatformAuditLogs = (page = 0, size = 50) => axiosInstance.get('/admin/platform/audit-logs', { params: { page, size } })

export const getPlatformUsersPage = (query = '', page = 0, size = 25) => axiosInstance.get('/admin/platform/users/page', { params: { q: query, page, size } })
export const getPlatformOrganizations = (query = '', page = 0, size = 25) => axiosInstance.get('/admin/platform/organizations', { params: { q: query, page, size } })
export const getPlatformOrganization = (id) => axiosInstance.get(`/admin/platform/organizations/${id}`)
export const createPlatformOrganization = (payload) => axiosInstance.post('/admin/platform/organizations', payload)
export const updatePlatformOrganizationStatus = (id, status) => axiosInstance.patch(`/admin/platform/organizations/${id}/status`, { status })
