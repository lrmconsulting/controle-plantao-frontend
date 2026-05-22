import apiClient from './client'

export const unitsApi = {
  list: (params) =>
    apiClient.get('/units/', { params }),

  get: (id) =>
    apiClient.get(`/units/${id}/`),

  create: (data) =>
    apiClient.post('/units/', data),

  update: (id, data) =>
    apiClient.patch(`/units/${id}/`, data),

  remove: (id) =>
    apiClient.patch(`/units/${id}/`, { is_active: false }),
}
