import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Box, Typography, IconButton, Button, Chip, Fab,
  Skeleton, useTheme, useMediaQuery, Tooltip,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon  from '@mui/icons-material/ChevronRight'
import AddIcon           from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ViewModuleIcon    from '@mui/icons-material/ViewModule'
import SyncIcon          from '@mui/icons-material/Sync'
import LinkIcon          from '@mui/icons-material/Link'
import EventIcon         from '@mui/icons-material/Event'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shiftsApi }       from '@/api/shifts'
import { integrationsApi } from '@/api/settings'

import MonthCalendar     from './components/MonthCalendar'
import YearCalendar      from './components/YearCalendar'
import ShiftDrawer       from './components/ShiftDrawer'
import ShiftDetailDrawer from './components/ShiftDetailDrawer'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatTime(isoStr) {
  if (!isoStr) return null
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(value) {
  if (value == null) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/* ─────────────────────────────────────────────────────────────────────────
   ShiftColumn — coluna de plantões paginada
───────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10

function ShiftItem({ shift, onShiftClick }) {
  const dt        = new Date(shift.start_datetime)
  const startTime = formatTime(shift.start_datetime)
  const endTime   = formatTime(shift.end_datetime)
  const isPending = shift.status === 'pending'
  const color     = isPending ? '#f59e0b' : (shift.unit_detail?.color || '#94a3b8')
  const label     = shift.unit_detail?.name || shift.cal_title || 'Sem unidade'

  return (
    <Box
      onClick={() => onShiftClick(shift)}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        p: 1.25, borderRadius: '6px',
        border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', bgcolor: '#f0fdfa', transform: 'translateX(2px)' },
      }}
    >
      {/* Barra colorida */}
      <Box sx={{
        width: 3, alignSelf: 'stretch', borderRadius: 4,
        bgcolor: color, flexShrink: 0,
        borderStyle: isPending ? 'dashed' : 'solid',
      }} />

      {/* Badge de data */}
      <Box sx={{ textAlign: 'center', minWidth: 28, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'text.disabled', lineHeight: 1 }}>
          {MONTHS_PT[dt.getMonth()].slice(0, 3)}
        </Typography>
        <Typography fontWeight={700} sx={{ lineHeight: 1.3, fontSize: '0.85rem' }}>
          {dt.getDate()}
        </Typography>
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem', fontStyle: isPending ? 'italic' : 'normal' }}>
          {label}
        </Typography>
        {startTime && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            {startTime}{endTime ? ` – ${endTime}` : ''}
          </Typography>
        )}
      </Box>

      {/* Valor */}
      {shift.effective_value && parseFloat(shift.effective_value) > 0 && (
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.7rem' }}>
          {formatCurrency(shift.effective_value)}
        </Typography>
      )}
    </Box>
  )
}

function ShiftColumn({ title, accentColor, icon, shifts, onShiftClick, loading, emptyMessage }) {
  const [page, setPage] = useState(0)

  // Reseta página quando os shifts mudam (troca de mês)
  useEffect(() => { setPage(0) }, [shifts])

  const totalPages = Math.ceil(shifts.length / PAGE_SIZE)
  const pageShifts = shifts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column',
        border: '1px solid', borderColor: 'divider',
        borderRadius: '8px', overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Cabeçalho da coluna */}
      <Box
        sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: '#f8fafc',
        }}
      >
        <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center', fontSize: 18 }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={700} flex={1} sx={{ fontSize: '0.82rem' }}>
          {title}
        </Typography>
        <Chip
          label={shifts.length}
          size="small"
          sx={{
            height: 18, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: accentColor + '22', color: accentColor,
            border: `1px solid ${accentColor}44`,
          }}
        />
      </Box>

      {/* Lista de itens */}
      <Box sx={{ flex: 1, p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75, minHeight: 80 }}>
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={54} />)
        ) : pageShifts.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="caption" color="text.disabled" display="block">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          pageShifts.map(shift => (
            <ShiftItem key={shift.id} shift={shift} onShiftClick={onShiftClick} />
          ))
        )}
      </Box>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box
          sx={{
            px: 1.5, py: 0.75,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid', borderColor: 'divider',
            bgcolor: '#fafafa',
          }}
        >
          <IconButton size="small" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
            <ChevronLeftIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, shifts.length)} de {shifts.length}
          </Typography>
          <IconButton size="small" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Agenda — Página principal
───────────────────────────────────────────────────────────────────────── */
export default function Agenda() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()

  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view,  setView]  = useState('month')   // 'month' | 'year'

  const [selectedDate, setSelectedDate] = useState(null)
  const [detailShift,  setDetailShift]  = useState(null)
  const [editShift,    setEditShift]    = useState(null)
  const [createDate,   setCreateDate]   = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [detailOpen,   setDetailOpen]   = useState(false)

  /* ── Queries ── */
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const { data: monthShiftsData, isLoading: monthLoading } = useQuery({
    queryKey: ['shifts', monthStr],
    queryFn:  () => shiftsApi.list({ month: monthStr }),
    select:   (res) => res.data.results ?? res.data,
    enabled:  view === 'month',
  })

  const { data: yearShiftsData, isLoading: yearLoading } = useQuery({
    queryKey: ['shifts', 'year', year],
    queryFn:  () => shiftsApi.list({
      start_date: `${year}-01-01`,
      end_date:   `${year}-12-31`,
    }),
    select: (res) => res.data.results ?? res.data,
    enabled: view === 'year',
  })

  /* ── Auto-sync ── */
  const lastSyncedMonth = useRef(null)
  const [syncResult, setSyncResult] = useState(null)

  const syncMutation = useMutation({
    mutationFn: (m) => integrationsApi.sync(m),
    onSuccess: (res) => {
      const data = res.data
      setSyncResult(data)
      if ((data.created || 0) + (data.updated || 0) + (data.deleted || 0) > 0) {
        queryClient.invalidateQueries({ queryKey: ['shifts', monthStr] })
        queryClient.invalidateQueries({ queryKey: ['monthly-summary', monthStr] })
      }
    },
    onError: () => setSyncResult(null),
  })

  useEffect(() => {
    if (view !== 'month') return
    if (lastSyncedMonth.current === monthStr) return
    lastSyncedMonth.current = monthStr
    syncMutation.mutate(monthStr)
  }, [monthStr, view]) // eslint-disable-line react-hooks/exhaustive-deps

  const shifts  = view === 'month' ? (monthShiftsData || []) : (yearShiftsData || [])
  const loading = view === 'month' ? monthLoading : yearLoading

  /* ── Navegação ── */
  function prevPeriod() {
    if (view === 'year') { setYear(y => y - 1); return }
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextPeriod() {
    if (view === 'year') { setYear(y => y + 1); return }
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(today)
    setView('month')
  }

  /* ── Handlers ── */
  function handleShiftClick(shift) { setDetailShift(shift); setDetailOpen(true) }
  function handleDaySelect(date)   { setSelectedDate(date) }

  function handleMonthSelect(m) {
    setMonth(m)
    setView('month')
    setSelectedDate(null)
  }

  function openCreate(date) {
    setEditShift(null)
    setCreateDate(date || selectedDate || null)
    setDrawerOpen(true)
  }
  function openEdit(shift) {
    setDetailOpen(false)
    setEditShift(shift)
    setCreateDate(null)
    setDrawerOpen(true)
  }

  /* ── Particionamento por status ── */
  const allShifts    = monthShiftsData || []
  const pendingShifts    = useMemo(() =>
    allShifts.filter(s => s.status === 'pending')
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)),
    [allShifts]
  )
  const scheduledShifts  = useMemo(() =>
    allShifts.filter(s => s.status === 'scheduled')
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)),
    [allShifts]
  )
  const completedShifts  = useMemo(() =>
    allShifts.filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime)),
    [allShifts]
  )

  /* ── Resumo mensal ── */
  const activeShifts = allShifts.filter(s => s.status !== 'cancelled')
  const totalValue   = activeShifts
    .filter(s => ['scheduled', 'completed'].includes(s.status) && s.effective_value)
    .reduce((sum, s) => sum + parseFloat(s.effective_value || 0), 0)

  /* ── Banner de sincronização ── */
  const totalChanges = syncResult
    ? (syncResult.created || 0) + (syncResult.updated || 0)
    : 0

  /* ── Título do período ── */
  const periodTitle = view === 'year'
    ? String(year)
    : `${MONTHS_PT[month]} ${year}`

  /* ── Header ── */
  const header = (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <IconButton size="small" onClick={prevPeriod}><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ minWidth: { xs: 'auto', sm: 200 }, textAlign: 'center', flex: { xs: 1, sm: 'none' } }}>
          {periodTitle}
        </Typography>
        <IconButton size="small" onClick={nextPeriod}><ChevronRightIcon /></IconButton>

        <Box sx={{ flex: 1 }} />

        {/* Toggle Mês / Ano */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600,
              border: '1px solid', borderColor: 'divider', textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
              },
            },
          }}
        >
          <ToggleButton value="month">
            <CalendarMonthIcon sx={{ fontSize: 15, mr: 0.5 }} />
            {!isMobile && 'Mês'}
          </ToggleButton>
          <ToggleButton value="year">
            <ViewModuleIcon sx={{ fontSize: 15, mr: 0.5 }} />
            {!isMobile && 'Ano'}
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Hoje">
          <Button variant="outlined" size="small" onClick={goToday} sx={{ minWidth: 0, px: 1.5 }}>
            Hoje
          </Button>
        </Tooltip>

        {!isMobile && view === 'month' && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openCreate(null)}>
            Novo plantão
          </Button>
        )}
      </Box>

      {/* Resumo mensal */}
      {view === 'month' && activeShifts.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>{activeShifts.length}</strong> plantão{activeShifts.length !== 1 ? 'ões' : ''} em {MONTHS_PT[month]}
          </Typography>
          {totalValue > 0 && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                <strong>{formatCurrency(totalValue)}</strong> previsto
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  )

  /* ── Banner de sync ── */
  const syncBanner = (syncMutation.isPending || syncResult) ? (
    <Box sx={{
      mx: { xs: 2, md: 3 }, mb: 1.5, px: 1.5, py: 1,
      display: 'flex', alignItems: 'center', gap: 1.5,
      borderRadius: '6px', border: '1px solid',
      borderColor: syncMutation.isPending ? 'divider' : 'rgba(20,184,166,0.3)',
      bgcolor: syncMutation.isPending ? 'background.paper' : 'rgba(20,184,166,0.04)',
    }}>
      <SyncIcon
        fontSize="small"
        sx={{
          color: syncMutation.isPending ? 'text.disabled' : 'primary.main',
          animation: syncMutation.isPending ? 'spin 1.2s linear infinite' : 'none',
          '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        }}
      />
      {syncMutation.isPending ? (
        <Typography variant="caption" color="text.secondary">Sincronizando calendários…</Typography>
      ) : (
        <Typography variant="caption" color="primary.main" fontWeight={600}>
          {syncResult?.synced === 0
            ? 'Calendários verificados — nenhuma integração ativa'
            : totalChanges > 0
              ? `${totalChanges} evento${totalChanges !== 1 ? 's' : ''} sincronizado${totalChanges !== 1 ? 's' : ''}`
              : 'Calendário atualizado'}
          {pendingShifts.length > 0 && (
            <Typography component="span" variant="caption" color="warning.main" fontWeight={600}>
              {' '}· {pendingShifts.length} aguardando vinculação
            </Typography>
          )}
        </Typography>
      )}
    </Box>
  ) : null

  /* ════════════════════ VISÃO ANUAL ════════════════════ */
  if (view === 'year') {
    return (
      <Box sx={{ pb: 4 }}>
        {header}
        <Box sx={{ px: { xs: 2, md: 3 }, mt: 1 }}>
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)' }, gap: 2 }}>
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} variant="rounded" height={180} />)}
            </Box>
          ) : (
            <YearCalendar year={year} shifts={shifts} onMonthSelect={handleMonthSelect} />
          )}
        </Box>
      </Box>
    )
  }

  /* ════════════════════ VISÃO MENSAL ════════════════════ */
  return (
    <Box sx={{ pb: 4 }}>
      {header}
      {syncBanner}

      {/* ── Calendário — largura total ── */}
      <Box sx={{ px: { xs: 2, md: 3 }, mb: 3 }}>
        <MonthCalendar
          year={year} month={month}
          shifts={monthShiftsData || []}
          selectedDate={selectedDate}
          onSelectDate={handleDaySelect}
          onShiftClick={handleShiftClick}
        />
      </Box>

      {/* ── 3 Colunas ── */}
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {/* Coluna 1 — Pendentes de vínculo */}
        <ShiftColumn
          title="Pendentes de vínculo"
          accentColor="#f59e0b"
          icon={<LinkIcon fontSize="inherit" />}
          shifts={pendingShifts}
          onShiftClick={handleShiftClick}
          loading={monthLoading}
          emptyMessage="Nenhum evento aguardando vinculação"
        />

        {/* Coluna 2 — Agendados */}
        <ShiftColumn
          title="Agendados"
          accentColor="#0ea5e9"
          icon={<EventIcon fontSize="inherit" />}
          shifts={scheduledShifts}
          onShiftClick={handleShiftClick}
          loading={monthLoading}
          emptyMessage="Nenhum plantão agendado"
        />

        {/* Coluna 3 — Realizados */}
        <ShiftColumn
          title="Realizados"
          accentColor="#10b981"
          icon={<CheckCircleIcon fontSize="inherit" />}
          shifts={completedShifts}
          onShiftClick={handleShiftClick}
          loading={monthLoading}
          emptyMessage="Nenhum plantão realizado"
        />
      </Box>

      {/* FAB mobile */}
      {isMobile && (
        <Fab color="primary" onClick={() => openCreate(selectedDate)} sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1200 }}>
          <AddIcon />
        </Fab>
      )}

      <ShiftDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        shift={editShift}
        initialDate={createDate}
      />
      <ShiftDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        shift={detailShift}
        onEdit={() => openEdit(detailShift)}
      />
    </Box>
  )
}
