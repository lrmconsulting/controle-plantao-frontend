import { Outlet } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* Painel lateral — visível apenas em desktop */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 8,
          background: 'linear-gradient(160deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decoração de fundo */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', mb: 2, display: 'block' }}
          >
            VITALIS
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, lineHeight: 1.2, mb: 3 }}
          >
            Gestão de plantões simplificada
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.7 }}>
            Controle sua agenda, acompanhe seus recebíveis e tenha visibilidade financeira completa dos seus plantões.
          </Typography>

          {/* Pontos decorativos */}
          <Box sx={{ display: 'flex', gap: 1, mt: 5 }}>
            {['Agenda integrada', 'Controle financeiro', 'Mobile first'].map((label) => (
              <Box
                key={label}
                sx={{
                  px: 2, py: 0.75,
                  borderRadius: 99,
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Formulário */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 4,
        }}
      >
        {/* Logo — mobile */}
        <Box sx={{ display: { md: 'none' }, mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: 'primary.main' }}
          >
            Vitalis
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Controle de Plantões
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
