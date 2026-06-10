import { useState, useEffect, Fragment } from 'react'
import {
  Box, Typography, Button, Chip, Skeleton, Collapse,
  IconButton, CircularProgress, ToggleButtonGroup, ToggleButton,
  Menu, MenuItem,
} from '@mui/material'
import ExpandMoreIcon              from '@mui/icons-material/ExpandMore'
import ExpandLessIcon              from '@mui/icons-material/ExpandLess'
import PictureAsPdfIcon            from '@mui/icons-material/PictureAsPdf'
import CheckCircleOutlinedIcon     from '@mui/icons-material/CheckCircleOutlined'
import ChevronLeftIcon             from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon            from '@mui/icons-material/ChevronRight'
import ReceiptLongIcon             from '@mui/icons-material/ReceiptLong'
import AssignmentTurnedInIcon      from '@mui/icons-material/AssignmentTurnedIn'
import AccountBalanceWalletIcon    from '@mui/icons-material/AccountBalanceWallet'
import ViewColumnIcon              from '@mui/icons-material/ViewColumn'
import FormatListBulletedIcon      from '@mui/icons-material/FormatListBulleted'
import WarningAmberIcon            from '@mui/icons-material/WarningAmber'
import ScheduleSendIcon            from '@mui/icons-material/ScheduleSend'
import EditIcon                    from '@mui/icons-material/Edit'
import DeleteOutlineIcon           from '@mui/icons-material/DeleteOutlined'
import CancelIcon                  from '@mui/icons-material/Cancel'
import UndoIcon                    from '@mui/icons-material/Undo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/financials'
import InvoiceDrawer from './InvoiceDrawer'

/* ─── helpers ─── */
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_CONFIG = {
  draft:     { label: 'Rascunho',   color: 'default' },
  issued:    { label: 'NF emitida', color: 'info' },
  paid:      { label: 'Pago',       color: 'success' },
  overdue:   { label: 'Em atraso',  color: 'error' },
  cancelled: { label: 'Cancelado',  color: 'default' },
}

const STATUS_ACCENT = {
  draft:     '#94a3b8',
  issued:    '#2563eb',
  paid:      '#16a34a',
  overdue:   '#dc2626',
  cancelled: '#94a3b8',
}

function currency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function fmtDatetime(isoStr) {
  if (!isoStr) return '—'
  const dt  = new Date(isoStr)
  const d   = String(dt.getDate()).padStart(2, '0')
  const mo  = String(dt.getMonth() + 1).padStart(2, '0')
  const h   = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${d}/${mo} ${h}:${min}`
}

function formatMonthKey(monthKey) {
  const [year, m] = monthKey.split('-')
  return `${MONTHS_PT[parseInt(m) - 1]} de ${year}`
}

/* ════════════════════════════════════════════
   PIPELINE VIEW — 3 colunas kanban
═══════════════════════════════════════════ */

/** Botão de postergação (usa invoiceId) */
function DeferButton({ invoiceId, onDefer, disabled }) {
  const [anchor, setAnchor] = useState(null)
  if (!invoiceId) return null
  return (
    <>
      <Button size="small" variant="outlined"
        startIcon={<ScheduleSendIcon sx={{ fontSize: 12 }} />}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={disabled}
        sx={{ fontSize: '0.65rem', py: 0.3, px: 1, borderRadius: '6px', minHeight: 0, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'warning.main', color: 'warning.dark' } }}>
        Postergar
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 140, borderRadius: '8px' } } }}>
        <MenuItem dense onClick={() => { setAnchor(null); onDefer(invoiceId, 30) }}
          sx={{ fontSize: '0.8rem', gap: 1 }}>
          <ScheduleSendIcon fontSize="small" sx={{ color: 'text.secondary' }} />+30 dias
        </MenuItem>
        <MenuItem dense onClick={() => { setAnchor(null); onDefer(invoiceId, 60) }}
          sx={{ fontSize: '0.8rem', gap: 1 }}>
          <ScheduleSendIcon fontSize="small" sx={{ color: 'text.secondary' }} />+60 dias
        </MenuItem>
      </Menu>
    </>
  )
}

/** Card compacto para o kanban */
function PipelineCard({ invoice, last, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }) {
  const isDraft  = invoice.status === 'draft'
  const isIssued = invoice.status === 'issued' || invoice.status === 'overdue'
  const isPaid   = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  return (
    <Box sx={{ px: 1.75, py: 1.25, borderBottom: last ? 'none' : '1px solid', borderColor: 'divider', '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.15s' }}>
      {/* Linha principal */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>
            {invoice.institution_detail?.name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            {invoice.reference_month_display}
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} color="primary.main"
          sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0, lineHeight: 1.3 }}>
          {currency(invoice.total_value)}
        </Typography>
      </Box>

      {/* Metadados */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
        {invoice.nf_number && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            NF {invoice.nf_number}
          </Typography>
        )}
        {isOverdue && invoice.expected_payment_date && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <WarningAmberIcon sx={{ fontSize: '0.75rem', color: 'error.main' }} />
            <Typography variant="caption" color="error.main" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
              Venc. {fmtDate(invoice.expected_payment_date)}
            </Typography>
          </Box>
        )}
        {!isOverdue && invoice.expected_payment_date && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Venc. {fmtDate(invoice.expected_payment_date)}
          </Typography>
        )}
        {invoice.payment?.received_date && (
          <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
            ✓ {fmtDate(invoice.payment.received_date)}
          </Typography>
        )}
      </Box>

      {/* Ações */}
      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {isDraft && (
          <>
            <Button size="small" variant="outlined" onClick={() => onSetNF(invoice)}
              sx={{ fontSize: '0.65rem', py: 0.3, px: 1, borderRadius: '6px', minHeight: 0 }}>
              Registrar NF
            </Button>
            <IconButton size="small" onClick={() => onEdit(invoice)} title="Editar plantões"
              sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: '6px' }}>
              <EditIcon sx={{ fontSize: '0.85rem' }} />
            </IconButton>
            <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferringId === invoice.id} />
            <IconButton size="small" onClick={() => onCancel(invoice.id)} title="Excluir fatura"
              disabled={cancellingId === invoice.id}
              sx={{ p: 0.5, border: '1px solid', borderColor: 'error.200', borderRadius: '6px', color: 'error.main', '&:hover': { bgcolor: 'error.50' } }}>
              {cancellingId === invoice.id ? <CircularProgress size={12} color="error" /> : <DeleteOutlineIcon sx={{ fontSize: '0.85rem' }} />}
            </IconButton>
          </>
        )}
        {isIssued && (
          <>
            <Button size="small" variant="outlined"
              startIcon={<CancelIcon sx={{ fontSize: 11 }} />}
              onClick={() => onCancelNF(invoice.id)}
              sx={{ fontSize: '0.65rem', py: 0.3, px: 1, borderRadius: '6px', minHeight: 0, borderColor: 'warning.main', color: 'warning.dark', '&:hover': { borderColor: 'warning.dark', bgcolor: 'warning.50' } }}>
              Cancelar NF
            </Button>
            <Button size="small" variant="contained" color="success"
              startIcon={confirmingId === invoice.id ? null : <CheckCircleOutlinedIcon sx={{ fontSize: '0.8rem !important' }} />}
              onClick={() => onConfirmPayment(invoice.id)}
              disabled={confirmingId === invoice.id}
              sx={{ fontSize: '0.65rem', py: 0.3, px: 1, borderRadius: '6px', minHeight: 0 }}>
              {confirmingId === invoice.id ? <CircularProgress size={12} color="inherit" /> : 'Confirmar'}
            </Button>
            <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferringId === invoice.id} />
          </>
        )}
        {isPaid && (
          <Button size="small" variant="outlined"
            startIcon={cancellingPaymentId === invoice.id ? null : <UndoIcon sx={{ fontSize: 11 }} />}
            onClick={() => onCancelPayment(invoice.id)}
            disabled={cancellingPaymentId === invoice.id}
            sx={{ fontSize: '0.65rem', py: 0.3, px: 1, borderRadius: '6px', minHeight: 0, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'warning.main', color: 'warning.dark' } }}>
            {cancellingPaymentId === invoice.id ? <CircularProgress size={12} color="inherit" /> : 'Cancelar pagamento'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

/** Coluna do kanban */
function PipelineColumn({ title, icon, accentColor, bgColor, invoices, emptyMessage, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }) {
  const total = invoices.reduce((s, inv) => s + parseFloat(inv.total_value || 0), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 180 }}>
      {/* Header da coluna */}
      <Box sx={{ px: 1.75, py: 1.25, bgcolor: bgColor, borderRadius: '8px 8px 0 0', border: '1px solid', borderColor: 'divider', borderBottom: 'none', borderTop: `3px solid ${accentColor}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <Box sx={{ color: accentColor, display: 'flex', '& svg': { fontSize: '1rem' } }}>{icon}</Box>
          <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{title}</Typography>
          <Chip label={invoices.length} size="small"
            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', bgcolor: accentColor + '20', color: accentColor }} />
        </Box>
        <Typography variant="body1" fontWeight={800} sx={{ color: accentColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {currency(total)}
        </Typography>
      </Box>

      {/* Corpo */}
      <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: '0 0 8px 8px', bgcolor: 'background.paper', overflow: 'hidden' }}>
        {invoices.length === 0 ? (
          <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>{emptyMessage}</Typography>
          </Box>
        ) : (
          invoices.map((inv, idx) => (
            <PipelineCard
              key={inv.id}
              invoice={inv}
              last={idx === invoices.length - 1}
              onSetNF={onSetNF}
              onCancelNF={onCancelNF}
              onConfirmPayment={onConfirmPayment}
              onCancelPayment={onCancelPayment}
              onDefer={onDefer}
              onCancel={onCancel}
              onEdit={onEdit}
              confirmingId={confirmingId}
              cancellingId={cancellingId}
              deferringId={deferringId}
              cancellingPaymentId={cancellingPaymentId}
            />
          ))
        )}
      </Box>
    </Box>
  )
}

/** View pipeline completa */
function PipelineView({ timeline, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }) {
  const allInvoices = (timeline || []).flatMap(g => g.invoices || [])

  const draftInvoices  = allInvoices.filter(inv => inv.status === 'draft')
  const issuedInvoices = allInvoices.filter(inv => inv.status === 'issued' || inv.status === 'overdue')
  const paidInvoices   = allInvoices.filter(inv => inv.status === 'paid')

  const sharedProps = { onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'start' }}>
      <PipelineColumn
        title="Faturas geradas" icon={<ReceiptLongIcon />}
        accentColor="#64748b" bgColor="#f8fafc"
        invoices={draftInvoices}
        emptyMessage="Nenhuma fatura aguardando emissão de NF"
        {...sharedProps}
      />
      <PipelineColumn
        title="NF emitidas" icon={<AssignmentTurnedInIcon />}
        accentColor="#2563eb" bgColor="#eff6ff"
        invoices={issuedInvoices}
        emptyMessage="Nenhuma NF aguardando confirmação de pagamento"
        {...sharedProps}
      />
      <PipelineColumn
        title="Valor recebido" icon={<AccountBalanceWalletIcon />}
        accentColor="#16a34a" bgColor="#f0fdf4"
        invoices={paidInvoices}
        emptyMessage="Nenhum pagamento recebido neste período"
        {...sharedProps}
      />
    </Box>
  )
}

/* ════════════════════════════════════════════
   TIMELINE VIEW — grupos por mês
═══════════════════════════════════════════ */

const PIPELINE_STEPS = [
  { key: 'draft',  label: 'Gerada' },
  { key: 'issued', label: 'NF emitida' },
  { key: 'paid',   label: 'Pago' },
]

function getPipelineStep(status) {
  if (status === 'paid')   return 2
  if (status === 'issued') return 1
  return 0
}

function StatusPipeline({ status }) {
  if (status === 'cancelled') return null
  const currentStep = getPipelineStep(status)
  const isOverdue   = status === 'overdue'

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {PIPELINE_STEPS.map((step, idx) => (
        <Fragment key={step.key}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: 54 }}>
            <Box sx={{
              width: 12, height: 12, borderRadius: '50%', mt: '2px',
              bgcolor: idx < currentStep ? 'success.main'
                : idx === currentStep ? (isOverdue ? 'error.main' : 'primary.main')
                : 'transparent',
              border: '2px solid',
              borderColor: idx < currentStep ? 'success.main'
                : idx === currentStep ? (isOverdue ? 'error.main' : 'primary.main')
                : '#cbd5e1',
            }} />
            <Typography sx={{
              fontSize: '0.56rem',
              fontWeight: idx === currentStep ? 700 : 400,
              color: idx < currentStep ? 'success.main'
                : idx === currentStep ? (isOverdue ? 'error.main' : 'primary.main')
                : 'text.disabled',
              whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.2,
            }}>
              {step.label}
            </Typography>
          </Box>
          {idx < PIPELINE_STEPS.length - 1 && (
            <Box sx={{ flex: 1, height: 2, mt: '7px', mx: '3px', bgcolor: idx < currentStep ? 'success.main' : '#e2e8f0', minWidth: 12 }} />
          )}
        </Fragment>
      ))}
    </Box>
  )
}

function InvoiceCard({ invoice, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }) {
  const [expanded, setExpanded] = useState(false)
  const status    = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft
  const accent    = STATUS_ACCENT[invoice.status] || '#94a3b8'
  const isDraft   = invoice.status === 'draft'
  const isIssued  = invoice.status === 'issued' || invoice.status === 'overdue'
  const isPaid    = invoice.status === 'paid'
  const shifts    = invoice.invoice_shifts || []

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ borderLeft: `4px solid ${accent}`, px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {invoice.institution_detail?.name || '—'}
            </Typography>
            <Chip label={status.label} color={status.color} size="small"
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px' }} />
          </Box>
          <StatusPipeline status={invoice.status} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Valor</Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
          {invoice.issue_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Emissão</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtDate(invoice.issue_date)}</Typography>
            </Box>
          )}
          {invoice.expected_payment_date && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Vencimento</Typography>
              <Typography variant="body2" fontWeight={600}
                sx={{ color: invoice.status === 'overdue' ? 'error.main' : 'text.primary' }}>
                {fmtDate(invoice.expected_payment_date)}
              </Typography>
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
      </Box>

      {/* Footer com ações */}
      <Box sx={{ px: 2, py: '8px', bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {shifts.length > 0 && (
          <Button size="small" variant="text" color="inherit"
            startIcon={expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            onClick={() => setExpanded(e => !e)}
            sx={{ fontSize: '0.7rem', py: 0.25, color: 'text.secondary' }}>
            {shifts.length} plant{shifts.length !== 1 ? 'ões' : 'ão'}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />

        {isDraft && (
          <>
            <Button size="small" variant="outlined" onClick={() => onSetNF(invoice)}
              sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4 }}>
              Registrar NF
            </Button>
            <Button size="small" variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: '0.85rem' }} />}
              onClick={() => onEdit(invoice)}
              sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4 }}>
              Editar
            </Button>
            <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferringId === invoice.id} />
            <Button size="small" variant="outlined" color="error"
              startIcon={cancellingId === invoice.id ? null : <DeleteOutlineIcon sx={{ fontSize: '0.85rem' }} />}
              onClick={() => onCancel(invoice.id)}
              disabled={cancellingId === invoice.id}
              sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4 }}>
              {cancellingId === invoice.id ? <CircularProgress size={13} color="error" /> : 'Cancelar'}
            </Button>
          </>
        )}
        {isIssued && (
          <>
            <Button size="small" variant="outlined"
              startIcon={<CancelIcon sx={{ fontSize: '0.8rem' }} />}
              onClick={() => onCancelNF(invoice.id)}
              sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4, borderColor: 'warning.main', color: 'warning.dark', '&:hover': { borderColor: 'warning.dark', bgcolor: 'warning.50' } }}>
              Cancelar NF
            </Button>
            <Button size="small" variant="contained" color="success"
              onClick={() => onConfirmPayment(invoice.id)}
              disabled={confirmingId === invoice.id}
              startIcon={confirmingId === invoice.id ? null : <CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
              sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4 }}>
              {confirmingId === invoice.id ? <CircularProgress size={14} color="inherit" /> : 'Confirmar pagamento'}
            </Button>
            <DeferButton invoiceId={invoice.id} onDefer={onDefer} disabled={deferringId === invoice.id} />
          </>
        )}
        {isPaid && (
          <Button size="small" variant="outlined"
            startIcon={cancellingPaymentId === invoice.id ? null : <UndoIcon sx={{ fontSize: '0.8rem' }} />}
            onClick={() => onCancelPayment(invoice.id)}
            disabled={cancellingPaymentId === invoice.id}
            sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.4, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'warning.main', color: 'warning.dark' } }}>
            {cancellingPaymentId === invoice.id ? <CircularProgress size={14} color="inherit" /> : 'Cancelar pagamento'}
          </Button>
        )}
      </Box>

      {/* Lista de plantões */}
      <Collapse in={expanded}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '8px 1fr 1fr auto', alignItems: 'center', gap: 1.5, px: 2, py: '6px', bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
            {['', 'Data / Horário', 'Unidade', 'Valor'].map((h, i) => (
              <Typography key={i} variant="caption" color="text.disabled"
                sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i === 3 ? 'right' : 'left' }}>
                {h}
              </Typography>
            ))}
          </Box>
          {shifts.map((is, idx) => {
            const endTime = is.shift_end_date
              ? new Date(is.shift_end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : null
            return (
              <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '8px 1fr 1fr auto', alignItems: 'center', gap: 1.5, px: 2, py: '8px', borderBottom: idx < shifts.length - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: '#f8fafc' } }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: is.unit_color || '#94a3b8', flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                  {fmtDatetime(is.shift_date)}{endTime ? ` – ${endTime}` : ''}
                </Typography>
                <Typography variant="caption" noWrap>{is.unit_name}</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', flexShrink: 0 }}>
                  {currency(is.value)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Collapse>
    </Box>
  )
}

function MonthGroup({ group, onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }) {
  const billed   = parseFloat(group.total_billed   || 0)
  const received = parseFloat(group.total_received || 0)
  const pending  = parseFloat(group.total_pending  || 0)

  const sharedProps = { onSetNF, onCancelNF, onConfirmPayment, onCancelPayment, onDefer, onCancel, onEdit, confirmingId, cancellingId, deferringId, cancellingPaymentId }

  return (
    <Box sx={{ mb: 3.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: '2px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
          {formatMonthKey(group.month)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[
            { label: 'Faturado', value: billed,   color: 'primary.main' },
            { label: 'Recebido', value: received, color: 'success.main' },
            ...(pending > 0 ? [{ label: 'Pendente', value: pending, color: 'warning.dark' }] : []),
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
                {currency(value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {(group.invoices || []).map(inv => (
          <InvoiceCard key={inv.id} invoice={inv} {...sharedProps} />
        ))}
      </Box>
    </Box>
  )
}

/* ─── PDF export ─── */
function generatePrintHTML(timeline) {
  const now     = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const fmt     = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalBilled   = (timeline || []).reduce((s, g) => s + parseFloat(g.total_billed   || 0), 0)
  const totalReceived = (timeline || []).reduce((s, g) => s + parseFloat(g.total_received || 0), 0)
  const totalPending  = (timeline || []).reduce((s, g) => s + parseFloat(g.total_pending  || 0), 0)

  const statusColors = { paid: '#16a34a', overdue: '#dc2626', issued: '#2563eb', draft: '#64748b', cancelled: '#64748b' }
  const statusLabels = { paid: 'Pago', overdue: 'Em atraso', issued: 'NF emitida', draft: 'Rascunho', cancelled: 'Cancelado' }

  const rows = (timeline || []).flatMap(group =>
    (group.invoices || []).map(inv => `
      <tr>
        <td style="text-transform:capitalize">${formatMonthKey(group.month)}</td>
        <td><strong>${inv.institution_detail?.name || '—'}</strong></td>
        <td style="color:${statusColors[inv.status] || '#64748b'};font-weight:600">${statusLabels[inv.status] || inv.status}</td>
        <td>${inv.nf_number || '—'}</td>
        <td style="text-align:center">${inv.shift_count}</td>
        <td style="text-align:right;font-weight:700">${fmt(parseFloat(inv.total_value || 0))}</td>
        <td>${inv.expected_payment_date ? fmtDate(inv.expected_payment_date) : '—'}</td>
        <td>${inv.payment?.received_date ? fmtDate(inv.payment.received_date) : '—'}</td>
      </tr>`)
  ).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Recebíveis — Vitalis</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#1e293b;padding:28px}
  h1{font-size:20px;color:#0d9488;margin-bottom:3px}
  .sub{color:#64748b;font-size:11px;margin-bottom:18px}
  .totals{display:flex;gap:28px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:20px}
  .tot label{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;display:block;margin-bottom:2px}
  .tot .v{font-size:14px;font-weight:700}
  .tb{color:#0d9488}.tr{color:#16a34a}.tp{color:#d97706}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f1f5f9}
  th{padding:7px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  @media print{body{padding:0}@page{margin:1.5cm}}
</style>
</head>
<body>
  <h1>Relatório de Recebíveis</h1>
  <div class="sub">Vitalis &middot; Gerado em ${dateStr} às ${timeStr}</div>
  <div class="totals">
    <div class="tot"><label>Total faturado</label><span class="v tb">${fmt(totalBilled)}</span></div>
    <div class="tot"><label>Total recebido</label><span class="v tr">${fmt(totalReceived)}</span></div>
    <div class="tot"><label>Total pendente</label><span class="v tp">${fmt(totalPending)}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Mês</th><th>Instituição</th><th>Status</th><th>NF nº</th>
        <th style="text-align:center">Plantões</th>
        <th style="text-align:right">Valor</th>
        <th>Vencimento</th><th>Recebido em</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

/* ════════════════════════ COMPONENTE PRINCIPAL ════════════════════════ */
export default function ReceivablesTab() {
  const queryClient  = useQueryClient()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode,     setViewMode]     = useState('pipeline')
  const [drawerOpen,    setDrawerOpen]   = useState(false)
  const [drawerMode,    setDrawerMode]   = useState('setNF')
  const [drawerInvoice, setDrawerInvoice] = useState(null)
  const [confirmingId,        setConfirmingId]        = useState(null)
  const [cancellingId,        setCancellingId]        = useState(null)
  const [deferringId,         setDeferringId]         = useState(null)
  const [cancellingPaymentId, setCancellingPaymentId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

  useEffect(() => { setSelectedMonth(null) }, [selectedYear])

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['invoices-timeline', selectedYear],
    queryFn:  () => invoicesApi.timeline(selectedYear),
    select:   (res) => res.data,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['invoices-timeline'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['forecast'] })
    queryClient.invalidateQueries({ queryKey: ['monthly-summary'] })
  }

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

  function openSetNF(inv)  { setDrawerMode('setNF'); setDrawerInvoice(inv); setDrawerOpen(true) }
  function openEdit(inv)   { setDrawerMode('edit');  setDrawerInvoice(inv); setDrawerOpen(true) }

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

  function handleExport() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generatePrintHTML(timeline))
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  const totalBilled   = (timeline || []).reduce((s, g) => s + parseFloat(g.total_billed   || 0), 0)
  const totalReceived = (timeline || []).reduce((s, g) => s + parseFloat(g.total_received || 0), 0)
  const totalPending  = (timeline || []).reduce((s, g) => s + parseFloat(g.total_pending  || 0), 0)

  const availableMonths  = (timeline || []).map(g => g.month)
  const filteredTimeline = selectedMonth
    ? (timeline || []).filter(g => g.month === selectedMonth)
    : (timeline || [])

  const sharedProps = {
    onSetNF:          openSetNF,
    onCancelNF:       handleCancelNF,
    onConfirmPayment: handleConfirmPayment,
    onCancelPayment:  handleCancelPayment,
    onDefer:          handleDefer,
    onCancel:         handleCancel,
    onEdit:           openEdit,
    confirmingId,
    cancellingId,
    deferringId,
    cancellingPaymentId,
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Recebíveis</Typography>
          <Typography variant="caption" color="text.secondary">
            Acompanhe o pipeline de faturamento e confirme recebimentos
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* Toggle de visualização */}
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => { if (v) setViewMode(v) }} size="small"
            sx={{ '& .MuiToggleButton-root': { py: 0.5, px: 1.25, fontSize: '0.72rem', fontWeight: 600, border: '1px solid', borderColor: 'divider', '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } } } }}>
            <ToggleButton value="pipeline">
              <ViewColumnIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />Pipeline
            </ToggleButton>
            <ToggleButton value="timeline">
              <FormatListBulletedIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />Timeline
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Seletor de ano */}
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '6px' }}>
            <IconButton size="small" onClick={() => setSelectedYear(y => y - 1)}><ChevronLeftIcon fontSize="small" /></IconButton>
            <Typography variant="body2" fontWeight={700} sx={{ px: 1.5, minWidth: 46, textAlign: 'center' }}>{selectedYear}</Typography>
            <IconButton size="small" onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= new Date().getFullYear() + 1}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <Button variant="outlined" size="small"
            startIcon={<PictureAsPdfIcon fontSize="small" />}
            onClick={handleExport} disabled={!timeline?.length}
            sx={{ borderRadius: '6px', fontSize: '0.72rem' }}>
            Exportar PDF
          </Button>
        </Box>
      </Box>

      {/* Cards de resumo anual */}
      {!isLoading && (timeline?.length ?? 0) > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2.5 }}>
          {[
            { label: 'Fatura gerada',  value: currency(totalBilled),   color: '#64748b', accent: '#64748b', icon: <ReceiptLongIcon sx={{ fontSize: '0.9rem' }} /> },
            { label: 'NF emitida',     value: currency(totalPending),  color: '#2563eb', accent: '#2563eb', icon: <AssignmentTurnedInIcon sx={{ fontSize: '0.9rem' }} /> },
            { label: 'Valor recebido', value: currency(totalReceived), color: '#16a34a', accent: '#10b981', icon: <AccountBalanceWalletIcon sx={{ fontSize: '0.9rem' }} /> },
          ].map(card => (
            <Box key={card.label} sx={{ p: '10px 14px', border: '1px solid', borderColor: 'divider', borderRadius: '8px', borderTop: `3px solid ${card.accent}`, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ color: card.accent }}>{card.icon}</Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</Typography>
              </Box>
              <Typography fontWeight={700} sx={{ color: card.color, fontVariantNumeric: 'tabular-nums' }}>{card.value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Filtro de mês */}
      {!isLoading && availableMonths.length > 1 && (
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { borderRadius: 2, bgcolor: 'action.hover' } }}>
          <Chip label="Todos" size="small" onClick={() => setSelectedMonth(null)}
            variant={selectedMonth === null ? 'filled' : 'outlined'} color={selectedMonth === null ? 'primary' : 'default'}
            sx={{ flexShrink: 0, fontWeight: 600, fontSize: '0.72rem' }} />
          {availableMonths.map(mk => {
            const [y, m] = mk.split('-')
            const abbr   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(m) - 1]
            const label  = `${abbr}/${y.slice(2)}`
            const isSel  = selectedMonth === mk
            return (
              <Chip key={mk} label={label} size="small"
                onClick={() => setSelectedMonth(isSel ? null : mk)}
                variant={isSel ? 'filled' : 'outlined'} color={isSel ? 'primary' : 'default'}
                sx={{ flexShrink: 0, fontWeight: 600, fontSize: '0.72rem' }} />
            )
          })}
        </Box>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={240} />)}
        </Box>
      )}

      {/* Empty */}
      {!isLoading && (!timeline || timeline.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
          <ReceiptLongIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom>
            Nenhuma fatura em {selectedYear}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Acesse a aba Mensal para gerar faturas a partir dos plantões realizados
          </Typography>
        </Box>
      )}

      {/* Conteúdo */}
      {!isLoading && (timeline?.length ?? 0) > 0 && (
        viewMode === 'pipeline' ? (
          <PipelineView timeline={filteredTimeline} {...sharedProps} />
        ) : (
          <Box>
            {filteredTimeline.map(group => (
              <MonthGroup key={group.month} group={group} {...sharedProps} />
            ))}
          </Box>
        )
      )}

      <InvoiceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        invoice={drawerInvoice}
      />
    </Box>
  )
}
