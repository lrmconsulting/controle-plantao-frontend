/**
 * usePlan — hook para ler o plano atual do usuário
 *
 * Retorna:
 *   effectivePlan: 'trial' | 'basic' | 'premium' | null
 *   hasReportsAccess: boolean
 *   isLoading: boolean
 *   subStatus: objeto completo do backend
 */
import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'

export function usePlan() {
  const { isAuthenticated } = useAuthStore()

  const { data: subStatus, isLoading } = useQuery({
    queryKey:       ['subscription-status'],
    queryFn:        () => billingApi.status(),
    select:         (res) => res.data,
    staleTime:      5 * 60 * 1000,
    refetchOnFocus: true,
    enabled:        isAuthenticated,
  })

  return {
    effectivePlan:    subStatus?.effective_plan ?? null,
    hasReportsAccess: subStatus?.has_reports_access ?? false,
    isLoading,
    subStatus,
  }
}
