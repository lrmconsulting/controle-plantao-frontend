import api from './client'

export const billingApi = {
  /** Retorna status atual: { status, is_active, plan, effective_plan, has_reports_access, trial_days_left } */
  status: () => api.get('/billing/status/'),

  /**
   * Cria sessão de checkout Stripe
   * @param {'basic'|'premium'} plan
   */
  createCheckoutSession: (plan = 'basic') =>
    api.post('/billing/create-checkout-session/', { plan }),

  /** Abre o Customer Portal Stripe (gerenciar / cancelar / trocar plano) */
  openPortal: () => api.post('/billing/portal/'),
}
