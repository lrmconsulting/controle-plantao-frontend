import { useState } from 'react'
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Typography, TextField, Button, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { authApi }       from '@/api/auth'
import { useAuthStore }  from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const setAuth   = useAuthStore((s) => s.setAuth)
  const [showPwd, setShowPwd] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const from = location.state?.from?.pathname || '/agenda'

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const res = await authApi.login(data.email, data.password)
      setAuth(res.data.user, res.data.access, res.data.refresh)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'E-mail ou senha incorretos.'
      )
    }
  }

  return (
    <Box>
      <Typography sx={{
        fontFamily: 'Inter, sans-serif', fontWeight: 700,
        fontSize: '1.5rem', letterSpacing: '-0.03em', color: '#0A0A0A', mb: 0.5,
      }}>
        Entrar
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: '#888', mb: 4, lineHeight: 1.5 }}>
        Acesse sua conta para gerenciar seus plantões
      </Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', fontSize: '0.82rem' }}>
          {apiError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          label="Senha"
          type={showPwd ? 'text' : 'password'}
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                    {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{
            mt: 1, py: 1.4,
            bgcolor: '#0A0A0A', borderRadius: 99,
            '&:hover': { bgcolor: '#1a1a1a', transform: 'scale(1.01)' },
            fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em',
          }}
        >
          {isSubmitting
            ? <CircularProgress size={20} color="inherit" />
            : 'Entrar'}
        </Button>
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center', fontSize: '0.82rem', color: '#888' }}>
        Ainda não tem conta?{' '}
        <Link component={RouterLink} to="/cadastro" fontWeight={700} color="#0d9488" underline="none"
          sx={{ '&:hover': { color: '#0f766e' } }}>
          Criar conta
        </Link>
      </Typography>
    </Box>
  )
}
