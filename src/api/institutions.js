import apiClient from './client'

export const institutionsApi = {
  list: (params) =>
    apiClient.get('/institutions/', { params }),

  get: (id) =>
    apiClient.get(`/institutions/${id}/`),

  create: (data) =>
    apiClient.post('/institutions/', data),

  update: (id, data) =>
    apiClient.patch(`/institutions/${id}/`, data),

  remove: (id) =>
    apiClient.patch(`/institutions/${id}/`, { is_active: false }),
}
