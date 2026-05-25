import {
  Drawer, Box, Typography, Button, IconButton, Chip, Divider,
  CircularProgress, Tooltip, Alert,
} from '@mui/material'
import CloseIcon         from '@mui/icons-material/Close'
import EditIcon          from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon    from '@mui/icons-material/AccessTime'
import BusinessIcon      from '@mui/icons-material/Business'
import AttachMoneyIcon   from '@mui/icons-material/AttachMoney'
import SyncIcon          from '@mui/icons-material/Sync'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import UndoIcon          from '@mui/icons-material/Undo'
import BlockIcon         from '@mui/icons-material/Block'
import LinkIcon          from '@mui/icons-material/Link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { shiftsApi } from '@/api/shifts'

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',  color: 'default' },
  scheduled: { label: 'Agendado', color: 'info' },
  completed: { label: 'Realizado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(isoStr) {
  if (!isoStr) return null
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(value) {
  if (value == null) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function DetailRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
      <Box sx={{ color: 'text.secondary', mt: '2px', flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  )
}

export default function ShiftDetailDrawer({ open, onClose, shift, onEdit }) {
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  /** Invalida shifts E monthly-summary do mesmo mês */
  function invalidateMonth(isoDatetime) {
    const dt = new Date(isoDatetime)
    const month = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    queryClient.invalidateQueries({ queryKey: ['shifts', month] })
    queryClient.invalidateQueries({ queryKey: ['monthly-summary', month] })
  }

  const deleteMutation = useMutation({
    mutationFn: () => shiftsApi.remove(shift.id),
    onSuccess: () => {
      invalidateMonth(shift.start_datetime)
      setConfirmDelete(false)
      onClose()
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Erro ao excluir plantão.'
      setDeleteError(msg)
      setConfirmDelete(false)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus) => shiftsApi.update(shift.id, { status: newStatus }),
    onSuccess: (res) => {
      invalidateMonth(res.data.start_datetime)
      onClose()
    },
  })

  if (!shift) return null

  const status = STATUS_CONFIG[shift.status] || STATUS_CONFIG.pending
  const startTime = formatTime(shift.start_datetime)
  const endTime   = formatTime(shift.end_datetime)
  const timeStr   = startTime
    ? (endTime ? `${startTime} – ${endTime}` : startTime)
    : null

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100vw', p: 0, overflowX: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {shift.unit_detail && (
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: shift.unit_detail.color || '#94a3b8', flexShrink: 0 }} />
            )}
            <Typography variant="h6" fontWeight={700} noWrap>
              {shift.unit_detail?.name || shift.cal_title || 'Plantão'}
            </Typography>
          </Box>
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            sx={{ height: 20, fontSize: '0.68rem' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      {/* Detalhes */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <DetailRow
          icon={<CalendarTodayIcon fontSize="small" />}
          label="Data"
          value={formatDate(shift.start_datetime)}
        />

        {timeStr && (
          <DetailRow
            icon={<AccessTimeIcon fontSize="small" />}
            label="Horário"
            value={timeStr}
          />
        )}

        {shift.unit_detail && (
          <>
            <DetailRow
              icon={<BusinessIcon fontSize="small" />}
              label="Unidade"
              value={`${shift.unit_detail.name}${shift.unit_detail.institution_name ? ` · ${shift.unit_detail.institution_name}` : ''}`}
            />
            {shift.effective_value && (
              <DetailRow
                icon={<AttachMoneyIcon fontSize="small" />}
                label="Valor"
                value={formatCurrency(shift.effective_value)}
              />
            )}
          </>
        )}

        {!shift.unit && (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fcd34d' }}>
            <Typography variant="body2" color="warning.dark" fontWeight={700} mb={0.5}>
              Evento sem unidade vinculada
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Importado do {shift.cal_source === 'google' ? 'Google Calendar' : shift.cal_source === 'apple' ? 'Apple Calendar' : 'calendário'}.
              Vincule a uma unidade para registrar o valor e incluir no financeiro.
            </Typography>
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={onEdit}
              sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              Vincular unidade agora →
            </Button>
          </Box>
        )}

        {shift.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
              Observações
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {shift.notes}
            </Typography>
          </>
        )}

        {shift.cal_source !== 'manual' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SyncIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Importado de {shift.cal_source === 'google' ? 'Google Calendar' : 'Apple Calendar'}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, pt: 2, pb: 2.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* Erro de exclusão */}
        {deleteError && (
          <Alert severity="error" onClose={() => setDeleteError('')} sx={{ py: 0.5, fontSize: '0.78rem' }}>
            {deleteError}
          </Alert>
        )}

        {/* Confirmação de exclusão */}
        {confirmDelete ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="error" align="center" fontWeight={600}>
              Confirmar exclusão permanente?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                fullWidth
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />}
              >
                Excluir
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Ação primária por status */}
            {shift.status === 'pending' && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                startIcon={<LinkIcon />}
                onClick={onEdit}
              >
                Vincular unidade
              </Button>
            )}
            {shift.status === 'scheduled' && (
              <Button
                variant="contained"
                color="success"
                size="small"
                fullWidth
                startIcon={statusMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                onClick={() => statusMutation.mutate('completed')}
                disabled={statusMutation.isPending}
              >
                Marcar como realizado
              </Button>
            )}
            {shift.status === 'completed' && (
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<UndoIcon />}
                onClick={() => statusMutation.mutate('scheduled')}
                disabled={statusMutation.isPending}
              >
                Reverter para agendado
              </Button>
            )}

            {/* Ações secundárias — linha compacta de ícones + texto */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={onEdit} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', px: 1.5 }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              {shift.status !== 'cancelled' && (
                <Tooltip title="Cancelar plantão">
                  <IconButton
                    size="small"
                    onClick={() => statusMutation.mutate('cancelled')}
                    disabled={statusMutation.isPending}
                    sx={{ border: '1px solid', borderColor: 'warning.main', borderRadius: '6px', px: 1.5, color: 'warning.main' }}
                  >
                    <BlockIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Excluir permanentemente">
                <IconButton
                  size="small"
                  onClick={() => { setDeleteError(''); setConfirmDelete(true) }}
                  sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: '6px', px: 1.5, color: 'error.main' }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
