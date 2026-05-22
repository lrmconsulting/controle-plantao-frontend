import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Typography, TextField, Button, Link,
  InputAdornment, IconButton, Alert, CircularProgress, Grid,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name:             z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email:            z.string().email('E-mail inválido'),
  crm:              z.string().optional(),
  password:         z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'As senhas não coincidem',
  path: ['password_confirm'],
})

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const res = await authApi.register(data)
      setAuth(res.data.user, res.data.access, res.data.refresh)
      navigate('/agenda', { replace: true })
    } catch (err) {
      const d = err.response?.data
      // Coleta todos os erros de campo que o Django retornar
      if (d && typeof d === 'object') {
        const messages = Object.entries(d)
          .map(([field, errs]) => {
            const label = { name: 'Nome', email: 'E-mail', password: 'Senha', password_confirm: 'Confirmação', non_field_errors: '' }[field] ?? field
            const text = Array.isArray(errs) ? errs.join(' ') : String(errs)
            return label ? `${label}: ${text}` : text
          })
          .join('\n')
        setApiError(messages || 'Erro ao criar conta. Tente novamente.')
      } else {
        setApiError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Criar conta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Comece a controlar seus plantões hoje
      </Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {apiError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Nome completo"
          autoFocus
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          label="CRM (opcional)"
          placeholder="Ex: CRM-SP 123456"
          {...register('crm')}
          error={!!errors.crm}
          helperText={errors.crm?.message}
        />

        <TextField
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
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

        <TextField
          label="Confirmar senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('password_confirm')}
          error={!!errors.password_confirm}
          helperText={errors.password_confirm?.message}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 1, py: 1.5 }}
        >
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Criar conta'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Já tem conta?{' '}
        <Link component={RouterLink} to="/login" fontWeight={600} color="primary.main" underline="none">
          Entrar
        </Link>
      </Typography>
    </Box>
  )
}
