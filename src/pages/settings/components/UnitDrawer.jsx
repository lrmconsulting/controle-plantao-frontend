import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, CircularProgress, InputAdornment,
  ToggleButtonGroup, ToggleButton, Alert,
} from '@mui/material'
import CloseIcon            from '@mui/icons-material/Close'
import RepeatIcon           from '@mui/icons-material/Repeat'
import EventNoteIcon        from '@mui/icons-material/EventNote'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unitsApi }        from '@/api/units'
import { institutionsApi } from '@/api/institutions'

const PRESET_COLORS = [
  '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#10b981', '#ec4899', '#64748b',
]

const schema = z.object({
  name:          z.string().min(2, 'Nome obrigatório'),
  institution:   z.string().min(1, 'Instituição obrigatória'),
  billing_type:  z.enum(['per_shift', 'monthly']).default('per_shift'),
  shift_value:   z.coerce.number().optional(),
  monthly_value: z.coerce.number().optional(),
  color:         z.string().default('#0d9488'),
  notes:         z.string().optional(),
}).superRefine((d, ctx) => {
  if (d.billing_type === 'per_shift' && (!(d.shift_value) || d.shift_value <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o valor por plantão', path: ['shift_value'] })
  }
  if (d.billing_type === 'monthly' && (!(d.monthly_value) || d.monthly_value <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o valor mensal fixo', path: ['monthly_value'] })
  }
})

export default function UnitDrawer({ open, onClose, unit }) {
  const queryClient = useQueryClient()
  const isEdit = !!unit

  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsApi.list({ is_active: true }),
    select: (res) => res.data.results ?? res.data,
  })

  const {
    register, handleSubmit, reset, control, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { billing_type: 'per_shift', color: '#0d9488' },
  })

  const selectedColor   = watch('color')
  const billingType     = watch('billing_type')

  useEffect(() => {
    if (unit) {
      reset({
        name:          unit.name,
        institution:   unit.institution,
        billing_type:  unit.billing_type || 'per_shift',
        shift_value:   unit.shift_value   ?? '',
        monthly_value: unit.monthly_value ?? '',
        color:         unit.color || '#0d9488',
        notes:         unit.notes || '',
      })
    } else {
      reset({ name: '', institution: '', billing_type: 'per_shift', shift_value: '', monthly_value: '', color: '#0d9488', notes: '' })
    }
  }, [unit, reset])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? unitsApi.update(unit.id, data) : unitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      onClose()
    },
  })

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100vw', p: 0, overflowX: 'hidden', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Editar unidade' : 'Nova unidade'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Local onde o plantão é realizado
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          label="Nome da unidade"
          placeholder="Ex: UNIMED PN DIURNO"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
        />

        <Controller
          name="institution"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Instituição pagadora"
              error={!!errors.institution}
              helperText={errors.institution?.message}
            >
              {(institutionsData || []).map((inst) => (
                <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ── Tipo de cobrança ────────────────────────────────────── */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Tipo de faturamento
          </Typography>
          <Controller
            name="billing_type"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                value={field.value}
                onChange={(_, v) => v && field.onChange(v)}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                    border: '1px solid', borderColor: 'divider', py: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  },
                }}
              >
                <ToggleButton value="per_shift" sx={{ gap: 0.75 }}>
                  <RepeatIcon sx={{ fontSize: 16 }} />
                  Por plantão
                </ToggleButton>
                <ToggleButton value="monthly" sx={{ gap: 0.75 }}>
                  <EventNoteIcon sx={{ fontSize: 16 }} />
                  Mensal fixo
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          />

          {/* Dica contextual */}
          <Alert
            severity="info"
            sx={{ mt: 1.25, fontSize: '0.75rem', py: 0.5, '& .MuiAlert-icon': { fontSize: 16 } }}
          >
            {billingType === 'monthly'
              ? 'Valor único por mês, independente da quantidade de plantões realizados.'
              : 'Cada plantão realizado gera um lançamento separado no faturamento.'}
          </Alert>
        </Box>

        {/* ── Campo de valor (condicional) ────────────────────────── */}
        {billingType === 'per_shift' ? (
          <TextField
            key="shift_value"
            label="Valor por plantão"
            type="number"
            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
            {...register('shift_value')}
            error={!!errors.shift_value}
            helperText={errors.shift_value?.message}
          />
        ) : (
          <TextField
            key="monthly_value"
            label="Valor mensal fixo"
            type="number"
            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
            {...register('monthly_value')}
            error={!!errors.monthly_value}
            helperText={errors.monthly_value?.message}
          />
        )}

        {/* Seletor de cor */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Cor de identificação no calendário
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setValue('color', color)}
                sx={{
                  width: 32, height: 32, borderRadius: '50%', bgcolor: color,
                  cursor: 'pointer', border: '3px solid',
                  borderColor: selectedColor === color ? 'white' : 'transparent',
                  outline: selectedColor === color ? `2px solid ${color}` : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </Box>
        </Box>

        <TextField
          label="Observações (opcional)"
          multiline
          rows={2}
          {...register('notes')}
        />

        {mutation.isError && (
          <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
            {mutation.error?.response?.data?.detail || 'Erro ao salvar. Tente novamente.'}
          </Alert>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit((d) => mutation.mutate(d))}
          disabled={mutation.isPending}
          sx={{ minWidth: 110 }}
        >
          {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </Box>
    </Drawer>
  )
}
