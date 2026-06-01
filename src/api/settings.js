import api from './client'

export const profileApi = {
  /** Retorna dados do usuário autenticado */
  get: () => api.get('/auth/me/'),

  /** Atualiza nome, especialidade, CRM, CPF, telefone */
  update: (data) => api.patch('/auth/me/', data),

  /** Troca de senha: { current_password, new_password, new_password_confirm } */
  changePassword: (data) => api.post('/auth/change-password/', data),

  /** Exclui a conta: { password, refresh? } */
  deleteAccount: (data) => api.delete('/auth/delete-account/', { data }),
}

export const preferencesApi = {
  /** Retorna preferências de notificação */
  get: () => api.get('/auth/preferences/'),

  /** Atualiza preferências */
  update: (data) => api.patch('/auth/preferences/', data),
}

export const integrationsApi = {
  /** Lista integrações ativas do usuário */
  list: () => api.get('/integrations/'),

  /** Retorna auth_url para iniciar OAuth2 do Google */
  googleConnect: () => api.get('/integrations/google/connect/'),

  /** Desconecta uma integração: source = 'google' | 'apple' */
  disconnect: (source) => api.delete(`/integrations/${source}/disconnect/`),

  /** Conecta Apple CalDAV: { caldav_url, username, password, sync_from_date? } */
  appleConnect: (data) => api.post('/integrations/apple/connect/', data),

  /** Sincronização: month = 'YYYY-MM' (opcional) */
  sync: (month) => api.post('/integrations/sync/', month ? { month } : {}),

  /** Eventos do Google Calendar para um mês: month = 'YYYY-MM' */
  googleEvents: (month) => api.get('/integrations/google/events/', { params: { month } }),

  /** Lista calendários disponíveis na integração: source = 'google' | 'apple' */
  availableCalendars: (source) => api.get(`/integrations/${source}/available-calendars/`),

  /** Salva calendários selecionados: selected_ids = [] (vazio = todos) */
  selectCalendars: (source, selectedIds) =>
    api.patch(`/integrations/${source}/select-calendars/`, { selected_ids: selectedIds }),
}
