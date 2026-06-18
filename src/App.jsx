import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import vitalisTheme from '@/theme'
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import SubscriptionGuard from '@/components/common/SubscriptionGuard'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import GoogleCallback from '@/pages/auth/GoogleCallback'
import Agenda from '@/pages/agenda/Agenda'
import Financeiro from '@/pages/financials/Financeiro'
import Cadastros from '@/pages/settings/Cadastros'
import Ajustes from '@/pages/settings/Ajustes'
import LandingPage from '@/pages/landing/LandingPage'
import AssinarPage from '@/pages/subscription/AssinarPage'
import ConfirmacaoPage from '@/pages/subscription/ConfirmacaoPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={vitalisTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Landing page — rota raiz pública */}
            <Route path="/" element={<LandingPage />} />

            {/* Rotas de autenticação */}
            <Route element={<AuthLayout />}>
              <Route path="/login"    element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
            </Route>

            {/* Callback OAuth2 Google */}
            <Route path="/auth/google-callback" element={<GoogleCallback />} />

            {/* Tela de assinatura — autenticado mas sem assinatura ativa */}
            <Route
              path="/assinar"
              element={
                <ProtectedRoute>
                  <AssinarPage />
                </ProtectedRoute>
              }
            />

            {/* Confirmação de checkout Stripe */}
            <Route
              path="/assinatura-confirmada"
              element={
                <ProtectedRoute>
                  <ConfirmacaoPage />
                </ProtectedRoute>
              }
            />

            {/* Rotas protegidas — exigem autenticação + assinatura ativa */}
            <Route
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout />
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            >
              <Route path="/agenda"     element={<Agenda />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/cadastros"  element={<Cadastros />} />
              <Route path="/ajustes"    element={<Ajustes />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
