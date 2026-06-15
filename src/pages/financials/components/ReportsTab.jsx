/**
 * ReportsTab — Relatório anual de plantões e pagamentos
 *
 * Exporta para Excel (.xlsx) ou PDF via bibliotecas cliente:
 *   - xlsx (SheetJS) → planilha com 2 abas
 *   - jspdf + jspdf-autotable → PDF formatado
 */
import { useState, useMemo } from 'react'
import {
  Box, Typography, Button, IconButton, Skeleton,
  useTheme, useMediaQuery, Divider, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableFooter,
  Paper, Chip,
} from '@mui/material'
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DownloadIcon     from '@mui/icons-material/Download'
import TableChartIcon   from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CalendarMonthIcon       from '@mui/icons-material/CalendarMonth'
import CheckCircleOutlineIcon  from '@mui/icons-material/CheckCircleOutlined'
import ScheduleIcon            from '@mui/icons-material/Schedule'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ReceiptLongIcon         from '@mui/icons-material/ReceiptLong'

import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/api/financials'

/* ── helpers ─────────────────────────────────────────────────────────────── */
function currency(v) {
  const n = parseFloat(v || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function num(v) { return parseFloat(v || 0) }

/* ── Card de resumo ──────────────────────────────────────────────────────── */
function SummaryCard({ icon, label, value, sub, color = 'text.primary', accent, loading }) {
  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2 },
      borderRadius: '10px',
      border: '1px solid',
      borderColor: accent ? `${accent}33` : 'divider',
      bgcolor: accent ? `${accent}08` : 'background.paper',
      display: 'flex', flexDirection: 'column', gap: 0.5,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: accent || 'text.secondary' }}>
        {icon}
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      {loading
        ? <Skeleton width={100} height={28} />
        : <Typography fontWeight={700} sx={{ color, fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
            {value}
          </Typography>
      }
      {sub && !loading && (
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{sub}</Typography>
      )}
    </Box>
  )
}

/* ── Linha da tabela ─────────────────────────────────────────────────────── */
const cellSx = {
  py: 1, px: { xs: 0.75, sm: 1.5 },
  fontSize: { xs: '0.72rem', sm: '0.78rem' },
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}

// Separador vertical entre grupos (Mês | Plantões | Faturas)
const sepR = { borderRight: '1px solid', borderRightColor: 'divider' }

function MonthRow({ m, isOdd }) {
  const hasShifts = m.shifts_completed + m.shifts_scheduled > 0
  return (
    <TableRow sx={{ bgcolor: isOdd ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
      {/* Mês — separador direito */}
      <TableCell sx={{ ...cellSx, ...sepR, fontWeight: 600 }}>{m.month_name}</TableCell>
      {/* Plantões */}
      <TableCell align="right" sx={cellSx}>
        {m.shifts_completed > 0
          ? <Chip label={m.shifts_completed} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#d1fae5', color: '#065f46' }} />
          : <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>—</Typography>}
      </TableCell>
      <TableCell align="right" sx={cellSx}>
        {m.shifts_scheduled > 0
          ? <Chip label={m.shifts_scheduled} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />
          : <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>—</Typography>}
      </TableCell>
      {/* Valor — separador direito */}
      <TableCell align="right" sx={{ ...cellSx, ...sepR, fontWeight: hasShifts ? 600 : 400, color: hasShifts ? 'text.primary' : 'text.disabled' }}>
        {hasShifts ? currency(m.shifts_value) : '—'}
      </TableCell>
      {/* Faturas */}
      <TableCell align="right" sx={{ ...cellSx, color: num(m.inv_paid) > 0 ? '#065f46' : 'text.disabled', fontWeight: num(m.inv_paid) > 0 ? 600 : 400 }}>
        {num(m.inv_paid) > 0 ? currency(m.inv_paid) : '—'}
      </TableCell>
      <TableCell align="right" sx={{ ...cellSx, color: num(m.inv_issued) + num(m.inv_overdue) > 0 ? 'warning.dark' : 'text.disabled' }}>
        {num(m.inv_issued) + num(m.inv_overdue) > 0 ? currency(num(m.inv_issued) + num(m.inv_overdue)) : '—'}
      </TableCell>
      <TableCell align="right" sx={{ ...cellSx, color: num(m.inv_draft) > 0 ? 'text.secondary' : 'text.disabled' }}>
        {num(m.inv_draft) > 0 ? currency(m.inv_draft) : '—'}
      </TableCell>
    </TableRow>
  )
}

/* ── Export helpers ───────────────────────────────────────────────────────── */
async function exportExcel(year, months, totals) {
  // SheetJS não tem default export no ESM — importar o namespace diretamente
  const XLSX = await import('xlsx')

  // Aba 1 — Resumo mensal
  const header = [
    'Mês',
    'Plantões Realizados', 'Plantões Agendados', 'Valor Plantões',
    'Faturado (Recebido)', 'A Receber', 'Em Rascunho',
  ]
  const rows = months.map(m => [
    m.month_name,
    m.shifts_completed,
    m.shifts_scheduled,
    num(m.shifts_value),
    num(m.inv_paid),
    num(m.inv_issued) + num(m.inv_overdue),
    num(m.inv_draft),
  ])
  const totalRow = [
    'TOTAL',
    totals.shifts_completed,
    totals.shifts_scheduled,
    num(totals.shifts_value),
    num(totals.inv_paid),
    num(totals.inv_issued) + num(totals.inv_overdue),
    num(totals.inv_draft),
  ]

  const wsData = [header, ...rows, [], totalRow]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Largura de colunas
  ws['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }]

  // Aba 2 — Detalhamento por mês (mesmos dados, mais explícito)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Relatório ${year}`)

  XLSX.writeFile(wb, `vitalis-relatorio-${year}.xlsx`)
}

async function exportPDF(year, months, totals) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Cabeçalho
  doc.setFontSize(16)
  doc.setTextColor(15, 118, 110)
  doc.text('Vitalis — Relatório Anual', 14, 18)

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`Ano: ${year}`, 14, 26)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32)

  // Linha separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 36, 283, 36)

  // Resumo rápido
  const t = totals
  const totalFaturado = num(t.inv_paid) + num(t.inv_issued) + num(t.inv_overdue) + num(t.inv_draft)
  const resumoY = 42
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const cols = [
    ['Plantões Realizados', t.shifts_completed],
    ['Plantões Agendados', t.shifts_scheduled],
    ['Valor Total Plantões', currency(t.shifts_value)],
    ['Total Recebido', currency(t.inv_paid)],
    ['A Receber', currency(num(t.inv_issued) + num(t.inv_overdue))],
  ]
  cols.forEach(([label, val], i) => {
    const x = 14 + i * 54
    doc.setFontSize(7.5)
    doc.setTextColor(130, 130, 130)
    doc.text(label, x, resumoY)
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(String(val), x, resumoY + 6)
  })

  // Tabela principal
  autoTable(doc, {
    startY: resumoY + 16,
    head: [[
      'Mês',
      'Realizados', 'Agendados', 'Valor Plantões',
      'Recebido', 'A Receber', 'Rascunho',
    ]],
    body: months.map(m => [
      m.month_name,
      m.shifts_completed || '—',
      m.shifts_scheduled || '—',
      num(m.shifts_value) > 0 ? currency(m.shifts_value) : '—',
      num(m.inv_paid)    > 0 ? currency(m.inv_paid) : '—',
      num(m.inv_issued) + num(m.inv_overdue) > 0 ? currency(num(m.inv_issued) + num(m.inv_overdue)) : '—',
      num(m.inv_draft)   > 0 ? currency(m.inv_draft) : '—',
    ]),
    foot: [[
      'TOTAL',
      totals.shifts_completed,
      totals.shifts_scheduled,
      currency(totals.shifts_value),
      currency(totals.inv_paid),
      currency(num(totals.inv_issued) + num(totals.inv_overdue)),
      currency(totals.inv_draft),
    ]],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 36 },
      4: { halign: 'right', cellWidth: 36 },
      5: { halign: 'right', cellWidth: 36 },
      6: { halign: 'right', cellWidth: 36 },
    },
    margin: { left: 14, right: 14 },
  })

  // Rodapé
  const pageH = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text('Vitalis — Controle de Plantões · Relatório gerado automaticamente', 14, pageH - 6)

  doc.save(`vitalis-relatorio-${year}.pdf`)
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function ReportsTab() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [year, setYear] = useState(new Date().getFullYear())
  const [exporting, setExporting] = useState(null) // 'pdf' | 'xlsx' | null

  const { data, isLoading, isError } = useQuery({
    queryKey: ['annual-report', year],
    queryFn:  () => invoicesApi.annualReport(year),
    select:   (res) => res.data,
    staleTime: 2 * 60 * 1000,
  })

  const months = data?.months || []
  const totals = data?.totals || {}

  /* Cards de resumo */
  const totalShifts = (totals.shifts_completed || 0) + (totals.shifts_scheduled || 0)
  const aReceber    = num(totals.inv_issued) + num(totals.inv_overdue)

  async function handleExport(format) {
    if (!data) return
    setExporting(format)
    try {
      if (format === 'xlsx') await exportExcel(year, months, totals)
      else                   await exportPDF(year, months, totals)
    } catch (err) {
      console.error('Erro ao exportar:', err)
    } finally {
      setExporting(null)
    }
  }

  /* ── Render ── */
  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Cabeçalho: seletor de ano + botões de exportação ── */}
      <Box sx={{
        px: { xs: 2, md: 3 }, py: 2.5,
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        {/* Seletor de ano */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setYear(y => y - 1)} disabled={isLoading}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography fontWeight={700} sx={{ minWidth: 56, textAlign: 'center', fontSize: '1.05rem' }}>
            {year}
          </Typography>
          <IconButton size="small" onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear() || isLoading}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Botões de exportação */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
            disabled={isLoading || !data || exporting === 'xlsx'}
            onClick={() => handleExport('xlsx')}
            sx={{ borderColor: '#16a34a', color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' }, fontSize: '0.78rem' }}
          >
            {exporting === 'xlsx' ? 'Gerando…' : 'Excel'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
            disabled={isLoading || !data || exporting === 'pdf'}
            onClick={() => handleExport('pdf')}
            sx={{ borderColor: '#dc2626', color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' }, fontSize: '0.78rem' }}
          >
            {exporting === 'pdf' ? 'Gerando…' : 'PDF'}
          </Button>
        </Box>
      </Box>

      {/* ── Erro ── */}
      {isError && (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
          <Alert severity="error" sx={{ fontSize: '0.82rem' }}>
            Não foi possível carregar o relatório. Tente novamente.
          </Alert>
        </Box>
      )}

      {/* ── Cards de resumo ── */}
      <Box sx={{
        px: { xs: 2, md: 3 }, pt: 2.5, pb: 2,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: { xs: 1, sm: 1.5 },
      }}>
        <SummaryCard
          icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
          label="Plantões realizados"
          value={isLoading ? '—' : totals.shifts_completed ?? 0}
          loading={isLoading}
          accent="#0d9488"
          color="text.primary"
        />
        <SummaryCard
          icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
          label="Agendados"
          value={isLoading ? '—' : totals.shifts_scheduled ?? 0}
          loading={isLoading}
          accent="#0ea5e9"
          color="text.primary"
        />
        <SummaryCard
          icon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
          label="Valor plantões"
          value={isLoading ? '—' : currency(totals.shifts_value)}
          loading={isLoading}
          accent="#8b5cf6"
          color="text.primary"
        />
        <SummaryCard
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
          label="Total recebido"
          value={isLoading ? '—' : currency(totals.inv_paid)}
          loading={isLoading}
          accent="#10b981"
          color="success.main"
        />
        <SummaryCard
          icon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
          label="A receber"
          value={isLoading ? '—' : currency(aReceber)}
          loading={isLoading}
          accent={aReceber > 0 ? '#f59e0b' : undefined}
          color={aReceber > 0 ? 'warning.dark' : 'text.secondary'}
        />
      </Box>

      <Divider sx={{ mx: { xs: 2, md: 3 } }} />

      {/* ── Tabela mensal ── */}
      <Box sx={{ px: { xs: 1, md: 3 }, pt: 2, overflowX: 'auto' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ px: { xs: 1, md: 0 }, mb: 1.5, fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Detalhamento mensal — {year}
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              {/* Linha 1 — cabeçalhos de grupo */}
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ ...cellSx, ...sepR, borderBottom: '1px solid', borderBottomColor: 'divider' }} />
                <TableCell
                  align="center" colSpan={3}
                  sx={{ ...cellSx, ...sepR, fontWeight: 700, color: '#0d9488', borderBottom: '1px solid', borderBottomColor: 'divider', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  Plantões
                </TableCell>
                <TableCell
                  align="center" colSpan={3}
                  sx={{ ...cellSx, fontWeight: 700, color: '#7c3aed', borderBottom: '1px solid', borderBottomColor: 'divider', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  Faturas
                </TableCell>
              </TableRow>
              {/* Linha 2 — nomes das colunas */}
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ ...cellSx, ...sepR, fontWeight: 700 }}>Mês</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: '#10b981' }}>Realizados</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: '#0ea5e9' }}>Agendados</TableCell>
                <TableCell align="right" sx={{ ...cellSx, ...sepR, fontWeight: 700 }}>Valor</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: '#10b981' }}>Recebido</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: '#f59e0b' }}>A receber</TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: 'text.secondary' }}>Rascunho</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                      {[0,1,2,3,4,5,6].map(j => (
                        <TableCell key={j} sx={cellSx}>
                          <Skeleton width={j === 0 ? 70 : 50} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : months.map((m, i) => (
                    <MonthRow key={m.month} m={m} isOdd={i % 2 !== 0} />
                  ))
              }
            </TableBody>

            {/* Linha de totais */}
            {!isLoading && data && (
              <TableFooter>
                <TableRow sx={{ bgcolor: '#f0fdfa' }}>
                  <TableCell sx={{ ...cellSx, ...sepR, fontWeight: 700, color: '#0d9488', borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    Total {year}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {totals.shifts_completed ?? 0}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {totals.shifts_scheduled ?? 0}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, ...sepR, fontWeight: 700, borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {currency(totals.shifts_value)}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: '#10b981', borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {currency(totals.inv_paid)}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: num(totals.inv_issued) + num(totals.inv_overdue) > 0 ? 'warning.dark' : 'text.disabled', borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {currency(num(totals.inv_issued) + num(totals.inv_overdue))}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontWeight: 700, color: 'text.secondary', borderTop: '2px solid', borderTopColor: '#99f6e4' }}>
                    {currency(totals.inv_draft)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </Paper>

        {/* Legenda */}
        <Box sx={{ mt: 2, px: { xs: 1, md: 0 }, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
            * Plantões considerados: apenas com unidade vinculada (status Agendado ou Realizado).
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
            * Faturas canceladas não são incluídas nos totais de A receber ou Rascunho.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
