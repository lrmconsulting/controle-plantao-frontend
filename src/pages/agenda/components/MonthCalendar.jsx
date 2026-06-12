import { useMemo } from 'react'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'

// Semana começa na Segunda (como no exemplo)
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/**
 * Converte hex #rrggbb → rgba(r,g,b,alpha)
 */
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(148,163,184,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Retorna todas as semanas do mês, incluindo dias do mês anterior/seguinte
 * para completar linhas de 7. Semana começa na segunda-feira.
 */
function buildCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  // Offset: quanto dias da semana anterior preencher (0 = segunda)
  const offset = (firstDay.getDay() + 6) % 7

  const weeks = []
  let week = []

  // Dias do mês anterior
  for (let i = offset - 1; i >= 0; i--) {
    week.push({ date: new Date(year, month, -i), isCurrentMonth: false })
  }

  // Dias do mês atual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push({ date: new Date(year, month, d), isCurrentMonth: true })
    if (week.length === 7) { weeks.push(week); week = [] }
  }

  // Dias do próximo mês
  if (week.length > 0) {
    let nd = 1
    while (week.length < 7) {
      week.push({ date: new Date(year, month + 1, nd++), isCurrentMonth: false })
    }
    weeks.push(week)
  }

  return weeks
}

function dateKey(date) {
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Extrai a chave de data (YYYY-MM-DD) de um start_datetime vindo da API.
 * Converte para horário LOCAL do browser para que plantões noturnos (ex: 22h em
 * UTC-3 → 01h UTC do dia seguinte) apareçam no dia correto no calendário.
 */
function shiftDateKey(isoStr) {
  if (!isoStr) return null
  const dt = new Date(isoStr)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function groupShiftsByDate(shifts) {
  const map = {}
  shifts.forEach((s) => {
    const k = shiftDateKey(s.start_datetime)
    if (!k) return
    if (!map[k]) map[k] = []
    map[k].push(s)
  })
  return map
}

/** Extrai YYYY-MM-DD de um evento Google (pode ser dateTime ISO ou date string) */
function googleEventDateKey(event) {
  const raw = event.start || ''
  // all-day: "2026-05-22"  |  timed: "2026-05-22T10:00:00Z"
  return raw.startsWith('{') ? null : raw.slice(0, 10)
}

function groupGoogleEventsByDate(events) {
  const map = {}
  events.forEach((e) => {
    const k = googleEventDateKey(e)
    if (!k) return
    if (!map[k]) map[k] = []
    map[k].push(e)
  })
  return map
}

function formatGoogleTime(isoStr) {
  if (!isoStr || isoStr.length === 10) return null   // all-day
  const dt = new Date(isoStr)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function formatTime(isoStr) {
  if (!isoStr) return null
  const dt = new Date(isoStr)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export default function MonthCalendar({
  year, month, shifts = [], selectedDate, onSelectDate, onShiftClick,
}) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const weeks        = useMemo(() => buildCalendarWeeks(year, month), [year, month])
  const shiftsByDate = useMemo(() => groupShiftsByDate(shifts), [shifts])

  const todayKey    = dateKey(new Date())
  const selectedKey = selectedDate ? dateKey(selectedDate) : null

  // Altura de célula responsiva
  const CELL_H    = isMobile ? 64 : isTablet ? 90 : 120
  const MAX_CHIPS = isMobile ? 1 : isTablet ? 2 : 3

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Cabeçalho dos dias da semana ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          bgcolor: '#f8fafc',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {WEEKDAYS.map((wd, i) => (
          <Typography
            key={i}
            align="center"
            sx={{
              py: 1.25,
              fontSize: isMobile ? '0.62rem' : '0.72rem',
              fontWeight: 700,
              color: i >= 5 ? 'text.disabled' : 'text.secondary',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRight: i < 6 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {wd}
          </Typography>
        ))}
      </Box>

      {/* ── Semanas ── */}
      {weeks.map((week, wi) => (
        <Box
          key={wi}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: wi < weeks.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          {week.map(({ date, isCurrentMonth }, di) => {
            const key       = dateKey(date)
            const dayShifts = (shiftsByDate[key] || [])
            const isToday   = key === todayKey
            const isSel     = key === selectedKey
            const isWeekend = di >= 5 // Sáb (5) e Dom (6)

            return (
              <Box
                key={di}
                onClick={() => onSelectDate(date)}
                sx={{
                  // Altura FIXA — impede que chips expandam a linha da grade
                  height: CELL_H,
                  overflow: 'hidden',
                  // minWidth: 0 é crítico em CSS Grid para não expandir a coluna
                  minWidth: 0,
                  p: isMobile ? '4px 4px' : '8px 8px',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRight: di < 6 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: isSel
                    ? '#f0fdfa'
                    : isToday
                    ? '#fffbeb'
                    : isWeekend && isCurrentMonth
                    ? '#fafafa'
                    : 'background.paper',
                  transition: 'background-color 0.12s',
                  '&:hover': { bgcolor: '#f0fdfa' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                {/* Número do dia */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: isMobile ? 0 : '2px' }}>
                  <Box
                    sx={{
                      width: isToday ? (isMobile ? 20 : 26) : 'auto',
                      height: isToday ? (isMobile ? 20 : 26) : 'auto',
                      borderRadius: '50%',
                      bgcolor: isToday ? 'primary.main' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: isMobile ? '0.7rem' : '0.82rem',
                        fontWeight: isToday ? 700 : isCurrentMonth ? 500 : 400,
                        color: isToday
                          ? 'white'
                          : !isCurrentMonth
                          ? 'text.disabled'
                          : isWeekend
                          ? 'text.secondary'
                          : 'text.primary',
                        lineHeight: 1,
                        px: isToday ? 0 : '2px',
                      }}
                    >
                      {date.getDate()}
                    </Typography>
                  </Box>
                </Box>

                {/* Eventos/plantões do dia */}
                {dayShifts.slice(0, MAX_CHIPS).map((shift) => {
                  const isPending = shift.status === 'pending'
                  const color     = isPending ? '#f59e0b' : (shift.unit_detail?.color || '#94a3b8')
                  const startTime = formatTime(shift.start_datetime)
                  const endTime   = formatTime(shift.end_datetime)
                  const timeStr   = startTime
                    ? (endTime ? `${startTime}-${endTime}` : startTime)
                    : null
                  const label = isPending
                    ? (shift.cal_title || 'Sem unidade')
                    : (shift.unit_detail?.name || shift.cal_title || 'Plantão')

                  return (
                    <Box
                      key={shift.id}
                      onClick={(e) => { e.stopPropagation(); onShiftClick(shift) }}
                      title={label}
                      sx={{
                        bgcolor: isPending ? 'rgba(245,158,11,0.08)' : hexToRgba(color, 0.13),
                        borderLeft: `3px ${isPending ? 'dashed' : 'solid'} ${color}`,
                        borderRadius: '0 3px 3px 0',
                        px: '6px',
                        py: '3px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        minWidth: 0,
                        width: '100%',
                        transition: 'all 0.1s',
                        '&:hover': {
                          bgcolor: isPending ? 'rgba(245,158,11,0.18)' : hexToRgba(color, 0.25),
                          transform: 'scale(1.01)',
                        },
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          fontSize: isMobile ? '0.6rem' : '0.7rem',
                          fontWeight: isPending ? 500 : 700,
                          fontStyle: isPending ? 'italic' : 'normal',
                          color,
                          lineHeight: 1.3,
                        }}
                      >
                        {label}
                      </Typography>
                      {!isMobile && timeStr && (
                        <Typography
                          noWrap
                          sx={{
                            fontSize: '0.62rem',
                            color: isPending ? 'rgba(245,158,11,0.8)' : hexToRgba(color, 0.8),
                            lineHeight: 1.2,
                          }}
                        >
                          {timeStr}
                        </Typography>
                      )}
                    </Box>
                  )
                })}

                {/* Overflow */}
                {dayShifts.length > MAX_CHIPS && (
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      px: '6px',
                      lineHeight: 1.4,
                    }}
                  >
                    +{dayShifts.length - MAX_CHIPS} mais
                  </Typography>
                )}

                {/* Indicador de seleção */}
                {isSel && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: 'inherit',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
