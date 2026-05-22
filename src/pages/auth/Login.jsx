import { useState } from 'react'
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Typography, TextField, Button, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
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
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'E-mail ou senha incorretos.'
      setApiError(msg)
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Entrar
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Acesse sua conta para gerenciar seus plantões
      </Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {apiError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
          sx={{ mt: 1, py: 1.5 }}
        >
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Ainda não tem conta?{' '}
        <Link component={RouterLink} to="/cadastro" fontWeight={600} color="primary.main" underline="none">
          Criar conta
        </Link>
      </Typography>
    </Box>
  )
}
