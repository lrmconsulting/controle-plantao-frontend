/**
 * ConfirmacaoPage — Retorno após checkout Stripe bem-sucedido
 * URL: /assinatura-confirmada?session_id=...
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Paper } from '@mui/material'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { useQueryClient } from '@tanstack/react-query'

export default function ConfirmacaoPage() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  useEffect(() => {
    // Invalida o cache do status de assinatura para refletir o novo status
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
  }, [queryClient])

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f0fdfa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          bgcolor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LocalHospitalIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography fontWeight={800} fontSize="1.4rem" color="#0f172a" letterSpacing="-0.02em">
          Vitalis
        </Typography>
      </Box>

      <Paper elevation={0} sx={{
        maxWidth: 420, width: '100%',
        border: '1px solid #99f6e4',
        borderRadius: '16px',
        p: 4,
        textAlign: 'center',
      }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: '#0d9488', mb: 2 }} />

        <Typography fontWeight={800} fontSize="1.4rem" color="#0f172a" mb={1}>
          Assinatura ativada!
        </Typography>
        <Typography color="text.secondary" fontSize="0.9rem" mb={3}>
          Bem-vindo ao Vitalis. Sua assinatura mensal está ativa e você já pode usar todas as funcionalidades.
        </Typography>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => navigate('/agenda')}
          sx={{
            bgcolor: '#0d9488',
            '&:hover': { bgcolor: '#0f766e' },
            borderRadius: '10px',
            fontWeight: 700,
            py: 1.5,
          }}
        >
          Ir para a Agenda
        </Button>
      </Paper>
    </Box>
  )
}
