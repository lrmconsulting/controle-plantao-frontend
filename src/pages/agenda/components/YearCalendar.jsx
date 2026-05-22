import { useMemo } from 'react'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
// Semana começa na segunda (igual ao mensal)
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function buildCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const offset   = (firstDay.getDay() + 6) % 7  // 0=Seg, 6=Dom
  const weeks = []
  let week = []

  // Padding inicial (dias do mês anterior — null)
  for (let i = 0; i < offset; i++) week.push(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function dateKey(date) {
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function groupShiftsByDate(shifts) {
  const map = {}
  shifts.forEach((s) => {
    const k = dateKey(new Date(s.start_datetime))
    if (!map[k]) map[k] = []
    map[k].push(s)
  })
  return map
}

/* ── Mini-mês ── */
function MiniMonth({ year, month, shiftsByDate, onSelect, todayKey, isCurrentMonth }) {
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month])

  const monthShiftCount = useMemo(() => {
    let count = 0
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const k = dateKey(new Date(year, month, d))
      count += (shiftsByDate[k] || []).filter(s => s.status !== 'cancelled').length
    }
    return count
  }, [year, month, shiftsByDate])

  return (
    <Box
      onClick={() => onSelect(month)}
      sx={{
        border: '1px solid',
        borderColor: isCurrentMonth ? 'primary.main' : 'divider',
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        boxShadow: isCurrentMonth
          ? '0 0 0 1px #0d9488, 0 2px 8px rgba(13,148,136,0.12)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 0 0 1px #0d9488, 0 4px 12px rgba(13,148,136,0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Cabeçalho do mini-mês */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.25,
          py: 0.875,
          bgcolor: isCurrentMonth ? '#f0fdfa' : '#f8fafc',
          borderBottom: '1px solid',
          borderColor: isCurrentMonth ? 'rgba(13,148,136,0.2)' : 'divider',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: isCurrentMonth ? 'primary.main' : 'text.primary',
            letterSpacing: '0.02em',
          }}
        >
          {MONTHS_PT[month]}
        </Typography>
        {monthShiftCount > 0 && (
          <Box
            sx={{
              bgcolor: isCurrentMonth ? 'primary.main' : '#e2e8f0',
              color: isCurrentMonth ? 'white' : 'text.secondary',
              borderRadius: '4px',
              px: 0.75,
              fontSize: '0.58rem',
              fontWeight: 700,
              lineHeight: 1.7,
            }}
          >
            {monthShiftCount}
          </Box>
        )}
      </Box>

      {/* Cabeçalho dos dias da semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa',
        }}
      >
        {WEEKDAYS.map((wd, i) => (
          <Typography
            key={i}
            align="center"
            sx={{
              fontSize: '0.52rem',
              fontWeight: 700,
              color: 'text.disabled',
              py: '3px',
              borderRight: i < 6 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            {wd}
          </Typography>
        ))}
      </Box>

      {/* Semanas */}
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
          {week.map((date, di) => {
            const key       = dateKey(date)
            const dayShifts = key ? (shiftsByDate[key] || []).filter(s => s.status !== 'cancelled') : []
            const isToday   = key === todayKey
            // Pega até 3 cores únicas de unidades para os dots
            const dotColors = [...new Map(
              dayShifts.map(s => [s.unit_detail?.color || '#94a3b8', s.unit_detail?.color || '#94a3b8'])
            ).values()].slice(0, 3)

            return (
              <Box
                key={di}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: '3px',
                  borderRight: di < 6 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: isToday ? '#fffbeb' : 'transparent',
                  minHeight: 26,
                  gap: '2px',
                }}
              >
                {date ? (
                  <>
                    {/* Número */}
                    <Box
                      sx={{
                        width: isToday ? 16 : 'auto',
                        height: isToday ? 16 : 'auto',
                        borderRadius: '50%',
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        align="center"
                        sx={{
                          fontSize: '0.56rem',
                          fontWeight: isToday ? 700 : dayShifts.length > 0 ? 600 : 400,
                          color: isToday
                            ? 'white'
                            : dayShifts.length > 0
                            ? 'text.primary'
                            : 'text.disabled',
                          lineHeight: 1,
                        }}
                      >
                        {date.getDate()}
                      </Typography>
                    </Box>

                    {/* Dots de plantões */}
                    {dotColors.length > 0 && (
                      <Box sx={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {dotColors.map((color, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: dotColors.length === 1 ? 10 : 4,
                              height: 3,
                              borderRadius: '2px',
                              bgcolor: color,
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                ) : null}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}

/* ── Grade anual ── */
export default function YearCalendar({ year, shifts = [], onMonthSelect }) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const shiftsByDate = useMemo(() => groupShiftsByDate(shifts), [shifts])
  const todayKey     = dateKey(new Date())
  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const cols = isMobile ? 2 : isTablet ? 3 : 4

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {Array.from({ length: 12 }, (_, m) => (
        <MiniMonth
          key={m}
          year={year}
          month={m}
          shiftsByDate={shiftsByDate}
          onSelect={onMonthSelect}
          todayKey={todayKey}
          isCurrentMonth={year === currentYear && m === currentMonth}
        />
      ))}
    </Box>
  )
}
