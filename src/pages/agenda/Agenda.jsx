import { useState, useMemo } from 'react'
import {
  Box, Typography, IconButton, Button, Chip, Fab,
  Skeleton, useTheme, useMediaQuery, Divider, Tooltip,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon          from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ViewModuleIcon   from '@mui/icons-material/ViewModule'
import SyncIcon         from '@mui/icons-material/Sync'
import { useQuery }     from '@tanstack/react-query'
import { shiftsApi }       from '@/api/shifts'
import { integrationsApi } from '@/api/settings'

import MonthCalendar    from './components/MonthCalendar'
import YearCalendar     from './components/YearCalendar'
import ShiftDrawer      from './components/ShiftDrawer'
import ShiftDetailDrawer from './components/ShiftDetailDrawer'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',  color: 'default' },
  scheduled: { label: 'Agendado', color: 'info' },
  completed: { label: 'Realizado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' },
}

function formatTime(isoStr) {
  if (!isoStr) return null
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(value) {
  if (value == null) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/* ─── Lista lateral / mobile de plantões ─── */
function ShiftList({ shifts, selectedDate, onShiftClick, loading }) {
  const filtered = useMemo(() => {
    if (!selectedDate) return [...shifts].sort(
      (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)
    )
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    return shifts.filter((s) => {
      const dt = new Date(s.start_datetime)
      const sk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      return sk === key
    })
  }, [shifts, selectedDate])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={64} />)}
      </Box>
    )
  }

  if (filtered.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <CalendarTodayIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {selectedDate ? 'Nenhum plantão neste dia' : 'Nenhum plantão neste mês'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {filtered.map((shift) => {
        const status    = STATUS_CONFIG[shift.status] || STATUS_CONFIG.pending
        const startTime = formatTime(shift.start_datetime)
        const endTime   = formatTime(shift.end_datetime)
        const dt        = new Date(shift.start_datetime)

        return (
          <Box
            key={shift.id}
            onClick={() => onShiftClick(shift)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1.5, borderRadius: '6px', border: '1px solid', borderColor: 'divider',
              bgcolor: 'background.paper', cursor: 'pointer',
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'primary.main', bgcolor: '#f0fdfa', transform: 'translateX(2px)' },
            }}
          >
            {/* Barra colorida */}
            <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 4, bgcolor: shift.unit_detail?.color || '#e2e8f0', flexShrink: 0 }} />

            {/* Data compacta (quando mostrando mês todo) */}
            {!selectedDate && (
              <Box sx={{ textAlign: 'center', minWidth: 32, flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', lineHeight: 1 }}>
                  {MONTHS_PT[dt.getMonth()].slice(0, 3)}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {dt.getDate()}
                </Typography>
              </Box>
            )}

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {shift.unit_detail?.name || shift.cal_title || 'Plantão sem unidade'}
              </Typography>
              {startTime && (
                <Typography variant="caption" color="text.secondary">
                  {startTime}{endTime ? ` – ${endTime}` : ''}
                </Typography>
              )}
            </Box>

            {/* Status + valor */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
              <Chip label={status.label} color={status.color} size="small" sx={{ height: 18, fontSize: '0.62rem' }} />
              {shift.effective_value && (
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {formatCurrency(shift.effective_value)}
                </Typography>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

/* ─── Página principal ─── */
export default function Agenda() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  // Eventos do Google Calendar para o mês atual
  const { data: googleEvents = [] } = useQuery({
    queryKey: ['google-events', monthStr],
    queryFn:  () => integrationsApi.googleEvents(monthStr).then(r => r.data),
    enabled:  view === 'month',
    staleTime: 1000 * 60 * 10,   // revalida a cada 10 min
    retry: false,                  // não tentar se não houver integração ativa
  })

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

  /* ── Resumo ── */
  const activeShifts = (view === 'month' ? (monthShiftsData || []) : []).filter(s => s.status !== 'cancelled')
  const totalValue   = activeShifts
    .filter(s => ['scheduled', 'completed'].includes(s.status) && s.effective_value)
    .reduce((sum, s) => sum + parseFloat(s.effective_value || 0), 0)

  /* ── Título do período ── */
  const periodTitle = view === 'year'
    ? String(year)
    : `${MONTHS_PT[month]} ${year}`

  /* ── Header compartilhado ── */
  const header = (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {/* Navegação */}
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
              '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' } },
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

      {/* Resumo mensal (só na visão mensal) */}
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

  /* ── Banner do Google Calendar (só quando há eventos) ── */
  const syncBanner = googleEvents.length > 0 ? (
    <Box sx={{
      mx: { xs: 2, md: 3 }, mb: 2, p: 1.5,
      display: 'flex', alignItems: 'center', gap: 1.5,
      borderRadius: '6px', border: '1px solid',
      borderColor: 'rgba(59,130,246,0.3)',
      bgcolor: 'rgba(59,130,246,0.04)',
    }}>
      <SyncIcon fontSize="small" sx={{ color: '#3b82f6' }} />
      <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
        {googleEvents.length} evento{googleEvents.length !== 1 ? 's' : ''} do Google Calendar sincronizado{googleEvents.length !== 1 ? 's' : ''}
      </Typography>
    </Box>
  ) : null

  /* ═══════════════════════════ VISÃO ANUAL ═══════════════════════════ */
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

  /* ═══════════════════════════ VISÃO MENSAL ═══════════════════════════ */

  // Desktop: calendário (2/3) + lista (1/3)
  if (!isMobile) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {header}
        {syncBanner}

        <Box sx={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', px: 3, pb: 3 }}>
          {/* Calendário */}
          <Box sx={{ flex: 2, overflow: 'auto', pr: 2 }}>
            <MonthCalendar
              year={year} month={month}
              shifts={monthShiftsData || []}
              googleEvents={googleEvents}
              selectedDate={selectedDate}
              onSelectDate={handleDaySelect}
              onShiftClick={handleShiftClick}
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Lista */}
          <Box sx={{ flex: 1, overflow: 'auto', pl: 2, minWidth: 260 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                {selectedDate
                  ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : `Plantões de ${MONTHS_PT[month]}`}
              </Typography>
              {selectedDate && (
                <Button size="small" onClick={() => setSelectedDate(null)} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                  Ver todos
                </Button>
              )}
            </Box>
            <ShiftList
              shifts={monthShiftsData || []}
              selectedDate={selectedDate}
              onShiftClick={handleShiftClick}
              loading={monthLoading}
            />
          </Box>
        </Box>

        <ShiftDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} shift={editShift} initialDate={createDate} />
        <ShiftDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} shift={detailShift} onEdit={() => openEdit(detailShift)} />
      </Box>
    )
  }

  // Mobile: empilhado
  return (
    <Box sx={{ pb: 2 }}>
      {header}
      {syncBanner}

      <Box sx={{ px: 2, mb: 3 }}>
        <MonthCalendar
          year={year} month={month}
          shifts={monthShiftsData || []}
          selectedDate={selectedDate}
          onSelectDate={handleDaySelect}
          onShiftClick={handleShiftClick}
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            {selectedDate
              ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
              : `Plantões de ${MONTHS_PT[month]}`}
          </Typography>
          {selectedDate && (
            <Button size="small" onClick={() => setSelectedDate(null)} sx={{ fontSize: '0.7rem', py: 0.5 }}>
              Ver todos
            </Button>
          )}
        </Box>
        <ShiftList
          shifts={monthShiftsData || []}
          selectedDate={selectedDate}
          onShiftClick={handleShiftClick}
          loading={monthLoading}
        />
      </Box>

      {/* FAB mobile */}
      <Fab color="primary" onClick={() => openCreate(selectedDate)} sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1200 }}>
        <AddIcon />
      </Fab>

      <ShiftDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} shift={editShift} initialDate={createDate} />
      <ShiftDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} shift={detailShift} onEdit={() => openEdit(detailShift)} />
    </Box>
  )
}
