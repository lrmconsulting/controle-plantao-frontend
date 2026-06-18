/**
 * SubscriptionGuard
 *
 * Envolve as rotas protegidas e verifica se o usuário pode usar o app:
 *   - trial ativo  → permite
 *   - assinatura ativa → permite
 *   - trial expirado / cancelado / pendente → redireciona para /assinar
 *
 * O status é checado via React Query (staleTime curto para não perder
 * a expiração do trial enquanto o usuário está logado).
 */
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress } from '@mui/material'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'

export default function SubscriptionGuard({ children }) {
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn:  () => billingApi.status(),
    select:   (res) => res.data,
    // Verifica a cada 5 minutos enquanto a aba está em foco
    staleTime:        5 * 60 * 1000,
    refetchOnFocus:   true,
    enabled:          isAuthenticated,
  })

  // Enquanto carrega na primeira vez, mostra spinner discreto
  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={32} sx={{ color: '#0d9488' }} />
      </Box>
    )
  }

  // Acesso liberado: trial válido ou assinatura ativa
  if (!data || data.is_active) {
    return children
  }

  // Trial expirado / cancelado / pendente → assinatura necessária
  return <Navigate to="/assinar" replace />
}
