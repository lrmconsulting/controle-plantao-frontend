/**
 * AppLayout — PlantãoMed
 * Estética editorial · Logo teal · Badge de plano no header
 */
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, IconButton, Typography, Avatar,
  BottomNavigation, BottomNavigationAction,
  Drawer, useMediaQuery, useTheme,
  Menu, MenuItem, Divider, Tooltip,
} from '@mui/material'
import CalendarMonthIcon        from '@mui/icons-material/CalendarMonth'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import BusinessIcon             from '@mui/icons-material/Business'
import SettingsIcon             from '@mui/icons-material/Settings'
import MenuIcon                 from '@mui/icons-material/Menu'
import LogoutIcon               from '@mui/icons-material/Logout'
import { useAuthStore } from '@/store/authStore'
import { usePlan }      from '@/hooks/usePlan'

/* ── constantes ─────────────────────────────────────────────────────── */
const DRAWER_W = 220
const BG       = '#F3F3F1'
const BG_HOVER = '#E8E8E6'
const BORDER   = 'rgba(0,0,0,0.07)'
const TEAL     = '#0d9488'

const NAV_ITEMS = [
  { label: 'Agenda',     icon: <CalendarMonthIcon sx={{ fontSize: 18 }} />,        path: '/agenda' },
  { label: 'Financeiro', icon: <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />, path: '/financeiro' },
  { label: 'Cadastros',  icon: <BusinessIcon sx={{ fontSize: 18 }} />,             path: '/cadastros' },
  { label: 'Ajustes',   icon: <SettingsIcon sx={{ fontSize: 18 }} />,             path: '/ajustes' },
]

/* ── Badge de plano ─────────────────────────────────────────────────── */
const PLAN_CONFIG = {
  trial:   { label: 'Trial',   bg: '#F59E0B', color: '#fff' },
  basic:   { label: 'Básico',  bg: '#3B82F6', color: '#fff' },
  premium: { label: 'Premium', bg: TEAL,      color: '#fff' },
}

function PlanBadge({ plan }) {
  if (!plan) return null
  const cfg = PLAN_CONFIG[plan]
  if (!cfg) return null
  return (
    <Box sx={{
      px: 1, py: 0.25,
      borderRadius: 99,
      bgcolor: cfg.bg,
      color: cfg.color,
      fontSize: '0.5rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'Inter, sans-serif',
      lineHeight: 1.6,
      userSelect: 'none',
    }}>
      {cfg.label}
    </Box>
  )
}

/* ── Logo: 3 barras animadas (teal) ─────────────────────────────────── */
function LogoBars({ size = 20, hover = true }) {
  const [h, setH] = useState(false)
  const bars = [
    { base: size,           hovered: size * 1.35 },
    { base: size,           hovered: size * 0.65 },
    { base: size,           hovered: size },
  ]
  return (
    <Box
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      sx={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
    >
      {bars.map((bar, i) => (
        <Box key={i} sx={{
          width: 6,
          height: h ? bar.hovered : bar.base,
          bgcolor: TEAL,
          borderRadius: 99,
          transition: 'height 0.25s ease',
        }} />
      ))}
    </Box>
  )
}

/* ── Drawer content ──────────────────────────────────────────────────── */
function DrawerContent({ onNavigate }) {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()

  function handleLogout() { logout(); navigate('/login') }

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%',
      bgcolor: BG, borderRight: `1px solid ${BORDER}`,
    }}>
      {/* Logo row */}
      <Box sx={{ px: 3, py: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LogoBars />
        <Box>
          <Typography sx={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#0A0A0A', lineHeight: 1,
          }}>
            PlantãoMed
          </Typography>
          <Typography sx={{
            fontFamily: 'Inter, sans-serif', fontWeight: 600,
            fontSize: '0.5rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#888', lineHeight: 1, mt: 0.3,
          }}>
            Plantões
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: '1px', bgcolor: BORDER, mx: 2 }} />

      {/* Nav items */}
      <Box sx={{ flex: 1, pt: 1.5, px: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.path)
          return (
            <Box
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.() }}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 1.1, mb: 0.25, borderRadius: '8px', cursor: 'pointer',
                bgcolor: active ? 'rgba(0,0,0,0.07)' : 'transparent',
                '&:hover': { bgcolor: active ? 'rgba(0,0,0,0.09)' : BG_HOVER },
                transition: 'background 0.15s',
              }}
            >
              <Box sx={{ color: active ? '#0A0A0A' : '#888', lineHeight: 0 }}>{item.icon}</Box>
              <Typography sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: active ? 700 : 500,
                fontSize: '0.65rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: active ? '#0A0A0A' : '#666',
              }}>
                {item.label}
              </Typography>
              {active && (
                <Box sx={{ ml: 'auto', width: 4, height: 4, borderRadius: '50%', bgcolor: '#0A0A0A' }} />
              )}
            </Box>
          )
        })}
      </Box>

      {/* User footer */}
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ height: '1px', bgcolor: BORDER, mb: 1.5 }} />
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 1.5, py: 1.25, borderRadius: '8px',
          '&:hover': { bgcolor: BG_HOVER }, transition: 'background 0.15s',
        }}>
          <Avatar sx={{
            width: 28, height: 28, bgcolor: TEAL,
            fontSize: '0.6rem', fontFamily: 'Inter, sans-serif', fontWeight: 700,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.65rem',
              color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name}
            </Typography>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.5rem',
              color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.crm}
            </Typography>
          </Box>
          <Tooltip title="Sair" placement="top">
            <IconButton size="small" onClick={handleLogout}
              sx={{ color: '#bbb', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
              <LogoutIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

/* ── TopBar (mobile) ─────────────────────────────────────────────────── */
function TopBar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [anchor, setAnchor] = useState(null)
  const { effectivePlan }   = usePlan()

  const currentLabel = NAV_ITEMS.find((i) => location.pathname.startsWith(i.path))?.label || 'PlantãoMed'

  function handleLogout() { setAnchor(null); logout(); navigate('/login') }

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center',
      height: 56, px: 2,
      bgcolor: BG, borderBottom: `1px solid ${BORDER}`,
    }}>
      <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1.5, color: '#0A0A0A' }}>
        <MenuIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <LogoBars size={16} hover={false} />
        <Typography sx={{
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0A0A0A',
        }}>
          {currentLabel}
        </Typography>
      </Box>

      {/* Badge + Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlanBadge plan={effectivePlan} />
        <Avatar
          sx={{
            width: 30, height: 30, bgcolor: TEAL,
            fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, cursor: 'pointer',
          }}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      <Menu
        anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.75, minWidth: 160, borderRadius: '12px', border: `1px solid ${BORDER}`, bgcolor: BG, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } } }}
      >
        <MenuItem onClick={() => { navigate('/ajustes'); setAnchor(null) }}
          sx={{ fontSize: '0.75rem', gap: 1.5, fontFamily: 'Inter, sans-serif', py: 1.25 }}>
          <SettingsIcon sx={{ fontSize: 16, color: '#666' }} /> Ajustes
        </MenuItem>
        <Divider sx={{ borderColor: BORDER }} />
        <MenuItem onClick={handleLogout}
          sx={{ fontSize: '0.75rem', gap: 1.5, fontFamily: 'Inter, sans-serif', py: 1.25, color: '#ef4444' }}>
          <LogoutIcon sx={{ fontSize: 16 }} /> Sair
        </MenuItem>
      </Menu>
    </Box>
  )
}

/* ── Desktop Header ──────────────────────────────────────────────────── */
function DesktopHeader() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [anchor, setAnchor] = useState(null)
  const { effectivePlan }   = usePlan()

  const currentLabel = NAV_ITEMS.find((i) => location.pathname.startsWith(i.path))?.label || ''

  function handleLogout() { setAnchor(null); logout(); navigate('/login') }

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center',
      height: 52, px: 3,
      bgcolor: BG, borderBottom: `1px solid ${BORDER}`,
    }}>
      <Typography sx={{
        flex: 1,
        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6rem',
        letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888',
      }}>
        {currentLabel}
      </Typography>

      {/* Badge + Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <PlanBadge plan={effectivePlan} />
        <Avatar
          sx={{
            width: 30, height: 30, bgcolor: TEAL,
            fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.02em',
          }}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      <Menu
        anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.75, minWidth: 170, borderRadius: '12px', border: `1px solid ${BORDER}`, bgcolor: BG, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#0A0A0A', flex: 1 }}>
              {user?.name}
            </Typography>
            <PlanBadge plan={effectivePlan} />
          </Box>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: '#888' }}>
            {user?.email || user?.crm}
          </Typography>
        </Box>
        <MenuItem onClick={() => { navigate('/ajustes'); setAnchor(null) }}
          sx={{ fontSize: '0.75rem', gap: 1.5, fontFamily: 'Inter, sans-serif', py: 1.25 }}>
          <SettingsIcon sx={{ fontSize: 16, color: '#666' }} /> Ajustes
        </MenuItem>
        <Divider sx={{ borderColor: BORDER }} />
        <MenuItem onClick={handleLogout}
          sx={{ fontSize: '0.75rem', gap: 1.5, fontFamily: 'Inter, sans-serif', py: 1.25, color: '#ef4444' }}>
          <LogoutIcon sx={{ fontSize: 16 }} /> Sair
        </MenuItem>
      </Menu>
    </Box>
  )
}

/* ── AppLayout ───────────────────────────────────────────────────────── */
export default function AppLayout() {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentIndex = NAV_ITEMS.findIndex((i) => location.pathname.startsWith(i.path))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: BG }}>
      {/* Sidebar permanente — desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_W, flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_W, boxSizing: 'border-box', bgcolor: BG, border: 'none' },
          }}
        >
          <DrawerContent />
        </Drawer>
      )}

      {/* Drawer temporário — mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_W, bgcolor: BG, border: 'none' } }}
        >
          <DrawerContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      {/* Área principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {isMobile
          ? <TopBar onMenuClick={() => setMobileOpen(true)} />
          : <DesktopHeader />
        }

        <Box component="main" sx={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', pb: isMobile ? 8 : 0 }}>
          <Outlet />
        </Box>

        {isMobile && (
          <BottomNavigation
            value={currentIndex}
            onChange={(_, v) => navigate(NAV_ITEMS[v].path)}
            sx={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100,
              height: 60, bgcolor: BG, borderTop: `1px solid ${BORDER}`,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.5rem !important', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  },
                  color: '#999', '&.Mui-selected': { color: '#0A0A0A' },
                }}
              />
            ))}
          </BottomNavigation>
        )}
      </Box>
    </Box>
  )
}
