import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token JWT em todas as requisições
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh automático do token quando expirar
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        useAuthStore.getState().setTokens(data.access, refreshToken)
        original.headers.Authorization = `Bearer ${data.access}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
