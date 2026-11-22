import axiosInstance from "./axiosInstance"

export const getCertificates = () => axiosInstance.get("/certificates")
export const getMyCertificates = () => axiosInstance.get("/certificates/my")
export const getCertificate = (slug) => axiosInstance.get(`/certificates/${slug}`)
export const startCertificateAttempt = (slug) => axiosInstance.post(`/certificates/${slug}/attempts`)
export const getCertificateAttempt = (attemptId) =>
  axiosInstance.get(`/certificates/attempts/${attemptId}`, { skipCache: true })
export const saveCertificateAnswer = (attemptId, questionId, selectedOption) =>
  axiosInstance.patch(`/certificates/attempts/${attemptId}/answers/${questionId}`, { selectedOption })
export const submitCertificateAttempt = (attemptId) =>
  axiosInstance.post(`/certificates/attempts/${attemptId}/submit`)
export const getCertificateAttemptResult = (attemptId) =>
  axiosInstance.get(`/certificates/attempts/${attemptId}/result`)
export const getCertificateAttempts = (slug) => axiosInstance.get(`/certificates/${slug}/attempts`)
export const claimCertificate = (slug) => axiosInstance.post(`/certificates/${slug}/claim`)
export const getIssuedCertificate = (certificateNumber) =>
  axiosInstance.get(`/certificates/issued/${certificateNumber}`)
export const downloadCertificatePdf = (certificateNumber) =>
  axiosInstance.get(`/certificates/issued/${certificateNumber}/download`, {
    responseType: "blob",
    skipCache: true,
  })
export const verifyCertificate = (verificationCode) =>
  axiosInstance.get(`/certificates/verify/${verificationCode}`, { skipCache: true })
