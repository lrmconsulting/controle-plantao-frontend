import { useEffect, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, CircularProgress, Divider, Alert, Checkbox,
  FormControlLabel, Chip, Skeleton, InputAdornment,
} from '@mui/material'
import CloseIcon              from '@mui/icons-material/Close'
import ReceiptLongIcon        from '@mui/icons-material/ReceiptLong'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import EditIcon               from '@mui/icons-material/Edit'
import ArrowBackIcon          from '@mui/icons-material/ArrowBack'
import AddIcon                from '@mui/icons-material/Add'
import DeleteOutlineIcon      from '@mui/icons-material/DeleteOutline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/financials'
import { institutionsApi } from '@/api/institutions'

/* ─── helpers ─── */
function currency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDatetime(isoStr) {
  if (!isoStr) return '—'
  const d   = new Date(isoStr)
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const h   = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${mon} ${h}:${min}`
}

/** Converte Date → 'YYYY-MM' */
function toMonthStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Gera opções de mês: 3 meses à frente + 12 meses para trás */
function buildMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = -3; i < 13; i++) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = toMonthStr(d)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

/* ─── Schemas ─── */
const step0Schema = z.object({
  institution: z.string().min(1, 'Instituição obrigatória'),
  month:       z.string().min(1, 'Mês obrigatório'),
  notes:       z.string().optional(),
})

const setNFSchema = z.object({
  nf_number:  z.string().min(1, 'Número da NF obrigatório'),
  issue_date: z.string().optional(),
})

/* ─── helper: "esta entrada está selecionada?" ─── */
function isShiftSelected(s, selectedIds) {
  const ids = s.monthly_all_shift_ids || [s.id]
  return ids.some((id) => selectedIds.has(id))
}

/* ─── ShiftRow ─── */
function ShiftRow({ shift, selected, onChange }) {
  const unit     = shift.unit_detail
  const isMonthly = !!shift.monthly_all_shift_ids
  const allIds   = shift.monthly_all_shift_ids || [shift.id]
  const val      = parseFloat(shift.effective_value || 0)

  const rowSx = {
    display: 'flex', alignItems: 'center', gap: 1.5,
    px: 1.5, py: 1,
    cursor: 'pointer',
    borderBottom: '1px solid', borderColor: 'divider',
    bgcolor: selected ? 'primary.50' : 'transparent',
    '&:hover': { bgcolor: selected ? 'primary.100' : '#f8fafc' },
    transition: 'background 0.12s',
  }

  if (isMonthly) {
    const count = shift.monthly_shift_count || allIds.length
    return (
      <Box onClick={() => onChange(allIds, !selected)} sx={rowSx}>
        <Checkbox
          size="small"
          checked={selected}
          onChange={(e) => onChange(allIds, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 0.25 }}
        />
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: unit?.color || '#94a3b8', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
              Cobrança mensal fixa
            </Typography>
            <Chip
              label="Mensal"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ height: 16, fontSize: '0.6rem', borderRadius: '3px', lineHeight: 1 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
            {count} plant{count !== 1 ? 'ões' : 'ão'} no mês
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem', flexShrink: 0 }}>
          {currency(val)}
        </Typography>
      </Box>
    )
  }

  /* ── Per-shift ── */
  const start = new Date(shift.start_datetime)
  const end   = shift.end_datetime ? new Date(shift.end_datetime) : null
  const dur   = end ? Math.round((end - start) / 3_600_000) : null

  return (
    <Box onClick={() => onChange(allIds, !selected)} sx={rowSx}>
      <Checkbox
        size="small"
        checked={selected}
        onChange={(e) => onChange(allIds, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        sx={{ p: 0.25 }}
      />
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: unit?.color || '#94a3b8', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
          {fmtDatetime(shift.start_datetime)}
          {end && ` – ${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`}
          {dur && ` (${dur}h)`}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem' }}>
          {unit?.name || '—'}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem', flexShrink: 0 }}>
        {currency(val)}
      </Typography>
    </Box>
  )
}

/* ─── ShiftSelector ─── */
function ShiftSelector({ shifts, selectedIds, onChange, loading }) {
  // Agrupa por unidade (monthly já vem colapsado do backend, um item por unidade)
  const byUnit = useMemo(() => {
    const map = {}
    ;(shifts || []).forEach((s) => {
      const key = s.unit_detail?.id || s.unit_detail?.name || 'sem-unidade'
      if (!map[key]) map[key] = { name: s.unit_detail?.name || 'Sem unidade', shifts: [] }
      map[key].shifts.push(s)
    })
    return Object.values(map)
  }, [shifts])

  // Conta entradas visíveis selecionadas (não IDs individuais)
  const selectedCount = useMemo(
    () => (shifts || []).filter((s) => isShiftSelected(s, selectedIds)).length,
    [shifts, selectedIds],
  )

  const total = useMemo(
    () =>
      (shifts || [])
        .filter((s) => isShiftSelected(s, selectedIds))
        .reduce((sum, s) => sum + parseFloat(s.effective_value || 0), 0),
    [shifts, selectedIds],
  )

  function toggleUnit(unitShifts, allSelected) {
    const next = new Set(selectedIds)
    unitShifts.forEach((s) => {
      const ids = s.monthly_all_shift_ids || [s.id]
      if (allSelected) ids.forEach((id) => next.delete(id))
      else             ids.forEach((id) => next.add(id))
    })
    onChange(next)
  }

  function toggleShift(ids, checked) {
    const next = new Set(selectedIds)
    const idList = Array.isArray(ids) ? ids : [ids]
    idList.forEach((id) => {
      if (checked) next.add(id)
      else         next.delete(id)
    })
    onChange(next)
  }

  const allSelected = shifts?.length > 0 && shifts.every((s) => isShiftSelected(s, selectedIds))

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={48} />)}
      </Box>
    )
  }

  if (!shifts?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed', borderColor: 'divider', borderRadius: '8px' }}>
        <ReceiptLongIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          Nenhum plantão disponível para faturamento neste mês
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Cabeçalho seleção global */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
          {selectedCount} de {shifts.length} {shifts.length !== 1 ? 'selecionados' : 'selecionado'}
        </Typography>
        <Button
          size="small" variant="text"
          sx={{ fontSize: '0.7rem', py: 0.2 }}
          onClick={() => {
            if (allSelected) {
              onChange(new Set())
            } else {
              const next = new Set()
              shifts.forEach((s) => {
                const ids = s.monthly_all_shift_ids || [s.id]
                ids.forEach((id) => next.add(id))
              })
              onChange(next)
            }
          }}
        >
          {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
        </Button>
      </Box>

      {/* Grupos por unidade */}
      {byUnit.map((group) => {
        const allSel  = group.shifts.every((s) => isShiftSelected(s, selectedIds))
        const someSel = group.shifts.some((s) => isShiftSelected(s, selectedIds))
        return (
          <Box key={group.name} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Header do grupo */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1.5, py: 0.875, bgcolor: '#f8fafc',
                borderBottom: '1px solid', borderColor: 'divider',
                cursor: 'pointer',
              }}
              onClick={() => toggleUnit(group.shifts, allSel)}
            >
              <Checkbox
                size="small"
                checked={allSel}
                indeterminate={someSel && !allSel}
                onChange={() => toggleUnit(group.shifts, allSel)}
                onClick={(e) => e.stopPropagation()}
                sx={{ p: 0.25 }}
              />
              <Typography variant="body2" fontWeight={700} sx={{ flex: 1, fontSize: '0.8rem' }}>
                {group.name}
              </Typography>
              {/* Para unidades per_shift mostra contagem de plantões */}
              {!group.shifts[0]?.monthly_all_shift_ids && (
                <Chip
                  label={`${group.shifts.length} plant${group.shifts.length !== 1 ? 'ões' : 'ão'}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', borderRadius: '4px' }}
                />
              )}
            </Box>
            {/* Plantões / entrada mensal */}
            {group.shifts.map((shift) => (
              <ShiftRow
                key={shift.id}
                shift={shift}
                selected={isShiftSelected(shift, selectedIds)}
                onChange={toggleShift}
              />
            ))}
          </Box>
        )
      })}

      {/* Resumo de total */}
      {selectedCount > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 1.5, py: 1, bgcolor: 'primary.50',
          border: '1px solid', borderColor: 'primary.200', borderRadius: '8px', mt: 0.5,
        }}>
          <Typography variant="body2" color="primary.dark" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
            Total selecionado ({selectedIds.size} plant{selectedIds.size !== 1 ? 'ões' : 'ão'})
          </Typography>
          <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {currency(total)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

/* ─── ExtraItemsEditor ─── */
function ExtraItemsEditor({ items, onChange }) {
  function addItem() {
    onChange([...items, { description: '', value: '' }])
  }
  function removeItem(idx) {
    onChange(items.filter((_, i) => i !== idx))
  }
  function updateItem(idx, field, val) {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: val }
    onChange(next)
  }

  const total = items.reduce((s, item) => s + parseFloat(item.value || 0), 0)

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Adicione valores adicionais não vinculados a plantões: comissões administrativas,
        diárias de sobreaviso, reembolsos, etc.
      </Typography>

      {items.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 3.5,
          border: '1px dashed', borderColor: 'divider', borderRadius: '8px', mb: 2,
        }}>
          <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>
            Nenhum valor adicional
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Clique em "Adicionar item" para incluir
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
          {items.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Descrição"
                placeholder="Ex: Comissão administrativa"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                size="small"
                label="Valor (R$)"
                type="number"
                value={item.value}
                onChange={(e) => updateItem(idx, 'value', e.target.value)}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
                  htmlInput: { min: 0, step: '0.01' },
                }}
                sx={{ flex: 1, minWidth: 110 }}
              />
              <IconButton
                size="small"
                onClick={() => removeItem(idx)}
                sx={{ mt: 0.5, color: 'error.main', '&:hover': { bgcolor: 'error.50' } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Button
        size="small" variant="outlined"
        startIcon={<AddIcon />}
        onClick={addItem}
        sx={{ borderRadius: '6px', fontSize: '0.75rem' }}
      >
        Adicionar item
      </Button>

      {total > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 1.5, py: 1, bgcolor: 'secondary.50',
          border: '1px solid', borderColor: 'secondary.200', borderRadius: '8px', mt: 2,
        }}>
          <Typography variant="body2" fontWeight={600} color="secondary.dark" sx={{ fontSize: '0.8rem' }}>
            Total adicional ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </Typography>
          <Typography variant="body2" fontWeight={800} color="secondary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {currency(total)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

/* ═══════════════════════════ COMPONENTE PRINCIPAL ═══════════════════════════ */
export default function InvoiceDrawer({
  open,
  onClose,
  /** 'generate' | 'edit' | 'setNF' */
  mode = 'generate',
  /** Fatura existente (obrigatório nos modos edit e setNF) */
  invoice = null,
  /** Mês pré-selecionado no modo generate */
  initialMonth = null,
}) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState(null)
  const [step, setStep] = useState(0)
  // generate: 0=params 1=shifts 2=extras | edit: 0=shifts 1=extras
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [extraItems,  setExtraItems]  = useState([])   // [{description, value}]
  const [editPending, setEditPending] = useState(false)

  const MONTH_OPTIONS = useMemo(() => buildMonthOptions(), [])

  const isGenerate = mode === 'generate'
  const isEdit     = mode === 'edit'
  const isSetNF    = mode === 'setNF'

  /* ── Instituições ── */
  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn:  () => institutionsApi.list({ is_active: true }),
    select:   (res) => res.data.results ?? res.data,
    enabled:  isGenerate,
  })

  /* ── Step 0 form ── */
  const step0Form = useForm({
    resolver: zodResolver(step0Schema),
    defaultValues: {
      institution: '',
      month: initialMonth || toMonthStr(new Date()),
      notes: '',
    },
  })

  const watchInstitution = step0Form.watch('institution')
  const watchMonth       = step0Form.watch('month')

  /* ── Plantões disponíveis (step 1 de generate) ── */
  const { data: availableShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['available-shifts', watchInstitution, watchMonth],
    queryFn:  () => invoicesApi.availableShifts({ institution: watchInstitution, month: watchMonth }),
    select:   (res) => res.data,
    enabled:  isGenerate && step === 1 && !!watchInstitution && !!watchMonth,
  })

  /* ── Plantões da fatura + disponíveis (modo edit) ── */
  const currentShiftIds = useMemo(() => {
    if (!invoice?.invoice_shifts) return new Set()
    return new Set(invoice.invoice_shifts.map((is) => String(is.shift)))
  }, [invoice])

  // Para edição: plantões disponíveis + os que já estão na fatura
  const { data: editAvailableShifts, isLoading: editShiftsLoading } = useQuery({
    queryKey: ['available-shifts-edit', invoice?.institution, invoice?.reference_month?.slice(0, 7)],
    queryFn:  () => invoicesApi.availableShifts({
      institution: invoice.institution,
      month: invoice.reference_month.slice(0, 7),
    }),
    select: (res) => res.data,
    enabled: isEdit && open && !!invoice,
  })

  /* ── setNF form ── */
  const setNFForm = useForm({
    resolver: zodResolver(setNFSchema),
    defaultValues: { nf_number: '', issue_date: '' },
  })

  /* ── Reset ao abrir ── */
  useEffect(() => {
    if (!open) return
    setServerError(null)
    setStep(0)
    if (isGenerate) {
      step0Form.reset({ institution: '', month: initialMonth || toMonthStr(new Date()), notes: '' })
      setSelectedIds(new Set())
      setExtraItems([])
    } else if (isEdit && invoice) {
      setSelectedIds(new Set(invoice.invoice_shifts?.map((is) => String(is.shift)) || []))
      setExtraItems(
        (invoice.extra_items || []).map((e) => ({ description: e.description, value: String(e.value) }))
      )
    } else if (isSetNF) {
      setNFForm.reset({ nf_number: invoice?.nf_number || '', issue_date: '' })
    }
  }, [open, mode, invoice])

  /* ── Mutations ── */
  function invalidate(refMonth) {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    if (refMonth) queryClient.invalidateQueries({ queryKey: ['invoices', refMonth] })
    queryClient.invalidateQueries({ queryKey: ['forecast'] })
    queryClient.invalidateQueries({ queryKey: ['invoices-timeline'] })
    queryClient.invalidateQueries({ queryKey: ['monthly-summary'] })
  }

  const generateMutation = useMutation({
    mutationFn: (data) => invoicesApi.generate(data),
    onSuccess: (res) => {
      invalidate(res.data.reference_month?.slice(0, 7))
      onClose()
    },
    onError: (err) => setServerError(err.response?.data?.detail || 'Erro ao gerar fatura.'),
  })

  const setNFMutation = useMutation({
    mutationFn: (data) => invoicesApi.setNF(invoice.id, data),
    onSuccess: (res) => {
      invalidate(res.data.reference_month?.slice(0, 7))
      onClose()
    },
    onError: (err) => setServerError(err.response?.data?.detail || 'Erro ao registrar NF.'),
  })

  const isPending = generateMutation.isPending || setNFMutation.isPending || editPending

  /* ── Helpers ── */
  function validExtras(items) {
    return items.filter((i) => i.description.trim() && parseFloat(i.value || 0) > 0)
  }

  /* ── Handlers ── */
  function handleStep0Next() {
    setServerError(null)
    setStep(1)
    setSelectedIds(new Set())
  }

  // Quando os plantões disponíveis carregam no step 1 (generate), pré-seleciona todos
  useEffect(() => {
    if (step === 1 && isGenerate && availableShifts) {
      const next = new Set()
      availableShifts.forEach((s) => {
        const ids = s.monthly_all_shift_ids || [s.id]
        ids.forEach((id) => next.add(id))
      })
      setSelectedIds(next)
    }
  }, [availableShifts, step, isGenerate])

  // generate: shift step → extras step
  function handleShiftsNext() {
    if (selectedIds.size === 0) {
      setServerError('Selecione pelo menos um plantão para faturar.')
      return
    }
    setServerError(null)
    setStep(2)
  }

  // generate: submit final (step 2)
  function handleGenerate() {
    const values = step0Form.getValues()
    setServerError(null)
    generateMutation.mutate({
      institution: values.institution,
      month:       values.month,
      notes:       values.notes || '',
      shift_ids:   Array.from(selectedIds),
      extra_items: validExtras(extraItems),
    })
  }

  // edit: submit final (step 1)
  async function handleEdit() {
    if (selectedIds.size === 0) {
      setServerError('Selecione pelo menos um plantão.')
      return
    }
    setServerError(null)
    setEditPending(true)
    try {
      await invoicesApi.editShifts(invoice.id, Array.from(selectedIds))
      await invoicesApi.editExtras(invoice.id, validExtras(extraItems))
      invalidate(invoice.reference_month?.slice(0, 7))
      onClose()
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Erro ao editar fatura.')
    } finally {
      setEditPending(false)
    }
  }

  function handleSetNF(data) {
    setServerError(null)
    setNFMutation.mutate(data)
  }

  /* ── Título / ícone / step indicator ── */
  const drawerTitle = isGenerate ? 'Gerar fatura'
    : isEdit ? 'Editar fatura'
    : 'Registrar NF emitida'

  const GENERATE_SUBTITLES = [
    'Selecione a instituição e o período',
    'Escolha os plantões a incluir',
    'Valores adicionais (opcional)',
  ]
  const EDIT_SUBTITLES = ['Plantões da fatura', 'Valores adicionais']

  const drawerSubtitle = isGenerate
    ? GENERATE_SUBTITLES[step] || ''
    : isEdit
    ? EDIT_SUBTITLES[step] || ''
    : `${invoice?.institution_detail?.name} · ${invoice?.reference_month_display}`

  const drawerIcon = isSetNF ? <AssignmentTurnedInIcon fontSize="small" />
    : isEdit ? <EditIcon fontSize="small" />
    : <ReceiptLongIcon fontSize="small" />

  // Indica visualmente em qual passo o usuário está
  const totalSteps   = isGenerate ? 3 : isEdit ? 2 : 1
  const showProgress = (isGenerate || isEdit) && !isSetNF

  /* ── Shifts para o seletor no modo edit ──
     Combina: os que já estão na fatura + os disponíveis (sem duplicatas).
     Unidades mensais são colapsadas em uma única entrada por unidade. */
  const editAllShifts = useMemo(() => {
    if (!invoice?.invoice_shifts) return editAvailableShifts || []
    const available = editAvailableShifts || []

    // Coleta todos os IDs cobertos por "available" (incluindo monthly_all_shift_ids)
    const availableCoveredIds = new Set()
    available.forEach((s) => {
      const ids = s.monthly_all_shift_ids || [s.id]
      ids.forEach((id) => availableCoveredIds.add(String(id)))
    })

    // InvoiceShifts que NÃO aparecem em available (ainda estão na fatura, não mais disponíveis)
    const notCovered = invoice.invoice_shifts.filter(
      (is) => !availableCoveredIds.has(String(is.shift))
    )

    if (notCovered.length === 0) return available

    // Agrupa por unidade para colapsar mensais
    const byUnitKey = {}
    notCovered.forEach((is) => {
      const billingType = is.unit_billing_type || 'per_shift'
      if (billingType === 'monthly') {
        const key = `monthly::${is.unit_name}`
        if (!byUnitKey[key]) byUnitKey[key] = { isMonthly: true, items: [], unitName: is.unit_name, unitColor: is.unit_color, totalValue: 0 }
        byUnitKey[key].items.push(is)
        byUnitKey[key].totalValue += parseFloat(is.value || 0)
      } else {
        const key = `per_shift::${is.shift}`
        byUnitKey[key] = { isMonthly: false, items: [is], unitName: is.unit_name, unitColor: is.unit_color, totalValue: parseFloat(is.value || 0) }
      }
    })

    const current = Object.values(byUnitKey).map((group) => {
      if (group.isMonthly) {
        const rep = group.items[0]
        return {
          id: String(rep.shift),
          start_datetime: rep.shift_date,
          end_datetime:   rep.shift_end_date,
          effective_value: group.totalValue,
          unit_detail: { name: group.unitName, color: group.unitColor, billing_type: 'monthly' },
          monthly_all_shift_ids: group.items.map((is) => String(is.shift)),
          monthly_shift_count: group.items.length,
        }
      }
      const is = group.items[0]
      return {
        id: String(is.shift),
        start_datetime: is.shift_date,
        end_datetime:   is.shift_end_date,
        effective_value: is.value,
        unit_detail: { name: group.unitName, color: group.unitColor, billing_type: 'per_shift' },
      }
    })

    return [...current, ...available]
  }, [invoice, editAvailableShifts])

  /* ──────────────────────── RENDER ──────────────────────── */
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100vw', p: 0, overflowX: 'hidden', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Botão voltar (generate step>0 ou edit step>0) */}
          {((isGenerate && step > 0) || (isEdit && step > 0)) && (
            <IconButton size="small" onClick={() => { setStep(s => s - 1); setServerError(null) }} sx={{ mr: 0.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#f0fdfa', color: 'primary.main', display: 'flex' }}>
            {drawerIcon}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>{drawerTitle}</Typography>
              {showProgress && (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                  {step + 1}/{totalSteps}
                </Typography>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">{drawerSubtitle}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>

      {/* ══ MODO: GERAR FATURA — Step 0 ══ */}
      {isGenerate && step === 0 && (
        <Box
          component="form"
          onSubmit={step0Form.handleSubmit(handleStep0Next)}
          sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Controller
            name="institution"
            control={step0Form.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Instituição pagadora"
                error={!!step0Form.formState.errors.institution}
                helperText={step0Form.formState.errors.institution?.message}
              >
                {(institutions || []).map((inst) => (
                  <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="month"
            control={step0Form.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Mês de referência"
                error={!!step0Form.formState.errors.month}
                helperText={step0Form.formState.errors.month?.message}
              >
                {MONTH_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Observações (opcional)"
            multiline
            rows={2}
            {...step0Form.register('notes')}
          />
        </Box>
      )}

      {/* ══ MODO: GERAR FATURA — Step 1 (shift selection) ══ */}
      {isGenerate && step === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {serverError && (
            <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>
          )}
          <ShiftSelector
            shifts={availableShifts}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            loading={shiftsLoading}
          />
        </Box>
      )}

      {/* ══ MODO: GERAR FATURA — Step 2 (extras) ══ */}
      {isGenerate && step === 2 && (
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {serverError && (
            <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>
          )}
          <ExtraItemsEditor items={extraItems} onChange={setExtraItems} />
        </Box>
      )}

      {/* ══ MODO: EDITAR — Step 0 (plantões) ══ */}
      {isEdit && step === 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {serverError && (
            <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>
          )}
          <ShiftSelector
            shifts={editAllShifts}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            loading={editShiftsLoading}
          />
        </Box>
      )}

      {/* ══ MODO: EDITAR — Step 1 (extras) ══ */}
      {isEdit && step === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {serverError && (
            <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>
          )}
          <ExtraItemsEditor items={extraItems} onChange={setExtraItems} />
        </Box>
      )}

      {/* ══ MODO: REGISTRAR NF ══ */}
      {isSetNF && (
        <Box
          component="form"
          onSubmit={setNFForm.handleSubmit(handleSetNF)}
          sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          {invoice && (
            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">Valor da fatura</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {currency(invoice.total_value)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {invoice.shift_count} plantão{invoice.shift_count !== 1 ? 'ões' : ''}
              </Typography>
            </Box>
          )}

          <Divider>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>Dados da NF</Typography>
          </Divider>

          <TextField
            label="Número da NF"
            placeholder="Ex: 000123"
            {...setNFForm.register('nf_number')}
            error={!!setNFForm.formState.errors.nf_number}
            helperText={setNFForm.formState.errors.nf_number?.message}
            autoFocus
          />

          <TextField
            label="Data de emissão (opcional)"
            type="date"
            {...setNFForm.register('issue_date')}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Se não informada, usa a data de hoje"
          />

          {serverError && <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>}
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexShrink: 0 }}>
        <Button variant="outlined" onClick={onClose} disabled={isPending}>Cancelar</Button>

        {/* generate: step 0 — Próximo */}
        {isGenerate && step === 0 && (
          <Button
            variant="contained"
            onClick={step0Form.handleSubmit(handleStep0Next)}
            disabled={isPending}
            sx={{ minWidth: 120 }}
          >
            Próximo →
          </Button>
        )}

        {/* generate: step 1 — Próximo (para extras) */}
        {isGenerate && step === 1 && (
          <Button
            variant="contained"
            onClick={handleShiftsNext}
            disabled={isPending || selectedIds.size === 0}
            sx={{ minWidth: 120 }}
          >
            Próximo →
          </Button>
        )}

        {/* generate: step 2 — Gerar fatura */}
        {isGenerate && step === 2 && (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isPending}
            sx={{ minWidth: 140 }}
          >
            {isPending
              ? <CircularProgress size={18} color="inherit" />
              : `Gerar fatura${extraItems.length > 0 ? ` +${extraItems.length}` : ''}`}
          </Button>
        )}

        {/* edit: step 0 — Próximo (para extras) */}
        {isEdit && step === 0 && (
          <Button
            variant="contained"
            onClick={() => { if (selectedIds.size === 0) { setServerError('Selecione pelo menos um plantão.'); return } setServerError(null); setStep(1) }}
            disabled={isPending || selectedIds.size === 0}
            sx={{ minWidth: 120 }}
          >
            Próximo →
          </Button>
        )}

        {/* edit: step 1 — Salvar alterações */}
        {isEdit && step === 1 && (
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={isPending}
            sx={{ minWidth: 140 }}
          >
            {isPending ? <CircularProgress size={18} color="inherit" /> : 'Salvar alterações'}
          </Button>
        )}

        {isSetNF && (
          <Button
            variant="contained"
            onClick={setNFForm.handleSubmit(handleSetNF)}
            disabled={isPending}
            sx={{ minWidth: 130 }}
          >
            {isPending ? <CircularProgress size={18} color="inherit" /> : 'Registrar NF'}
          </Button>
        )}
      </Box>
    </Drawer>
  )
}
