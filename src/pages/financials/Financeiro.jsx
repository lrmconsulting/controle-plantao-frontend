import { useState, useMemo } from 'react'
import {
  Box, Typography, IconButton, Button, Chip, Skeleton,
  useTheme, useMediaQuery, CircularProgress,
  Tabs, Tab, Alert, Menu, MenuItem,
} from '@mui/material'
import ChevronLeftIcon          from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon         from '@mui/icons-material/ChevronRight'
import AddIcon                  from '@mui/icons-material/Add'
import ReceiptLongIcon          from '@mui/icons-material/ReceiptLong'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutlined'
import PendingActionsIcon       from '@mui/icons-material/PendingActions'
import CalendarMonthIcon        from '@mui/icons-material/CalendarMonth'
import ScheduleSendIcon         from '@mui/icons-material/ScheduleSend'
import EditIcon                 from '@mui/icons-material/Edit'
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutlined'
import CancelIcon               from '@mui/icons-material/Cancel'
import UndoIcon                 from '@mui/icons-material/Undo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shiftsApi }      from '@/api/shifts'
import { invoicesApi }    from '@/api/financials'
import InvoiceDrawer   from './components/InvoiceDrawer'
import ReceivablesTab  from './components/ReceivablesTab'

/* ─── helpers ─── */
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function currency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const INVOICE_STATUS = {
  draft:     { label: 'Rascunho',   color: 'default' },
  issued:    { label: 'NF emitida', color: 'info' },
  paid:      { label: 'Pago',       color: 'success' },
  overdue:   { label: 'Em atraso',  color: 'error' },
  cancelled: { label: 'Cancelado',  color: 'default' },
}

/* ─── Título de seção ─── */
function SectionTitle({ children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
      <Box sx={{ width: 3, height: 16, borderRadius: '2px', bgcolor: 'primary.main', flexShrink: 0 }} />
      <Typography variant="subtitle1" fontWeight={700}>{children}</Typography>
    </Box>
  )
}

/* ─── Cards de resumo ─── */
function SummaryCard({ icon, label, value, color = 'text.primary', accent, loading }) {
  return (
    <Box sx={{
      p: { xs: '12px 14px', sm: '14px 18px' },
      border: '1px solid', borderColor: 'divider', borderRadius: '8px',
      bgcolor: 'background.paper',
      borderTop: accent ? `3px solid ${accent}` : undefined,
      display: 'flex', flexDirection: 'column', gap: 0.5,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ color: 'text.disabled', display: 'flex', '& svg': { fontSize: '0.9rem' } }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
      </Box>
      {loading
        ? <Skeleton width={72} height={26} />
        : <Typography fontWeight={700} sx={{ color, fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.2 }}>{value}</Typography>
      }
    </Box>
  )
}

/* ─── Linha de consolidado ─── */
function SummaryRow({ item, last }) {
  const isMonthly = item.billing_type === 'monthly'
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr auto auto', sm: '1fr 52px 88px 108px' },
      alignItems: 'center', gap: 1,
      py: 1.25, px: 1.5,
      borderBottom: last ? 'none' : '1px solid', borderColor: 'divider',
      '&:hover': { bgcolor: '#f8fafc' },
    }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{item.unit_name}</Typography>
          {isMonthly && (
            <Chip label="Mensal" size="small" sx={{
              height: 16, fontSize: '0.55rem', fontWeight: 700,
              bgcolor: 'primary.50', color: 'primary.dark',
              borderRadius: '4px', flexShrink: 0,
            }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>{item.institution_name}</Typography>
      </Box>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {isMonthly ? '—' : `${item.shift_count}×`}
      </Typography>
      <Typography variant="caption" color="text.secondary" align="right"
        sx={{ display: { xs: 'none', sm: 'block' }, fontVariantNumeric: 'tabular-nums' }}>
        {isMonthly ? '—' : currency(item.shift_value)}
      </Typography>
      <Typography variant="body2" fontWeight={700} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {currency(item.total_value)}
      </Typography>
    </Box>
  )
}

/* ─── Botão postergar (usa invoiceId) ─── */
function DeferButton({ invoiceId, onDefer, disabled }) {
  const [anchor, setAnchor] = useState(null)
  if (!invoiceId) return null
  return (
    <>
      <Button
        size="small" variant="outlined"
        startIcon={<ScheduleSendIcon sx={{ fontSize: 14 }} />}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={disabled}
        sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'warning.main', color: 'warning.dark' } }}
      >
        Postergar
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 160, borderRadius: '8px' } } }}>
        <MenuItem dense onClick={() => { setAnchor(null); onDefer(invoiceId, 30) }}
          sx={{ fontSize: '0.82rem', gap: 1 }}>
          <ScheduleSendIcon fontSize="small" sx={{ color: 'text.secondary' }} />+30 dias
        </MenuItem>
        <MenuItem dense onClick={() => { setAnchor(null); onDefer(invoiceId, 60) }}
          sx={{ fontSize: '0.82rem', gap: 1 }}>
          <ScheduleSendIcon fontSize="small" sx={{ color: 'text.secondary' }} />+60 dias
        </MenuItem>
      </Menu>
    </>
  )
}

/* ─── Card de fatura — botões por status ─── */
function InvoiceCard({ invoice, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirming, deferring, cancelling, cancellingPayment }) {
  const status   = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.draft
  const isDraft  = invoice.status === 'draft'
  const isIssued = invoice.status === 'issued' || invoice.status === 'overdue'
  const isPaid   = invoice.status === 'paid'

  const bgColor = isPaid ? '#f0fdf4' : isIssued ? '#eff6ff' : '#f8fafc'

  return (
    <Box sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, bgcolor: bgColor, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" fontWeight={700}>{invoice.institution_detail?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{invoice.reference_month_display}</Typography>
        </Box>
        <Chip label={status.label} color={status.color} size="small"
          sx={{ borderRadius: '4px', height: 20, fontSize: '0.62rem', fontWeight: 700 }} />
      </Box>

      {/* Corpo */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap', mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Valor total</Typography>
            <Typography variant="body1" fontWeight={700} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {currency(invoice.total_value)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Plantões</Typography>
            <Typography variant="body2" fontWeight={600}>{invoice.shift_count}</Typography>
          </Box>
          {invoice.nf_number && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">NF nº</Typography>
              <Typography variant="body2" fontWeight={600}>{invoice.nf_number}</Typography>
            </Box>
          )}
          {invoice.expected_payment_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Vencimento previsto</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtDate(invoice.expected_payment_date)}</Typography>
            </Box>
          )}
          {invoice.payment?.received_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Recebido em</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {fmtDate(invoice.payment.received_date)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Ações por status */}
        {(isDraft || isIssued || isPaid) && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 0.875, pt: 1.25, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap',
          }}>
            {/* Grupo esquerdo — ações primárias */}
            <Box sx={{ display: 'flex', gap: 0.875, flexWrap: 'wrap' }}>
              {isDraft && (
                <>
                  <Button size="small" variant="contained" onClick={() => onSetNF(invoice)}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5 }}>
                    Registrar NF
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                    onClick={() => onEdit(invoice)}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5 }}>
                    Editar
                  </Button>
                  <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferring === invoice.id} />
                </>
              )}
              {isIssued && (
                <>
                  <Button size="small" variant="outlined"
                    startIcon={<CancelIcon sx={{ fontSize: 13 }} />}
                    onClick={() => onCancelNF(invoice.id)}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5, borderColor: 'warning.main', color: 'warning.dark', '&:hover': { borderColor: 'warning.dark', bgcolor: 'warning.50' } }}>
                    Cancelar NF
                  </Button>
                  <Button size="small" variant="contained" color="success"
                    startIcon={confirming === invoice.id ? null : <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
                    onClick={() => onConfirmPayment(invoice.id)}
                    disabled={confirming === invoice.id}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5 }}>
                    {confirming === invoice.id ? <CircularProgress size={13} color="inherit" /> : 'Confirmar pagamento'}
                  </Button>
                  <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferring === invoice.id} />
                </>
              )}
              {isPaid && (
                <Button size="small" variant="outlined"
                  startIcon={cancellingPayment === invoice.id ? null : <UndoIcon sx={{ fontSize: 13 }} />}
                  onClick={() => onCancelPayment(invoice.id)}
                  disabled={cancellingPayment === invoice.id}
                  sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'warning.main', color: 'warning.dark' } }}>
                  {cancellingPayment === invoice.id ? <CircularProgress size={13} color="inherit" /> : 'Cancelar pagamento'}
                </Button>
              )}
            </Box>

            {/* Grupo direito — ação destrutiva (somente rascunho) */}
            {isDraft && (
              <Button size="small" variant="outlined" color="error"
                startIcon={cancelling === invoice.id ? null : <DeleteOutlineIcon sx={{ fontSize: 13 }} />}
                onClick={() => onCancel(invoice.id)}
                disabled={cancelling === invoice.id}
                sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.5 }}>
                {cancelling === invoice.id ? <CircularProgress size={13} color="error" /> : 'Cancelar'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

/* ─── Previsão de recebimentos ─── */
function ForecastSection() {
  const { data: forecast, isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn:  () => invoicesApi.forecast(),
    select:   (res) => res.data,
  })

  if (isLoading) return <Skeleton variant="rounded" height={100} />

  if (!forecast?.length) return (
    <Box sx={{ textAlign: 'center', py: 3, border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
      <PendingActionsIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
      <Typography variant="body2" color="text.secondary">Nenhum recebimento previsto</Typography>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {forecast.map((group) => (
        <Box key={group.month} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={700}>{group.month_display}</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">{currency(group.expected_total)}</Typography>
          </Box>
          {(group.payments || []).map((payment, idx, arr) => (
            <Box key={payment.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: idx < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{payment.institution_name || 'Instituição'}</Typography>
                <Typography variant="caption" color="text.secondary">Venc. {fmtDate(payment.expected_date)}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {currency(payment.amount)}
              </Typography>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}

/* ═══════════════════════════ PÁGINA PRINCIPAL ═══════════════════════════ */
export default function Financeiro() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const [activeTab,     setActiveTab]     = useState(0)
  const [drawerMode,    setDrawerMode]    = useState('generate')
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerInvoice, setDrawerInvoice] = useState(null)

  // IDs em operação (loading state por card)
  const [confirmingId,        setConfirmingId]        = useState(null)
  const [deferringId,         setDeferringId]          = useState(null)
  const [cancellingId,        setCancellingId]         = useState(null)
  const [cancellingPaymentId, setCancellingPaymentId]  = useState(null)

  const queryClient = useQueryClient()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['invoices', monthStr] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['forecast'] })
    queryClient.invalidateQueries({ queryKey: ['invoices-timeline'] })
    queryClient.invalidateQueries({ queryKey: ['monthly-summary', monthStr] })
  }

  /* ── Queries ── */
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['monthly-summary', monthStr],
    queryFn:  () => shiftsApi.monthlySummary(monthStr),
    select:   (res) => res.data,
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', monthStr],
    queryFn:  () => invoicesApi.list({ month: monthStr }),
    select:   (res) => res.data.results ?? res.data,
  })

  /* ── Mutations ── */
  const confirmMutation = useMutation({
    mutationFn: (invoiceId) => invoicesApi.confirmPayment(invoiceId),
    onSuccess: () => { setConfirmingId(null); invalidateAll() },
    onError:   () => setConfirmingId(null),
  })

  const cancelNFMutation = useMutation({
    mutationFn: (invoiceId) => invoicesApi.cancelNF(invoiceId),
    onSuccess: () => invalidateAll(),
  })

  const deferMutation = useMutation({
    mutationFn: ({ invoiceId, days }) => invoicesApi.defer(invoiceId, days),
    onSuccess: () => { setDeferringId(null); invalidateAll() },
    onError:   () => setDeferringId(null),
  })

  const cancelMutation = useMutation({
    mutationFn: (invoiceId) => invoicesApi.cancel(invoiceId),
    onSuccess: () => { setCancellingId(null); invalidateAll() },
    onError:   () => setCancellingId(null),
  })

  const cancelPaymentMutation = useMutation({
    mutationFn: (invoiceId) => invoicesApi.cancelPayment(invoiceId),
    onSuccess: () => { setCancellingPaymentId(null); invalidateAll() },
    onError:   () => setCancellingPaymentId(null),
  })

  /* ── Handlers ── */
  function openGenerate()       { setDrawerMode('generate'); setDrawerInvoice(null); setDrawerOpen(true) }
  function handleSetNF(inv)     { setDrawerMode('setNF');    setDrawerInvoice(inv);  setDrawerOpen(true) }
  function handleEdit(inv)      { setDrawerMode('edit');     setDrawerInvoice(inv);  setDrawerOpen(true) }

  function handleConfirmPayment(invoiceId) {
    setConfirmingId(invoiceId)
    confirmMutation.mutate(invoiceId)
  }

  function handleCancelNF(invoiceId) { cancelNFMutation.mutate(invoiceId) }

  function handleDefer(invoiceId, days) {
    setDeferringId(invoiceId)
    deferMutation.mutate({ invoiceId, days })
  }

  function handleCancel(invoiceId) {
    if (!window.confirm('Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.')) return
    setCancellingId(invoiceId)
    cancelMutation.mutate(invoiceId)
  }

  function handleCancelPayment(invoiceId) {
    setCancellingPaymentId(invoiceId)
    cancelPaymentMutation.mutate(invoiceId)
  }

  /* ── Navegação ── */
  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0)  } else setMonth(m => m+1) }

  /* ── Resumo ── */
  const totalPrevisto = useMemo(() => (summary||[]).reduce((s,i) => s + parseFloat(i.total_value||0), 0), [summary])
  const totalFaturado = useMemo(() => (invoices||[]).filter(i=>i.status!=='cancelled').reduce((s,i) => s + parseFloat(i.total_value||0), 0), [invoices])
  const totalRecebido = useMemo(() => (invoices||[]).filter(i=>i.status==='paid').reduce((s,i) => s + parseFloat(i.total_value||0), 0), [invoices])
  const aReceber = totalFaturado - totalRecebido

  /* ── Consolidado agrupado ── */
  const invoicesByInstitution = useMemo(() => {
    const map = {}
    ;(invoices||[]).forEach((inv) => {
      const key = String(inv.institution)
      if (!map[key]) map[key] = []
      map[key].push(inv)
    })
    return map
  }, [invoices])

  const summaryByInstitution = useMemo(() => {
    const map = {}
    ;(summary||[]).forEach((item) => {
      const key = String(item.institution_id)
      if (!map[key]) {
        const instInvoices = invoicesByInstitution[key] || []
        const draftInvoice  = instInvoices.find(i => i.status === 'draft') || null
        const issuedInvoice = instInvoices.find(i => ['issued','paid','overdue'].includes(i.status)) || null
        map[key] = { name: item.institution_name, items: [], total: 0, hasInvoice: instInvoices.length > 0, draftInvoice, issuedInvoice }
      }
      map[key].items.push(item)
      map[key].total += parseFloat(item.total_value||0)
    })
    return Object.values(map)
  }, [summary, invoicesByInstitution])

  /* ════ Blocos ════ */
  const consolidadoBlock = (
    <Box>
      <SectionTitle>Consolidado de plantões</SectionTitle>
      {summaryLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={52} />)}
        </Box>
      ) : summaryByInstitution.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3, border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
          <CalendarMonthIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhum plantão vinculado em {MONTHS_PT[month]}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {summaryByInstitution.map((inst) => (
            <Box key={inst.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Header instituição */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1.25, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{inst.name}</Typography>
                  {inst.draftInvoice && (
                    <Chip label="Rascunho" size="small" color="warning"
                      sx={{ height: 16, fontSize: '0.58rem', borderRadius: '4px', flexShrink: 0 }} />
                  )}
                  {inst.issuedInvoice && !inst.draftInvoice && (
                    <Chip label="NF emitida" size="small" color="info"
                      sx={{ height: 16, fontSize: '0.58rem', borderRadius: '4px', flexShrink: 0 }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {currency(inst.total)}
                  </Typography>
                  {!inst.hasInvoice && (
                    <Button size="small" variant="outlined" onClick={openGenerate}
                      sx={{ borderRadius: '6px', fontSize: '0.65rem', py: 0.25, px: 1, minHeight: 0 }}>
                      Faturar
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Tabela */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto auto', sm: '1fr 52px 88px 108px' }, gap: 1, px: 1.5, py: 0.625, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
                {['Unidade','Qtd','Valor unit.','Total'].map((h, i) => (
                  <Typography key={i} variant="caption" color="text.disabled" fontWeight={700}
                    align={i >= 2 ? 'right' : i===1 ? 'center' : 'left'}
                    sx={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                      display: i===2 ? { xs: 'none', sm: 'block' } : 'block' }}>
                    {h}
                  </Typography>
                ))}
              </Box>
              {inst.items.map((item, idx) => (
                <SummaryRow key={idx} item={item} last={idx === inst.items.length - 1} />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )

  const faturasBlock = (
    <Box>
      <SectionTitle>Faturas de {MONTHS_PT[month]}</SectionTitle>
      {invoicesLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1,2].map(i => <Skeleton key={i} variant="rounded" height={130} />)}
        </Box>
      ) : (invoices||[]).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3, border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
          <ReceiptLongIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhuma fatura para {MONTHS_PT[month]}
          </Typography>
          <Button size="small" variant="text" onClick={openGenerate} sx={{ mt: 0.75, fontSize: '0.75rem' }}>
            Gerar primeira fatura →
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {(invoices||[]).filter(i => i.status !== 'cancelled').map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onSetNF={handleSetNF}
              onCancelNF={handleCancelNF}
              onConfirmPayment={handleConfirmPayment}
              onCancelPayment={handleCancelPayment}
              onDefer={handleDefer}
              onCancel={handleCancel}
              onEdit={handleEdit}
              confirming={confirmingId}
              deferring={deferringId}
              cancelling={cancellingId}
              cancellingPayment={cancellingPaymentId}
            />
          ))}
        </Box>
      )}
    </Box>
  )

  const previsaoBlock = (
    <Box>
      <SectionTitle>Previsão de recebimentos</SectionTitle>
      <ForecastSection />
    </Box>
  )

  /* ════ RENDER ════ */
  return (
    <Box sx={{ pb: 5 }}>

      {/* ── Tabs ── */}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.82rem', fontWeight: 600 } }}>
          <Tab label="Mensal" value={0} />
          <Tab label="Recebíveis" value={1} />
        </Tabs>
      </Box>

      {/* ══ ABA: RECEBÍVEIS ══ */}
      {activeTab === 1 && (
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5 }}>
          <ReceivablesTab />
        </Box>
      )}

      {/* ══ ABA: MENSAL ══ */}
      {activeTab === 0 && (
        <>
          {/* Header */}
          <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon /></IconButton>
              <Typography variant="h6" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>
                {MONTHS_PT[month]} {year}
              </Typography>
              <IconButton size="small" onClick={nextMonth}><ChevronRightIcon /></IconButton>
              <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openGenerate}
                  sx={{ borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  {isMobile ? 'Fatura' : 'Gerar fatura'}
                </Button>
              </Box>
            </Box>

            {/* Cards resumo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: { xs: 1, sm: 1.5 }, mb: 3 }}>
              <SummaryCard icon={<CalendarMonthIcon />} label="Previsto" value={currency(totalPrevisto)} loading={summaryLoading} />
              <SummaryCard icon={<ReceiptLongIcon />} label="Faturado" value={currency(totalFaturado)} color="primary.main" accent="#0d9488" loading={invoicesLoading} />
              <SummaryCard icon={<AccountBalanceWalletIcon />} label="A receber" value={currency(aReceber)} color={aReceber > 0 ? 'warning.dark' : 'text.secondary'} accent={aReceber > 0 ? '#f59e0b' : undefined} loading={invoicesLoading} />
              <SummaryCard icon={<CheckCircleOutlineIcon />} label="Recebido" value={currency(totalRecebido)} color="success.main" accent="#10b981" loading={invoicesLoading} />
            </Box>
          </Box>

          {/* Conteúdo principal: 3 colunas */}
          <Box sx={{ px: { xs: 2, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: { xs: 3, lg: 2.5 }, alignItems: 'start' }}>
            {consolidadoBlock}
            {faturasBlock}
            {previsaoBlock}
          </Box>

          <InvoiceDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            mode={drawerMode}
            invoice={drawerInvoice}
            initialMonth={monthStr}
          />
        </>
      )}
    </Box>
  )
}
