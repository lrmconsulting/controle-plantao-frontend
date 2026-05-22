import apiClient from './client'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login/', { email, password }),

  register: (data) =>
    apiClient.post('/auth/register/', data),

  logout: (refresh) =>
    apiClient.post('/auth/logout/', { refresh }),

  me: () =>
    apiClient.get('/auth/me/'),
}
