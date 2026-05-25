import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, CircularProgress, Alert, Chip,
} from '@mui/material'
import CloseIcon  from '@mui/icons-material/Close'
import LinkIcon   from '@mui/icons-material/Link'
import AddIcon    from '@mui/icons-material/Add'
import SyncIcon   from '@mui/icons-material/Sync'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shiftsApi } from '@/api/shifts'
import { unitsApi }  from '@/api/units'

const schema = z.object({
  start_date: z.string().min(1, 'Data obrigatória'),
  start_time: z.string().min(1, 'Horário de início obrigatório'),
  end_time:   z.string().optional(),
  unit:       z.string().optional(),
  cal_title:  z.string().optional(),
  notes:      z.string().optional(),
})

function toDateStr(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toTimeStr(isoStr) {
  if (!isoStr) return ''
  const dt = new Date(isoStr)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function toISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`
}

export default function ShiftDrawer({ open, onClose, shift, initialDate }) {
  const queryClient = useQueryClient()
  const isEdit          = !!shift
  const isCalendarEvent = isEdit && shift?.cal_source !== 'manual'

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn:  () => unitsApi.list({ is_active: true }),
    select:   (res) => res.data.results ?? res.data,
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
        ...(!isEdit && { cal_source: 'manual' }),
      }
      return isEdit ? shiftsApi.update(shift.id, payload) : shiftsApi.create(payload)
    },
    onSuccess: (res) => {
      const dt    = new Date(res.data.start_datetime)
      const month = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      queryClient.invalidateQueries({ queryKey: ['shifts', month] })
      queryClient.invalidateQueries({ queryKey: ['monthly-summary', month] })
      onClose()
    },
  })

  /* ── Título e subtítulo contextuais ── */
  const title = isCalendarEvent
    ? 'Vincular a uma unidade'
    : isEdit
      ? 'Editar plantão'
      : 'Novo plantão'

  const subtitle = isCalendarEvent
    ? (shift?.cal_title || 'Evento importado do calendário')
    : isEdit
      ? 'Edite os dados do plantão'
      : 'Crie um plantão manualmente'

  const headerIcon = isCalendarEvent
    ? <SyncIcon fontSize="small" sx={{ color: 'text.secondary' }} />
    : <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100vw', p: 0, overflowX: 'hidden', display: 'flex', flexDirection: 'column' } }}
    >
      {/* ── Header ── */}
      <Box sx={{
        px: 2.5, py: 2,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: '#f8fafc',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box sx={{ mt: '2px' }}>{headerIcon}</Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280, display: 'block' }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: '-2px' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Formulário ── */}
      <Box
        component="form"
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}
      >

        {/* Para eventos de calendário: unidade em destaque no topo */}
        {isCalendarEvent && (
          <Box sx={{ p: 1.5, bgcolor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', mb: 0.25 }}>
            <Typography variant="caption" color="warning.dark" fontWeight={700} display="block" mb={0.25}>
              Evento importado — selecione a unidade correspondente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Isso converte o evento em plantão e habilita o controle financeiro.
            </Typography>
          </Box>
        )}

        {/* Unidade */}
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              size="small"
              label={isCalendarEvent ? 'Unidade *' : 'Unidade (opcional)'}
              error={!!errors.unit}
              helperText={errors.unit?.message}
            >
              <MenuItem value=""><em>Sem unidade</em></MenuItem>
              {(units || []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: u.color || '#94a3b8', flexShrink: 0 }} />
                    <Typography variant="body2">{u.name}</Typography>
                    {u.institution_name && (
                      <Typography variant="caption" color="text.secondary">· {u.institution_name}</Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* Data */}
        <TextField
          size="small"
          label="Data"
          type="date"
          {...register('start_date')}
          error={!!errors.start_date}
          helperText={errors.start_date?.message}
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={isCalendarEvent}
        />

        {/* Horários */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <TextField
            size="small"
            label="Início"
            type="time"
            {...register('start_time')}
            error={!!errors.start_time}
            helperText={errors.start_time?.message}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={isCalendarEvent}
          />
          <TextField
            size="small"
            label="Fim"
            type="time"
            {...register('end_time')}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={isCalendarEvent}
          />
        </Box>

        {/* Título — só para eventos manuais */}
        {!isCalendarEvent && (
          <TextField
            size="small"
            label="Título (opcional)"
            placeholder="Ex: Plantão UTI noturno"
            {...register('cal_title')}
          />
        )}

        {/* Observações */}
        <TextField
          size="small"
          label="Observações (opcional)"
          multiline
          rows={2}
          {...register('notes')}
        />

        {/* Erro do servidor */}
        {mutation.isError && (
          <Alert severity="error" sx={{ py: 0.5, fontSize: '0.78rem' }}>
            Erro ao salvar. Tente novamente.
          </Alert>
        )}
      </Box>

      {/* ── Footer ── */}
      <Box sx={{
        px: 2.5, py: 1.75,
        borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', gap: 1, justifyContent: 'flex-end',
        bgcolor: '#fafafa',
      }}>
        <Button size="small" variant="outlined" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit((d) => mutation.mutate(d))}
          disabled={mutation.isPending}
          startIcon={
            mutation.isPending
              ? <CircularProgress size={14} color="inherit" />
              : isCalendarEvent
                ? <LinkIcon sx={{ fontSize: 16 }} />
                : undefined
          }
          sx={{ minWidth: 100 }}
        >
          {mutation.isPending
            ? 'Salvando…'
            : isCalendarEvent
              ? 'Vincular'
              : isEdit
                ? 'Salvar'
                : 'Criar plantão'}
        </Button>
      </Box>
    </Drawer>
  )
}
