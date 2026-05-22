import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, Divider, CircularProgress, Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { institutionsApi } from '@/api/institutions'

const schema = z.object({
  name:         z.string().min(2, 'Nome obrigatório'),
  cnpj:         z.string().optional(),
  payment_days: z.coerce.number().min(1, 'Prazo deve ser maior que zero'),
  payment_ref:  z.enum(['last_day', 'issue_date', 'first_day_next']),
  notes:        z.string().optional(),
})

const PAYMENT_REF_OPTIONS = [
  { value: 'last_day',       label: 'Último dia do mês de referência' },
  { value: 'issue_date',     label: 'Data de emissão da NF' },
  { value: 'first_day_next', label: 'Primeiro dia do mês seguinte' },
]

export default function InstitutionDrawer({ open, onClose, institution }) {
  const queryClient = useQueryClient()
  const isEdit = !!institution

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { payment_days: 30, payment_ref: 'last_day' },
  })

  useEffect(() => {
    if (institution) {
      reset({
        name:         institution.name,
        cnpj:         institution.cnpj || '',
        payment_days: institution.payment_days,
        payment_ref:  institution.payment_ref,
        notes:        institution.notes || '',
      })
    } else {
      reset({ name: '', cnpj: '', payment_days: 30, payment_ref: 'last_day', notes: '' })
    }
  }, [institution, reset])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? institutionsApi.update(institution.id, data) : institutionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      onClose()
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100vw', p: 0, overflowX: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Editar instituição' : 'Nova instituição'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Instituição pagadora dos plantões
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          label="Nome da instituição"
          placeholder="Ex: Unimed, Hospital São Lucas"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
        />

        <TextField
          label="CNPJ (opcional)"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          error={!!errors.cnpj}
          helperText={errors.cnpj?.message}
        />

        <Divider>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            Prazo de pagamento
          </Typography>
        </Divider>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Prazo (dias)"
            type="number"
            {...register('payment_days')}
            error={!!errors.payment_days}
            helperText={errors.payment_days?.message}
            sx={{ width: { xs: '100%', sm: 130 } }}
          />
          <Controller
            name="payment_ref"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Contar a partir de"
                error={!!errors.payment_ref}
                helperText={errors.payment_ref?.message}
                sx={{ flex: 1 }}
              >
                {PAYMENT_REF_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>

        <TextField
          label="Observações (opcional)"
          multiline
          rows={3}
          {...register('notes')}
        />

        {mutation.isError && (
          <Typography color="error" variant="caption">
            Erro ao salvar. Tente novamente.
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || mutation.isPending}
          sx={{ minWidth: 110 }}
        >
          {mutation.isPending ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </Box>
    </Drawer>
  )
}
