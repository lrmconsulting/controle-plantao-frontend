import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  MenuItem, CircularProgress, Divider, Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/financials'
import { institutionsApi } from '@/api/institutions'

/* ─── Modo 1: Gerar fatura ─── */
const generateSchema = z.object({
  institution: z.string().min(1, 'Instituição obrigatória'),
  month:       z.string().min(1, 'Mês obrigatório'),
  notes:       z.string().optional(),
})

/* ─── Modo 2: Registrar NF ─── */
const setNFSchema = z.object({
  nf_number:  z.string().min(1, 'Número da NF obrigatório'),
  issue_date: z.string().optional(),
})

/** Converte Date → 'YYYY-MM' */
function toMonthStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Últimos 12 meses como opções de select */
function buildMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = toMonthStr(d)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

const MONTH_OPTIONS = buildMonthOptions()

export default function InvoiceDrawer({
  open,
  onClose,
  /** 'generate' | 'setNF' */
  mode = 'generate',
  /** Fatura existente (obrigatório no modo setNF) */
  invoice = null,
  /** Mês pré-selecionado no modo generate */
  initialMonth = null,
}) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState(null)

  /* ── Instituições (modo generate) ── */
  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsApi.list({ is_active: true }),
    select: (res) => res.data.results ?? res.data,
    enabled: mode === 'generate',
  })

  /* ── Form gerar fatura ── */
  const generateForm = useForm({
    resolver: zodResolver(generateSchema),
    defaultValues: { institution: '', month: initialMonth || toMonthStr(new Date()), notes: '' },
  })

  /* ── Form registrar NF ── */
  const setNFForm = useForm({
    resolver: zodResolver(setNFSchema),
    defaultValues: { nf_number: '', issue_date: '' },
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      if (mode === 'generate') {
        generateForm.reset({
          institution: '',
          month: initialMonth || toMonthStr(new Date()),
          notes: '',
        })
      } else {
        setNFForm.reset({ nf_number: invoice?.nf_number || '', issue_date: '' })
      }
    }
  }, [open, mode, initialMonth, invoice])

  /* ── Mutação gerar ── */
  const generateMutation = useMutation({
    mutationFn: (data) => invoicesApi.generate(data),
    onSuccess: (res) => {
      const month = res.data.reference_month?.slice(0, 7)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', month] })
      queryClient.invalidateQueries({ queryKey: ['forecast'] })
      queryClient.invalidateQueries({ queryKey: ['invoices-timeline'] })
      onClose()
    },
    onError: (err) => {
      setServerError(err.response?.data?.detail || 'Erro ao gerar fatura.')
    },
  })

  /* ── Mutação set-nf ── */
  const setNFMutation = useMutation({
    mutationFn: (data) => invoicesApi.setNF(invoice.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['forecast'] })
      queryClient.invalidateQueries({ queryKey: ['invoices-timeline'] })
      onClose()
    },
    onError: (err) => {
      setServerError(err.response?.data?.detail || 'Erro ao registrar NF.')
    },
  })

  const isGenerate = mode === 'generate'
  const isPending  = isGenerate ? generateMutation.isPending : setNFMutation.isPending

  function onSubmit(data) {
    setServerError(null)
    if (isGenerate) generateMutation.mutate(data)
    else setNFMutation.mutate(data)
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100vw', p: 0, overflowX: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#f0fdfa', color: 'primary.main', display: 'flex' }}>
            {isGenerate ? <ReceiptLongIcon fontSize="small" /> : <AssignmentTurnedInIcon fontSize="small" />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isGenerate ? 'Gerar fatura' : 'Registrar NF emitida'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isGenerate
                ? 'Consolida plantões de um mês em uma fatura'
                : `Fatura: ${invoice?.institution_detail?.name} · ${invoice?.reference_month_display}`}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>

      {/* ═══ MODO GERAR FATURA ═══ */}
      {isGenerate && (
        <Box
          component="form"
          onSubmit={generateForm.handleSubmit(onSubmit)}
          sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Controller
            name="institution"
            control={generateForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Instituição pagadora"
                error={!!generateForm.formState.errors.institution}
                helperText={generateForm.formState.errors.institution?.message}
              >
                {(institutions || []).map((inst) => (
                  <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="month"
            control={generateForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Mês de referência"
                error={!!generateForm.formState.errors.month}
                helperText={generateForm.formState.errors.month?.message}
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
            rows={3}
            {...generateForm.register('notes')}
          />

          {serverError && <Alert severity="error" sx={{ borderRadius: '6px' }}>{serverError}</Alert>}
        </Box>
      )}

      {/* ═══ MODO REGISTRAR NF ═══ */}
      {!isGenerate && (
        <Box
          component="form"
          onSubmit={setNFForm.handleSubmit(onSubmit)}
          sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          {invoice && (
            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">Valor da fatura</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total_value)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {invoice.shift_count} plantão{invoice.shift_count !== 1 ? 'ões' : ''}
              </Typography>
            </Box>
          )}

          <Divider>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              Dados da NF
            </Typography>
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
      <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={isGenerate
            ? generateForm.handleSubmit(onSubmit)
            : setNFForm.handleSubmit(onSubmit)
          }
          disabled={isPending}
          sx={{ minWidth: 130 }}
        >
          {isPending
            ? <CircularProgress size={18} color="inherit" />
            : isGenerate ? 'Gerar fatura' : 'Registrar NF'
          }
        </Button>
      </Box>
    </Drawer>
  )
}
