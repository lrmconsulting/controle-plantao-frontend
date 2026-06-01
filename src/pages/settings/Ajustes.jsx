import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  TextField, Button, Divider, Alert, CircularProgress,
  Switch, FormControlLabel, Stack, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Slider, InputAdornment, Snackbar,
  Checkbox, FormControlLabel as MuiFormControlLabel, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText as MuiListItemText,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import GoogleIcon from '@mui/icons-material/Google'
import AppleIcon from '@mui/icons-material/Apple'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import SyncIcon from '@mui/icons-material/Sync'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { profileApi, preferencesApi, integrationsApi } from '@/api/settings'
import { useAuthStore } from '@/store/authStore'

/* ─── Schemas Zod ─── */
const profileSchema = z.object({
  name:      z.string().min(2, 'Nome muito curto'),
  specialty: z.string().optional(),
  crm:       z.string().optional(),
  cpf:       z.string().optional(),
  phone:     z.string().optional(),
})

const passwordSchema = z.object({
  current_password:     z.string().min(1, 'Informe a senha atual'),
  new_password:         z.string().min(8, 'Mínimo 8 caracteres'),
  new_password_confirm: z.string().min(1, 'Confirme a nova senha'),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: 'As senhas não coincidem',
  path: ['new_password_confirm'],
})

const appleSchema = z.object({
  username: z.string().email('E-mail Apple ID inválido'),
  password: z.string().min(1, 'App Password é obrigatória'),
})

const deleteSchema = z.object({
  password: z.string().min(1, 'Informe sua senha'),
})

/* ─── Seção genérica ─── */
function Section({ title, children }) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {title && (
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            {title}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

/* ══════════════════════════════════════════
   ABA 1 — PERFIL
══════════════════════════════════════════ */
function TabPerfil() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore(s => s.updateUser)
  const user = useAuthStore(s => s.user)

  /* Formulário de perfil */
  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:      user?.name || '',
      specialty: user?.specialty || '',
      crm:       user?.crm || '',
      cpf:       user?.cpf || '',
      phone:     user?.phone || '',
    },
  })

  const [profileSuccess, setProfileSuccess] = useState(false)

  const profileMutation = useMutation({
    mutationFn: (data) => profileApi.update(data).then(r => r.data),
    onSuccess: (data) => {
      updateUser(data)
      reset({
        name:      data.name,
        specialty: data.specialty || '',
        crm:       data.crm || '',
        cpf:       data.cpf || '',
        phone:     data.phone || '',
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
      queryClient.invalidateQueries(['me'])
    },
  })

  /* Formulário de senha */
  const {
    register: rPwd, handleSubmit: hPwd, reset: resetPwd,
    formState: { errors: ePwd },
  } = useForm({ resolver: zodResolver(passwordSchema) })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [pwdSuccess, setPwdSuccess]   = useState(false)
  const [pwdError, setPwdError]       = useState('')

  const passwordMutation = useMutation({
    mutationFn: (data) => profileApi.changePassword(data).then(r => r.data),
    onSuccess: () => {
      resetPwd()
      setPwdSuccess(true)
      setPwdError('')
      setTimeout(() => setPwdSuccess(false), 3000)
    },
    onError: (err) => {
      setPwdError(err.response?.data?.current_password || err.response?.data?.detail || 'Erro ao alterar senha.')
    },
  })

  return (
    <Box>
      {/* Dados pessoais */}
      <Section title="Dados pessoais">
        <form onSubmit={handleSubmit(d => profileMutation.mutate(d))}>
          <Stack spacing={2}>
            <TextField
              label="Nome completo"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="E-mail"
              fullWidth
              value={user?.email || ''}
              disabled
              helperText="O e-mail não pode ser alterado"
            />
            <TextField
              label="Especialidade"
              fullWidth
              placeholder="ex.: Cardiologia"
              {...register('specialty')}
              error={!!errors.specialty}
              helperText={errors.specialty?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="CRM"
                fullWidth
                placeholder="CRM/SP 123456"
                {...register('crm')}
                error={!!errors.crm}
                helperText={errors.crm?.message}
              />
              <TextField
                label="CPF"
                fullWidth
                placeholder="000.000.000-00"
                {...register('cpf')}
                error={!!errors.cpf}
                helperText={errors.cpf?.message}
              />
            </Stack>
            <TextField
              label="Telefone"
              fullWidth
              placeholder="(11) 99999-9999"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />

            {profileSuccess && (
              <Alert severity="success" sx={{ mt: 1 }}>Perfil atualizado com sucesso!</Alert>
            )}
            {profileMutation.error && (
              <Alert severity="error">{profileMutation.error.response?.data?.detail || 'Erro ao salvar.'}</Alert>
            )}

            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || profileMutation.isPending}
                startIcon={profileMutation.isPending && <CircularProgress size={16} color="inherit" />}
              >
                Salvar alterações
              </Button>
            </Box>
          </Stack>
        </form>
      </Section>

      {/* Senha */}
      <Section title="Alterar senha">
        <form onSubmit={hPwd(d => passwordMutation.mutate(d))}>
          <Stack spacing={2}>
            <TextField
              label="Senha atual"
              type={showCurrent ? 'text' : 'password'}
              fullWidth
              {...rPwd('current_password')}
              error={!!ePwd.current_password}
              helperText={ePwd.current_password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent(v => !v)} edge="end">
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Nova senha"
              type={showNew ? 'text' : 'password'}
              fullWidth
              {...rPwd('new_password')}
              error={!!ePwd.new_password}
              helperText={ePwd.new_password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew(v => !v)} edge="end">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Confirmar nova senha"
              type="password"
              fullWidth
              {...rPwd('new_password_confirm')}
              error={!!ePwd.new_password_confirm}
              helperText={ePwd.new_password_confirm?.message}
            />

            {pwdSuccess && <Alert severity="success">Senha alterada com sucesso!</Alert>}
            {pwdError   && <Alert severity="error">{pwdError}</Alert>}

            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="outlined"
                disabled={passwordMutation.isPending}
                startIcon={passwordMutation.isPending && <CircularProgress size={16} color="inherit" />}
              >
                Alterar senha
              </Button>
            </Box>
          </Stack>
        </form>
      </Section>
    </Box>
  )
}

/* ══════════════════════════════════════════
   DIALOG: selecionar calendários
══════════════════════════════════════════ */
function CalendarPickerDialog({ open, onClose, source, integration }) {
  const queryClient = useQueryClient()

  const [selected, setSelected] = useState(null)   // null = ainda não carregou
  const [allSelected, setAllSelected] = useState(true)

  // Busca calendários disponíveis
  const { data, isLoading, isError } = useQuery({
    queryKey: ['available-calendars', source],
    queryFn: () => integrationsApi.availableCalendars(source).then(r => r.data),
    enabled: open,
    retry: false,
  })

  // Inicializa seleção quando os dados chegam
  useEffect(() => {
    if (!data) return
    if (data.all_selected || !data.selected_ids?.length) {
      setAllSelected(true)
      setSelected(data.calendars.map(c => c.id))
    } else {
      setAllSelected(false)
      setSelected(data.selected_ids)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (ids) => integrationsApi.selectCalendars(source, ids),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations'])
      onClose()
    },
  })

  function handleToggle(id) {
    setAllSelected(false)
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    setAllSelected(true)
    setSelected((data?.calendars || []).map(c => c.id))
  }

  function handleSave() {
    // Envia lista vazia = todos; envia IDs específicos = filtro
    const payload = allSelected ? [] : (selected || [])
    saveMutation.mutate(payload)
  }

  const calendars = data?.calendars || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon sx={{ fontSize: 20 }} />
        Filtrar calendários
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Selecione quais calendários da conta devem ser sincronizados com o Vitalis.
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Não foi possível carregar os calendários. Verifique a conexão.
          </Alert>
        )}

        {!isLoading && !isError && (
          <>
            {/* "Todos os calendários" */}
            <Box
              onClick={handleSelectAll}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1, py: 0.75, mb: 0.5,
                border: '1px solid', borderRadius: '8px',
                borderColor: allSelected ? 'primary.main' : 'divider',
                bgcolor: allSelected ? 'primary.50' : 'transparent',
                cursor: 'pointer',
                '&:hover': { bgcolor: allSelected ? 'primary.50' : '#f8fafc' },
              }}
            >
              <Checkbox
                checked={allSelected}
                onChange={handleSelectAll}
                onClick={e => e.stopPropagation()}
                size="small"
                sx={{ p: 0 }}
              />
              <Box>
                <Typography variant="body2" fontWeight={700}>Todos os calendários</Typography>
                <Typography variant="caption" color="text.secondary">
                  Novos calendários adicionados também serão incluídos automaticamente
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.disabled">ou selecione individualmente</Typography>
            </Divider>

            <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {calendars.map((cal) => {
                const isChecked = !allSelected && (selected || []).includes(cal.id)
                return (
                  <ListItem key={cal.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleToggle(cal.id)}
                      dense
                      sx={{
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isChecked ? 'primary.main' : 'divider',
                        bgcolor: isChecked ? 'primary.50' : 'transparent',
                        px: 1.25, py: 0.75,
                        '&:hover': { bgcolor: isChecked ? 'primary.50' : '#f8fafc' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox
                          checked={isChecked}
                          size="small"
                          sx={{ p: 0 }}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <MuiListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                              bgcolor: cal.color || '#94a3b8',
                            }} />
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {cal.name}
                              {cal.primary && (
                                <Chip label="principal" size="small"
                                  sx={{ ml: 0.75, height: 16, fontSize: '0.58rem', borderRadius: '4px' }} />
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>

            {!allSelected && selected?.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1.5, fontSize: '0.78rem' }}>
                Nenhum calendário selecionado — nenhum evento será importado.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="text" onClick={onClose} disabled={saveMutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading || isError || saveMutation.isPending}
          startIcon={saveMutation.isPending && <CircularProgress size={14} color="inherit" />}
        >
          {saveMutation.isPending ? 'Salvando…' : 'Salvar seleção'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ══════════════════════════════════════════
   ABA 2 — INTEGRAÇÕES
══════════════════════════════════════════ */
function IntegrationCard({ label, icon, description, integration, onDisconnect, onSync, isSyncing, onManageCalendars, children }) {
  const isActive = integration?.status === 'active'

  // Summary chip: "X de Y calendários" or "Todos os calendários"
  const selectedIds = integration?.selected_calendar_ids
  const hasFilter   = selectedIds && selectedIds.length > 0

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        borderColor: isActive ? 'primary.main' : 'divider',
        borderWidth: isActive ? 1.5 : 1,
        transition: 'border-color 0.2s',
        overflow: 'visible',
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: { xs: 2.5, sm: 3 }, pb: 2 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: isActive ? 'primary.main' : 'grey.100',
              color: isActive ? 'white' : 'text.secondary',
              fontSize: 24,
            }}
          >
            {icon}
          </Box>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.25}>
              <Typography fontWeight={700} fontSize="1rem">{label}</Typography>
              {isActive && (
                <Chip
                  label="Conectado"
                  size="small"
                  color="success"
                  icon={<CheckCircleOutlineIcon />}
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                />
              )}
              {integration?.status === 'error' && (
                <Chip label="Com erro" size="small" color="error" sx={{ height: 20, fontSize: '0.68rem' }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" lineHeight={1.4}>
              {description}
            </Typography>
          </Box>
        </Stack>

        {/* Ações quando conectado */}
        {isActive && (
          <Stack direction="row" spacing={1} mt={2} ml={8} flexWrap="wrap" gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                isSyncing
                  ? <CircularProgress size={14} color="inherit" />
                  : <SyncIcon fontSize="small" />
              }
              onClick={onSync}
              disabled={isSyncing}
              sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
            >
              {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
            </Button>
            {onManageCalendars && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterListIcon fontSize="small" />}
                onClick={onManageCalendars}
                sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
              >
                {hasFilter
                  ? `${selectedIds.length} calendário${selectedIds.length !== 1 ? 's' : ''} selecionado${selectedIds.length !== 1 ? 's' : ''}`
                  : 'Filtrar calendários'}
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon fontSize="small" />}
              onClick={onDisconnect}
            >
              Desconectar
            </Button>
          </Stack>
        )}

        {integration?.error_message && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {integration.error_message}
          </Alert>
        )}
      </Box>

      {/* Formulário de conexão — separado visualmente */}
      {!isActive && (
        <>
          <Divider />
          <Box sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
            {children}
          </Box>
        </>
      )}
    </Card>
  )
}

/* ── Popup de ajuda: como gerar App Password da Apple ── */
function AppPasswordHelpDialog({ open, onClose }) {
  const steps = [
    {
      number: 1,
      text: 'Acesse',
      link: { label: 'appleid.apple.com', href: 'https://appleid.apple.com/account/manage' },
      detail: 'e faça login com seu Apple ID.',
    },
    {
      number: 2,
      text: 'Clique em',
      highlight: 'Início da sessão e segurança',
      detail: 'no menu lateral.',
    },
    {
      number: 3,
      text: 'Role até',
      highlight: 'Senhas específicas de apps',
      detail: 'e clique no botão de adicionar (+).',
    },
    {
      number: 4,
      text: 'Dê um nome para a senha',
      detail: '(ex: "Vitalis") e clique em Criar.',
    },
    {
      number: 5,
      text: 'Copie a senha gerada',
      detail: '(formato xxxx-xxxx-xxxx-xxxx) e cole no campo App Password abaixo.',
    },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AppleIcon sx={{ fontSize: 22, color: 'text.primary' }} />
        Como gerar uma App Password
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Alert severity="info" sx={{ mb: 2.5, fontSize: '0.8rem' }}>
          A App Password é necessária porque a Apple não permite usar a senha principal do seu Apple ID em apps de terceiros.
        </Alert>
        <Stack spacing={2}>
          {steps.map((step) => (
            <Stack key={step.number} direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  minWidth: 24, height: 24, borderRadius: '50%',
                  bgcolor: 'primary.main', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, mt: '1px',
                }}
              >
                {step.number}
              </Box>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                {step.text}{' '}
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'inherit', fontWeight: 600 }}
                  >
                    {step.link.label} <OpenInNewIcon sx={{ fontSize: 11, verticalAlign: 'middle' }} />
                  </a>
                )}
                {step.highlight && (
                  <Box component="span" fontWeight={700} color="text.primary">
                    {step.highlight}
                  </Box>
                )}
                {' '}{step.detail}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" onClick={onClose}>Entendi</Button>
      </DialogActions>
    </Dialog>
  )
}

function TabIntegracoes() {
  const queryClient = useQueryClient()

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list().then(r => r.data?.results ?? r.data ?? []),
  })

  const googleIntegration = integrations.find(i => i.source === 'google')
  const appleIntegration  = integrations.find(i => i.source === 'apple')

  /* Google OAuth popup */
  const [googleError, setGoogleError]     = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'GOOGLE_OAUTH_CALLBACK') return

      setGoogleLoading(false)
      if (event.data.status === 'success') {
        queryClient.invalidateQueries(['integrations'])
        setGoogleError('')
      } else {
        setGoogleError(event.data.message || 'Erro ao conectar ao Google Calendar.')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [queryClient])

  const handleGoogleConnect = async () => {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      const { data } = await integrationsApi.googleConnect()
      const popup = window.open(
        data.auth_url,
        'google_oauth',
        'width=520,height=640,left=200,top=100'
      )
      if (!popup) {
        setGoogleError('Popup bloqueado pelo navegador. Permita popups para este site.')
        setGoogleLoading(false)
        return
      }
      // Fallback: se o popup fechar sem enviar postMessage, reseta o loading
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer)
          setGoogleLoading(false)
        }
      }, 500)
    } catch (err) {
      setGoogleError(err.response?.data?.detail || 'Erro ao iniciar conexão.')
      setGoogleLoading(false)
    }
  }

  /* Apple CalDAV */
  const {
    register: rApple, handleSubmit: hApple, reset: resetApple,
    formState: { errors: eApple },
  } = useForm({ resolver: zodResolver(appleSchema) })

  const [appleError, setAppleError]         = useState('')
  const [appleSuccess, setAppleSuccess]     = useState(false)
  const [showApplePwd, setShowApplePwd]     = useState(false)
  const [appleHelpOpen, setAppleHelpOpen]   = useState(false)

  const appleConnectMutation = useMutation({
    mutationFn: (data) => integrationsApi.appleConnect(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations'])
      resetApple()
      setAppleSuccess(true)
      setAppleError('')
      setTimeout(() => setAppleSuccess(false), 3000)
    },
    onError: (err) => {
      setAppleError(err.response?.data?.detail || 'Falha ao conectar. Verifique suas credenciais.')
    },
  })

  /* Disconnect */
  const disconnectMutation = useMutation({
    mutationFn: (source) => integrationsApi.disconnect(source),
    onSuccess: () => queryClient.invalidateQueries(['integrations']),
  })

  /* Calendar picker dialog */
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [pickerSource, setPickerSource] = useState(null)

  function openPicker(source) {
    setPickerSource(source)
    setPickerOpen(true)
  }

  /* Sync */
  const [syncSnack, setSyncSnack] = useState(null)  // { severity, message }

  const syncMutation = useMutation({
    mutationFn: () => integrationsApi.sync(),
    onMutate:  () => setSyncSnack({ severity: 'info',    message: 'Sincronizando calendário…' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations'])
      queryClient.invalidateQueries(['shifts'])
      setSyncSnack({ severity: 'success', message: 'Calendário sincronizado com sucesso!' })
    },
    onError: (err) => {
      setSyncSnack({ severity: 'error', message: err.response?.data?.detail || 'Erro ao sincronizar. Tente novamente.' })
    },
  })

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Conecte seus calendários externos para visualizar plantões e compromissos em um só lugar.
        A sincronização é somente leitura — o Vitalis não altera seus dados externos.
      </Typography>

      {/* Google Calendar */}
      <IntegrationCard
        label="Google Calendar"
        icon={<GoogleIcon />}
        description="Importa eventos do Google Calendar automaticamente"
        integration={googleIntegration}
        onDisconnect={() => disconnectMutation.mutate('google')}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        onManageCalendars={googleIntegration?.status === 'active' ? () => openPicker('google') : undefined}
      >
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Ao clicar em conectar, uma janela do Google será aberta para você autorizar o acesso ao seu calendário. O Vitalis nunca modifica seus eventos.
          </Typography>
          {googleError && <Alert severity="error">{googleError}</Alert>}
          <Box>
            <Button
              variant="contained"
              startIcon={googleLoading ? <CircularProgress size={16} color="inherit" /> : <GoogleIcon />}
              onClick={handleGoogleConnect}
              disabled={googleLoading}
            >
              Conectar com o Google
            </Button>
          </Box>
        </Stack>
      </IntegrationCard>

      {/* Apple Calendar */}
      <IntegrationCard
        label="Apple Calendar"
        icon={<AppleIcon />}
        description="Conecta via CalDAV usando seu Apple ID e uma App Password"
        integration={appleIntegration}
        onDisconnect={() => disconnectMutation.mutate('apple')}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        onManageCalendars={appleIntegration?.status === 'active' ? () => openPicker('apple') : undefined}
      >
        <form onSubmit={hApple(d => appleConnectMutation.mutate(d))}>
          <Stack spacing={3}>
            <Alert
              severity="info"
              action={
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => setAppleHelpOpen(true)}
                  title="Como gerar uma App Password"
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              }
            >
              Use uma <strong>App Password</strong> gerada no seu Apple ID —{' '}
              <Box
                component="span"
                onClick={() => setAppleHelpOpen(true)}
                sx={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
              >
                veja como gerar
              </Box>
              .
            </Alert>

            <Stack spacing={2}>
              <TextField
                label="Apple ID (e-mail)"
                fullWidth
                {...rApple('username')}
                error={!!eApple.username}
                helperText={eApple.username?.message}
              />
              <TextField
                label="App Password"
                type={showApplePwd ? 'text' : 'password'}
                fullWidth
                placeholder="xxxx-xxxx-xxxx-xxxx"
                {...rApple('password')}
                error={!!eApple.password}
                helperText={eApple.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowApplePwd(v => !v)} edge="end">
                          {showApplePwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            {appleError   && <Alert severity="error">{appleError}</Alert>}
            {appleSuccess && <Alert severity="success">Apple Calendar conectado!</Alert>}

            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={appleConnectMutation.isPending}
                startIcon={appleConnectMutation.isPending && <CircularProgress size={16} color="inherit" />}
              >
                Conectar Apple Calendar
              </Button>
            </Box>
          </Stack>
        </form>
      </IntegrationCard>

      <AppPasswordHelpDialog open={appleHelpOpen} onClose={() => setAppleHelpOpen(false)} />

      {/* Dialog de seleção de calendários */}
      {pickerSource && (
        <CalendarPickerDialog
          open={pickerOpen}
          source={pickerSource}
          integration={pickerSource === 'google' ? googleIntegration : appleIntegration}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Snackbar de feedback da sincronização */}
      <Snackbar
        open={!!syncSnack}
        autoHideDuration={syncSnack?.severity === 'info' ? null : 4000}
        onClose={() => setSyncSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={syncSnack?.severity || 'info'}
          onClose={() => setSyncSnack(null)}
          sx={{ width: '100%', boxShadow: 3 }}
          icon={syncSnack?.severity === 'info' ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {syncSnack?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

/* ══════════════════════════════════════════
   ABA 3 — NOTIFICAÇÕES
══════════════════════════════════════════ */
function TabNotificacoes() {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get().then(r => r.data),
  })

  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (prefs && !form) setForm(prefs)
  }, [prefs, form])

  const mutation = useMutation({
    mutationFn: (data) => preferencesApi.update(data).then(r => r.data),
    onSuccess: (data) => {
      setForm(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading || !form) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
  }

  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }))
  const setVal  = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <Box>
      {/* Lembretes de plantão */}
      <Section title="Lembretes de plantão">
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={form.notify_shift_reminder}
                onChange={() => toggle('notify_shift_reminder')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>Lembrete antes do plantão</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receba uma notificação antes do início de cada plantão
                </Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{ justifyContent: 'space-between', mx: 0, width: '100%' }}
          />

          {form.notify_shift_reminder && (
            <Box px={1}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Antecedência: <strong>{form.shift_reminder_hours} hora{form.shift_reminder_hours !== 1 ? 's' : ''}</strong>
              </Typography>
              <Slider
                value={form.shift_reminder_hours}
                onChange={(_, v) => setVal('shift_reminder_hours', v)}
                min={1}
                max={48}
                step={1}
                marks={[
                  { value: 1,  label: '1h' },
                  { value: 12, label: '12h' },
                  { value: 24, label: '24h' },
                  { value: 48, label: '48h' },
                ]}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      </Section>

      {/* Alertas financeiros */}
      <Section title="Alertas financeiros">
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={form.notify_payment_due}
                onChange={() => toggle('notify_payment_due')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>Alerta de vencimento próximo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avisa quando um pagamento estiver próximo da data de recebimento prevista
                </Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{ justifyContent: 'space-between', mx: 0, width: '100%' }}
          />

          {form.notify_payment_due && (
            <Box px={1}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Alertar com: <strong>{form.payment_due_days} dia{form.payment_due_days !== 1 ? 's' : ''} de antecedência</strong>
              </Typography>
              <Slider
                value={form.payment_due_days}
                onChange={(_, v) => setVal('payment_due_days', v)}
                min={1}
                max={14}
                step={1}
                marks={[
                  { value: 1,  label: '1d' },
                  { value: 3,  label: '3d' },
                  { value: 7,  label: '7d' },
                  { value: 14, label: '14d' },
                ]}
                color="primary"
              />
            </Box>
          )}

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={form.notify_payment_overdue}
                onChange={() => toggle('notify_payment_overdue')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>Alerta de pagamento em atraso</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avisa quando um pagamento esperado não foi confirmado na data prevista
                </Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{ justifyContent: 'space-between', mx: 0, width: '100%' }}
          />
        </Stack>
      </Section>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Preferências salvas!</Alert>}
      {mutation.error && (
        <Alert severity="error" sx={{ mb: 2 }}>Erro ao salvar preferências.</Alert>
      )}

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          startIcon={mutation.isPending && <CircularProgress size={16} color="inherit" />}
        >
          Salvar preferências
        </Button>
      </Box>
    </Box>
  )
}

/* ══════════════════════════════════════════
   ABA 4 — CONTA
══════════════════════════════════════════ */
function TabConta() {
  const user    = useAuthStore(s => s.user)
  const logout  = useAuthStore(s => s.logout)
  const refresh = useAuthStore(s => s.refreshToken)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const {
    register: rDel, handleSubmit: hDel, reset: resetDel,
    formState: { errors: eDel },
  } = useForm({ resolver: zodResolver(deleteSchema) })

  const deleteMutation = useMutation({
    mutationFn: (data) =>
      profileApi.deleteAccount({ password: data.password, refresh }).then(r => r.data),
    onSuccess: () => {
      logout()
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.password || err.response?.data?.detail || 'Senha incorreta.')
    },
  })

  const handleCloseDelete = () => {
    setDeleteOpen(false)
    resetDel()
    setDeleteError('')
  }

  return (
    <Box>
      {/* Plano */}
      <Section title="Plano">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box flex={1}>
            <Typography fontWeight={600}>Vitalis Free</Typography>
            <Typography variant="body2" color="text.secondary">
              Acesso completo durante o período beta. Funcionalidades premium em breve.
            </Typography>
          </Box>
          <Chip label="Beta" color="primary" size="small" />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={0.5}>
          {[
            'Agenda completa de plantões',
            'Gestão de instituições e unidades',
            'Controle financeiro e recebíveis',
            'Integração com Google e Apple Calendar',
          ].map((feature) => (
            <Stack key={feature} direction="row" spacing={1} alignItems="center">
              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{feature}</Typography>
            </Stack>
          ))}
        </Stack>
      </Section>

      {/* Informações da conta */}
      <Section title="Informações da conta">
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">E-mail</Typography>
            <Typography variant="body2" fontWeight={500}>{user?.email}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Membro desde</Typography>
            <Typography variant="body2" fontWeight={500}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                : '—'}
            </Typography>
          </Stack>
        </Stack>
      </Section>

      {/* Zona de perigo */}
      <Card
        variant="outlined"
        sx={{ borderColor: 'error.main', borderWidth: 1 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} color="error" mb={1}>
            Zona de perigo
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados —
            plantões, faturas e configurações — serão removidos imediatamente.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Excluir conta
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Esta ação é <strong>irreversível</strong>. Digite sua senha para confirmar a exclusão.
          </DialogContentText>
          <form id="delete-form" onSubmit={hDel(d => deleteMutation.mutate(d))}>
            <TextField
              label="Senha"
              type="password"
              fullWidth
              autoFocus
              {...rDel('password')}
              error={!!eDel.password}
              helperText={eDel.password?.message}
            />
            {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} variant="text">Cancelar</Button>
          <Button
            type="submit"
            form="delete-form"
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending && <CircularProgress size={16} color="inherit" />}
          >
            Excluir conta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/* ══════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════ */
const TABS = [
  { label: 'Perfil',        icon: <PersonOutlinedIcon fontSize="small" />,            component: <TabPerfil /> },
  { label: 'Integrações',   icon: <CalendarMonthOutlinedIcon fontSize="small" />,     component: <TabIntegracoes /> },
  { label: 'Notificações',  icon: <NotificationsOutlinedIcon fontSize="small" />,     component: <TabNotificacoes /> },
  { label: 'Conta',         icon: <ManageAccountsOutlinedIcon fontSize="small" />,    component: <TabConta /> },
]

export default function Ajustes() {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 720, mx: 'auto' }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Ajustes</Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie seu perfil, integrações e preferências do Vitalis
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 500 },
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {TABS.map((t, i) => (
          <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* Conteúdo */}
      {TABS[tab].component}
    </Box>
  )
}
