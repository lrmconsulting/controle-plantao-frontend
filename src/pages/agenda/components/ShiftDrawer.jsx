import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shiftsApi } from '@/api/shifts'
import { unitsApi } from '@/api/units'

const schema = z.object({
  start_date:  z.string().min(1, 'Data obrigatória'),
  start_time:  z.string().min(1, 'Horário de início obrigatório'),
  end_time:    z.string().optional(),
  unit:        z.string().optional(),
  cal_title:   z.string().optional(),
  notes:       z.string().optional(),
})

/** Converte Date para string 'YYYY-MM-DD' */
function toDateStr(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Extrai 'HH:MM' de uma string ISO datetime */
function toTimeStr(isoStr) {
  if (!isoStr) return ''
  const dt = new Date(isoStr)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

/** Combina data (YYYY-MM-DD) + horário (HH:MM) em ISO string local */
function toISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`
}

export default function ShiftDrawer({ open, onClose, shift, initialDate }) {
  const queryClient = useQueryClient()
  const isEdit = !!shift

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.list({ is_active: true }),
    select: (res) => res.data.results ?? res.data,
  })

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { start_date: '', start_time: '07:00', end_time: '', unit: '', cal_title: '', notes: '' },
  })

  useEffect(() => {
    if (shift) {
      reset({
        start_date: toDateStr(new Date(shift.start_datetime)),
        start_time: toTimeStr(shift.start_datetime),
        end_time:   shift.end_datetime ? toTimeStr(shift.end_datetime) : '',
        unit:       shift.unit || '',
        cal_title:  shift.cal_title || '',
        notes:      shift.notes || '',
      })
    } else {
      reset({
        start_date: initialDate ? toDateStr(initialDate) : '',
        start_time: '07:00',
        end_time:   '19:00',
        unit:       '',
        cal_title:  '',
        notes:      '',
      })
    }
  }, [shift, initialDate, reset, open])

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        start_datetime: toISO(data.start_date, data.start_time),
        end_datetime:   data.end_time ? toISO(data.start_date, data.end_time) : null,
        unit:           data.unit || null,
        cal_title:      data.cal_title || '',
        notes:          data.notes || '',
        // cal_source só é definido em criações manuais — NUNCA enviar em edições
        // para não sobrescrever a origem de eventos vindos do Google/Apple
        ...(!isEdit && { cal_source: 'manual' }),
      }
      return isEdit ? shiftsApi.update(shift.id, payload) : shiftsApi.create(payload)
    },
    onSuccess: (res) => {
      // Invalida o mês do plantão criado/editado (agenda + financeiro)
      const dt = new Date(res.data.start_datetime)
      const month = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      queryClient.invalidateQueries({ queryKey: ['shifts', month] })
      queryClient.invalidateQueries({ queryKey: ['monthly-summary', month] })
      onClose()
    },
  })

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
            {isEdit ? 'Editar plantão' : 'Novo plantão'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Registre um plantão manualmente
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
          label="Data"
          type="date"
          {...register('start_date')}
          error={!!errors.start_date}
          helperText={errors.start_date?.message}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="Início"
            type="time"
            {...register('start_time')}
            error={!!errors.start_time}
            helperText={errors.start_time?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Fim (opcional)"
            type="time"
            {...register('end_time')}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Unidade (opcional)"
              error={!!errors.unit}
              helperText={errors.unit?.message}
            >
              <MenuItem value=""><em>Sem unidade</em></MenuItem>
              {(units || []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: u.color || '#94a3b8', flexShrink: 0 }} />
                    {u.name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <TextField
          label="Título (opcional)"
          placeholder="Ex: Plantão UTI noturno"
          {...register('cal_title')}
        />

        <TextField
          label="Observações (opcional)"
          multiline
          rows={2}
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
