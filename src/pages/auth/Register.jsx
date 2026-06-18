import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Typography, TextField, Button, Link,
  InputAdornment, IconButton, Alert, CircularProgress, Stack,
} from '@mui/material'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { authApi }       from '@/api/auth'
import { useAuthStore }  from '@/store/authStore'

const schema = z.object({
  name:             z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email:            z.string().email('E-mail inválido'),
  crm:              z.string().optional(),
  password:         z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'As senhas não coincidem',
  path:    ['password_confirm'],
})

export default function Register() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [showPwd, setShowPwd]     = useState(false)
  const [apiError, setApiError]   = useState('')

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
      <Typography sx={{
        fontFamily: 'Inter, sans-serif', fontWeight: 700,
        fontSize: '1.5rem', letterSpacing: '-0.03em', color: '#0A0A0A', mb: 0.5,
      }}>
        Criar conta
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: '#888', mb: 4, lineHeight: 1.5 }}>
        7 dias grátis · sem necessidade de cartão agora
      </Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', fontSize: '0.82rem' }}>
          {apiError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

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

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Senha"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
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
          <TextField
            label="Confirmar"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            {...register('password_confirm')}
            error={!!errors.password_confirm}
            helperText={errors.password_confirm?.message}
          />
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{
            mt: 1, py: 1.4,
            bgcolor: '#0d9488', borderRadius: 99,
            '&:hover': { bgcolor: '#0f766e', transform: 'scale(1.01)' },
            fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em',
          }}
        >
          {isSubmitting
            ? <CircularProgress size={20} color="inherit" />
            : 'Criar conta — 7 dias grátis'}
        </Button>
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center', fontSize: '0.82rem', color: '#888' }}>
        Já tem conta?{' '}
        <Link component={RouterLink} to="/login" fontWeight={700} color="#0A0A0A" underline="none"
          sx={{ '&:hover': { color: '#333' } }}>
          Entrar
        </Link>
      </Typography>
    </Box>
  )
}
