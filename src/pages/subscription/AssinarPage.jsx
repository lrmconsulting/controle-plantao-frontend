/**
 * AssinarPage — Escolha de plano (Básico ou Premium)
 */
import { useState } from 'react'
import {
  Box, Typography, Button, CircularProgress, Alert,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import BarChartIcon from '@mui/icons-material/BarChart'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'

/* ── Logo ── */
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

/* ── Feature list ── */
function FeatureList({ items, highlight = [] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            minWidth: 18, height: 18, borderRadius: '50%',
            backgroundColor: highlight.includes(i) ? '#0d9488' : 'rgba(13,148,136,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 1,
          }}>
            <CheckIcon style={{ fontSize: 11, color: highlight.includes(i) ? '#fff' : '#0d9488' }} />
          </div>
          <Typography sx={{
            fontSize: '0.82rem',
            color: '#374151',
            lineHeight: 1.5,
          }}>
            {item}
          </Typography>
        </li>
      ))}
    </ul>
  )
}

/* ── Plan Card ── */
function PlanCard({ plan, name, price, description, features, highlight, badge, selected, onSelect, loading }) {
  const isPremium = plan === 'premium'

  return (
    <Box
      onClick={() => !loading && onSelect(plan)}
      sx={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        border: selected
          ? `2px solid ${isPremium ? '#0d9488' : '#0A0A0A'}`
          : '2px solid rgba(0,0,0,0.09)',
        borderRadius: '16px',
        bgcolor: selected ? (isPremium ? 'rgba(13,148,136,0.04)' : 'rgba(0,0,0,0.02)') : '#FAFAF8',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        '&:hover': {
          borderColor: isPremium ? '#0d9488' : '#0A0A0A',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
        },
      }}
    >
      {/* Badge */}
      {badge && (
        <Box sx={{
          position: 'absolute', top: 12, right: 12,
          bgcolor: isPremium ? '#0d9488' : '#0A0A0A',
          color: 'white',
          fontSize: '0.55rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          px: 1.25, py: 0.4,
          borderRadius: 99,
        }}>
          {badge}
        </Box>
      )}

      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        {/* Plan name */}
        <Typography sx={{
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: isPremium ? '#0d9488' : '#666',
          mb: 1,
        }}>
          {name}
        </Typography>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.75 }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#888', fontWeight: 400 }}>R$</Typography>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: '#0A0A0A', letterSpacing: '-0.03em' }}>
            {price}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>/mês</Typography>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 2.5 }}>
          {description}
        </Typography>

        <FeatureList items={features} highlight={highlight} />
      </Box>

      {/* Footer */}
      {selected && (
        <Box sx={{
          px: 3, py: 1.5,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          bgcolor: isPremium ? 'rgba(13,148,136,0.06)' : 'rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: isPremium ? '#0d9488' : '#0A0A0A',
          }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: isPremium ? '#0d9488' : '#0A0A0A', letterSpacing: '0.08em' }}>
            Plano selecionado
          </Typography>
        </Box>
      )}
    </Box>
  )
}

/* ─────────────────── Main ─────────────────── */
const BASIC_FEATURES = [
  'Agenda completa de plantões',
  'Calendário mensal e anual',
  'Controle financeiro (faturas, NF, recebíveis)',
  'Integração Google e Apple Calendar',
  'Múltiplas instituições e unidades',
  'Acesso via qualquer dispositivo',
]

const PREMIUM_FEATURES = [
  'Tudo do plano Básico',
  'Relatórios anuais com exportação',
  'Export em PDF e Excel',
  'Análise financeira consolidada por ano',
]

export default function AssinarPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const { logout }                      = useAuthStore()

  const { data: subStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn:  () => billingApi.status(),
    select:   (res) => res.data,
  })

  const isExpired  = subStatus && !subStatus.is_active && subStatus.status === 'trialing'
  const isCanceled = subStatus?.status === 'canceled'
  const isPastDue  = subStatus?.status === 'past_due'

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await billingApi.createCheckoutSession(selectedPlan)
      window.location.href = data.url
    } catch {
      setError('Não foi possível iniciar o checkout. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#F3F3F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
      py: 6,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
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

      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, maxWidth: 520 }}>
        <Typography sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600, fontSize: { xs: '1.6rem', sm: '2rem' },
          letterSpacing: '-0.03em', color: '#0A0A0A', lineHeight: 1.1, mb: 1.5,
        }}>
          Escolha seu plano
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.6 }}>
          Sem multa, cancele quando quiser. Pagamento seguro via Stripe.
        </Typography>
      </Box>

      {/* Context alerts */}
      {isExpired && (
        <Alert severity="info" sx={{ mb: 3, maxWidth: 640, borderRadius: '10px', fontSize: '0.85rem' }}>
          Seu período de teste de 7 dias chegou ao fim. Escolha um plano para continuar.
        </Alert>
      )}
      {isCanceled && (
        <Alert severity="warning" sx={{ mb: 3, maxWidth: 640, borderRadius: '10px', fontSize: '0.85rem' }}>
          Sua assinatura foi cancelada. Reative para continuar usando o PlantãoMed.
        </Alert>
      )}
      {isPastDue && (
        <Alert severity="error" sx={{ mb: 3, maxWidth: 640, borderRadius: '10px', fontSize: '0.85rem' }}>
          Há um problema com seu pagamento. Escolha um plano para atualizar.
        </Alert>
      )}

      {/* Plan cards */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        width: '100%', maxWidth: 640,
        mb: 3,
      }}>
        <PlanCard
          plan="basic"
          name="Básico"
          price="99"
          description="Agenda + financeiro completo"
          features={BASIC_FEATURES}
          highlight={[]}
          selected={selectedPlan === 'basic'}
          onSelect={setSelectedPlan}
          loading={loading}
        />
        <PlanCard
          plan="premium"
          name="Premium"
          price="129"
          description="Inclui relatórios e exportação"
          features={PREMIUM_FEATURES}
          highlight={[1, 2, 3]}
          badge="Recomendado"
          selected={selectedPlan === 'premium'}
          onSelect={setSelectedPlan}
          loading={loading}
        />
      </Box>

      {/* Reports callout */}
      <Box sx={{
        width: '100%', maxWidth: 640, mb: 3,
        bgcolor: 'rgba(13,148,136,0.06)',
        border: '1px solid rgba(13,148,136,0.18)',
        borderRadius: '12px',
        px: 2.5, py: 2,
        display: 'flex', gap: 1.5, alignItems: 'flex-start',
      }}>
        <BarChartIcon sx={{ fontSize: 20, color: '#0d9488', flexShrink: 0, mt: 0.1 }} />
        <Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A0A0A', mb: 0.25 }}>
            Relatórios: exclusivo do Premium
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: '#555', lineHeight: 1.5 }}>
            O plano Básico dá acesso a agenda, finanças e integrações. Para gerar relatórios anuais e exportar em PDF/Excel, você precisará do Premium.
          </Typography>
        </Box>
      </Box>

      {/* CTA */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 640, width: '100%', borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          onClick={handleSubscribe}
          sx={{
            bgcolor: selectedPlan === 'premium' ? '#0d9488' : '#0A0A0A',
            '&:hover': { bgcolor: selectedPlan === 'premium' ? '#0f766e' : '#1a1a1a' },
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.85rem',
            py: 1.5,
            letterSpacing: '0.08em',
          }}
        >
          {loading
            ? <><CircularProgress size={18} sx={{ color: 'white', mr: 1 }} /> Redirecionando…</>
            : `Assinar plano ${selectedPlan === 'premium' ? 'Premium — R$129/mês' : 'Básico — R$99/mês'}`}
        </Button>

        <Button
          fullWidth variant="text" size="small"
          onClick={logout}
          sx={{ color: '#aaa', fontSize: '0.75rem' }}
        >
          Sair da conta
        </Button>
      </Box>

      <Typography sx={{ mt: 3, fontSize: '0.68rem', color: '#bbb', textAlign: 'center' }}>
        Pagamento seguro via Stripe · Seus dados de cartão nunca passam pelos nossos servidores.
      </Typography>
    </Box>
  )
}
