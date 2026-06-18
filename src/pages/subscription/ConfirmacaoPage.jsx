/**
 * ConfirmacaoPage — Retorno após checkout Stripe bem-sucedido
 * URL: /assinatura-confirmada?session_id=...
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { billingApi } from '@/api/billing'

/* ── Logo 3 barras ── */
function LogoBars({ size = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[size, size, size].map((h, i) => (
        <div key={i} style={{
          width: 5, height: h,
          backgroundColor: '#0d9488',
          borderRadius: 99,
        }} />
      ))}
    </div>
  )
}

/* ── Features por plano ── */
const FEATURES = {
  basic: [
    'Agenda completa de plantões',
    'Controle financeiro — faturas, NF e recebíveis',
    'Integração com Google e Apple Calendar',
    'Acesso via qualquer dispositivo',
  ],
  premium: [
    'Tudo do plano Básico',
    'Relatórios anuais completos',
    'Exportação em PDF e Excel',
    'Análise financeira consolidada por ano',
  ],
}

/* ── Detalhe do plano ── */
const PLAN_META = {
  basic:   { label: 'Básico',  color: '#3b82f6', price: 'R$ 99/mês' },
  premium: { label: 'Premium', color: '#0d9488', price: 'R$ 129/mês' },
}

export default function ConfirmacaoPage() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  /* Invalida o cache imediatamente para pegar o status atualizado */
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
  }, [queryClient])

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn:  () => billingApi.status().then(r => r.data),
    staleTime: 0,
  })

  const plan     = sub?.plan || 'basic'
  const meta     = PLAN_META[plan] ?? PLAN_META.basic
  const features = FEATURES[plan]  ?? FEATURES.basic

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor:   '#F3F3F1',
      display:   'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
      py: 6,
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 7 }}>
        <LogoBars size={20} />
        <Typography sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700, fontSize: '0.75rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#0A0A0A',
        }}>
          PlantãoMed
        </Typography>
      </Box>

      {isLoading ? (
        <CircularProgress sx={{ color: '#0d9488' }} size={28} />
      ) : (
        <Box sx={{ maxWidth: 460, width: '100%' }}>

          {/* Ícone de sucesso */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 60, height: 60,
              borderRadius: '50%',
              bgcolor: '#0d9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3,
            }}>
              <CheckIcon sx={{ color: 'white', fontSize: 30 }} />
            </Box>

            {/* Badge do plano */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{
                px: 2, py: 0.5,
                borderRadius: 99,
                bgcolor: meta.color + '18',
                border: `1px solid ${meta.color}30`,
              }}>
                <Typography sx={{
                  fontSize: '0.58rem', fontWeight: 700,
                  color: meta.color,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                  Plano {meta.label} · {meta.price}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600, fontSize: '1.9rem',
              letterSpacing: '-0.04em', color: '#0A0A0A',
              lineHeight: 1.1, mb: 1.5,
            }}>
              Assinatura ativada
            </Typography>

            <Typography sx={{ fontSize: '0.88rem', color: '#888', lineHeight: 1.7 }}>
              Bem-vindo ao PlantãoMed. Você já tem acesso completo a todas as funcionalidades do seu plano.
            </Typography>
          </Box>

          {/* Features desbloqueadas */}
          <Box sx={{
            bgcolor: '#FAFAF8',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: '16px',
            p: 3, mb: 3,
          }}>
            <Typography sx={{
              fontSize: '0.52rem', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#c0c0bc', mb: 2,
            }}>
              Incluído no seu plano
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {features.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    bgcolor: 'rgba(13,148,136,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon sx={{ fontSize: 11, color: '#0d9488' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.4 }}>
                    {f}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* CTA */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate('/agenda')}
            sx={{
              bgcolor: '#0A0A0A',
              '&:hover': { bgcolor: '#1f1f1f' },
              borderRadius: 99,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              py: 1.75,
              boxShadow: 'none',
            }}
          >
            Ir para a Agenda
          </Button>

          <Typography sx={{
            mt: 2.5, textAlign: 'center',
            fontSize: '0.68rem', color: '#bbb',
          }}>
            Gerencie sua assinatura a qualquer momento em Ajustes → Assinatura.
          </Typography>

        </Box>
      )}
    </Box>
  )
}
