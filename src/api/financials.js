import api from './client'

export const invoicesApi = {
  /** Lista faturas — filtros: month (YYYY-MM), status, institution */
  list: (params = {}) => api.get('/financials/invoices/', { params }),

  get: (id) => api.get(`/financials/invoices/${id}/`),

  /** Gera fatura: { institution, month, notes?, shift_ids? } */
  generate: (data) => api.post('/financials/invoices/generate/', data),

  /** Registra número da NF emitida: { nf_number, issue_date? } */
  setNF: (id, data) => api.patch(`/financials/invoices/${id}/set-nf/`, data),

  update: (id, data) => api.patch(`/financials/invoices/${id}/`, data),

  /** Exclui fatura (somente não pagas) */
  cancel: (id) => api.delete(`/financials/invoices/${id}/cancel/`),

  /** Cancela NF emitida — reverte para rascunho */
  cancelNF: (id) => api.patch(`/financials/invoices/${id}/cancel-nf/`),

  /** Confirma recebimento da fatura: { received_date? } */
  confirmPayment: (id, data = {}) => api.patch(`/financials/invoices/${id}/confirm-payment/`, data),

  /** Desfaz pagamento — reverte para "NF emitida" (se tiver NF) ou "Rascunho" */
  cancelPayment: (id) => api.patch(`/financials/invoices/${id}/cancel-payment/`),

  /** Posterga fatura em +30 ou +60 dias: { days: 30 | 60 } */
  defer: (id, days) => api.patch(`/financials/invoices/${id}/defer/`, { days }),

  /** Substitui plantões de uma fatura rascunho: { shift_ids: [...] } */
  editShifts: (id, shift_ids) => api.patch(`/financials/invoices/${id}/edit-shifts/`, { shift_ids }),

  /** Lista plantões disponíveis para faturamento: { institution, month } */
  availableShifts: (params) => api.get('/financials/invoices/available-shifts/', { params }),

  /** Previsão de recebimentos agrupados por mês */
  forecast: () => api.get('/financials/invoices/forecast/'),

  /** Timeline: faturas agrupadas por mês de referência — param: year (opcional) */
  timeline: (year) => api.get('/financials/invoices/timeline/', { params: year ? { year } : {} }),

  /** Complementa fatura draft com plantões não faturados do mesmo mês/instituição */
  complement: (id) => api.post(`/financials/invoices/${id}/complement/`),
}

export const paymentsApi = {
  list: (params = {}) => api.get('/financials/payments/', { params }),

  /** @deprecated use invoicesApi.confirmPayment(invoiceId) */
  confirm: (id, data = {}) => api.patch(`/financials/payments/${id}/confirm/`, data),

  /** @deprecated use invoicesApi.defer(invoiceId, days) */
  defer: (id, days) => api.patch(`/financials/payments/${id}/defer/`, { days }),
}
