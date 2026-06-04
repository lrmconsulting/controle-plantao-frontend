import api from './client'

export const invoicesApi = {
  /** Lista faturas — filtros: month (YYYY-MM), status, institution */
  list: (params = {}) => api.get('/financials/invoices/', { params }),

  get: (id) => api.get(`/financials/invoices/${id}/`),

  /** Gera fatura a partir do consolidado mensal: { institution, month, notes? } */
  generate: (data) => api.post('/financials/invoices/generate/', data),

  /** Registra número da NF emitida: { nf_number, issue_date? } */
  setNF: (id, data) => api.patch(`/financials/invoices/${id}/set-nf/`, data),

  update: (id, data) => api.patch(`/financials/invoices/${id}/`, data),

  remove: (id) => api.delete(`/financials/invoices/${id}/`),

  /** Previsão de recebimentos agrupados por mês */
  forecast: () => api.get('/financials/invoices/forecast/'),

  /** Timeline: faturas agrupadas por mês de referência — param: year (opcional) */
  timeline: (year) => api.get('/financials/invoices/timeline/', { params: year ? { year } : {} }),

  /** Complementa fatura draft com plantões não faturados do mesmo mês/instituição */
  complement: (id) => api.post(`/financials/invoices/${id}/complement/`),
}

export const paymentsApi = {
  list: (params = {}) => api.get('/financials/payments/', { params }),

  /** Confirma recebimento: { received_date? } */
  confirm: (id, data = {}) => api.patch(`/financials/payments/${id}/confirm/`, data),

  /** Posterga a data prevista de pagamento: { days: 30 | 60 } */
  defer: (id, days) => api.patch(`/financials/payments/${id}/defer/`, { days }),
}
