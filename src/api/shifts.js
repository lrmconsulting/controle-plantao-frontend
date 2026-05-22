import api from './client'

export const shiftsApi = {
  /** Lista plantões — aceita filtros: month (YYYY-MM), status, unit, start_date, end_date */
  list: (params = {}) => api.get('/shifts/', { params }),

  get: (id) => api.get(`/shifts/${id}/`),

  create: (data) => api.post('/shifts/', data),

  update: (id, data) => api.patch(`/shifts/${id}/`, data),

  remove: (id) => api.delete(`/shifts/${id}/`),

  /** Vincula um evento de calendário a uma unidade */
  assign: (id, data) => api.patch(`/shifts/${id}/assign/`, data),

  /** Dispara sincronização manual de calendários */
  sync: () => api.post('/shifts/sync/'),

  /** Consolidado mensal por unidade */
  monthlySummary: (month) => api.get('/shifts/monthly-summary/', { params: { month } }),
}
