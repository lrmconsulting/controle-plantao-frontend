/**
 * AuthLayout — estética editorial ai-automation
 * Lado esquerdo: cream com app mockup + features
 * Lado direito: form area
 */
import { Outlet, Link as RouterLink } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const TEAL   = '#0d9488'
const CREAM  = '#F3F3F1'
const BORDER = 'rgba(0,0,0,0.07)'

/* ── Logo 3 barras (teal) ── */
function LogoBars({ size = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[size, size, size].map((h, i) => (
        <div key={i} style={{ width: 5, height: h, backgroundColor: TEAL, borderRadius: 99 }} />
      ))}
    </div>
  )
}

/* ── Feature pills ── */
const FEATURES = [
  { emoji: '📅', label: 'Agenda integrada' },
  { emoji: '💰', label: 'Controle financeiro' },
  { emoji: '📊', label: 'Relatórios anuais' },
  { emoji: '🔗', label: 'Google & Apple Calendar' },
]

export default function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: CREAM }}>

      {/* ── Painel esquerdo (editorial) — desktop only ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '48%',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 7, py: 6,
        bgcolor: CREAM,
        borderRight: `1px solid ${BORDER}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decoração sutil */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 280, height: 280, borderRadius: '50%',
          bgcolor: 'rgba(13,148,136,0.06)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: -60,
          width: 200, height: 200, borderRadius: '50%',
          bgcolor: 'rgba(13,148,136,0.04)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <RouterLink to="/" style={{ textDecoration: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
              <LogoBars size={20} />
              <Typography sx={{
                fontFamily: 'Inter, sans-serif', fontWeight: 700,
                fontSize: '0.75rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#0A0A0A',
              }}>
                PlantãoMed
              </Typography>
            </Box>
          </RouterLink>

          {/* Headline */}
          <Typography sx={{
            fontFamily: 'Inter, sans-serif', fontWeight: 600,
            fontSize: '2rem', letterSpacing: '-0.04em',
            color: '#0A0A0A', lineHeight: 1.1, mb: 1.5,
          }}>
            Gestão de plantões simplificada
          </Typography>
          <Typography sx={{
            fontSize: '0.88rem', color: '#666', lineHeight: 1.7, mb: 4, maxWidth: 360,
          }}>
            Controle sua agenda, acompanhe recebíveis e tenha visibilidade financeira completa.
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {FEATURES.map((f) => (
              <Box key={f.label} sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.6,
                bgcolor: '#fff', borderRadius: 99,
                border: `1px solid ${BORDER}`,
                fontSize: '0.7rem', fontWeight: 500, color: '#444',
                fontFamily: 'Inter, sans-serif',
              }}>
                <span>{f.emoji}</span> {f.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Formulário ── */}
      <Box sx={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        px: { xs: 3, sm: 6, md: 8 }, py: 4,
        bgcolor: { xs: CREAM, md: '#FAFAF8' },
      }}>
        {/* Logo mobile */}
        <Box sx={{ display: { md: 'none' }, mb: 5, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
            <LogoBars size={18} />
            <Typography sx={{
              fontFamily: 'Inter, sans-serif', fontWeight: 700,
              fontSize: '0.75rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#0A0A0A',
            }}>
              PlantãoMed
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.5, letterSpacing: '0.08em' }}>
            Controle de Plantões
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
