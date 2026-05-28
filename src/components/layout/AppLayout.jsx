import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, IconButton, Typography, Avatar,
  BottomNavigation, BottomNavigationAction, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  useMediaQuery, useTheme, Divider, Menu, MenuItem,
} from '@mui/material'
import CalendarMonthIcon        from '@mui/icons-material/CalendarMonth'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import BusinessIcon             from '@mui/icons-material/Business'
import SettingsIcon             from '@mui/icons-material/Settings'
import MenuIcon                 from '@mui/icons-material/Menu'
import LogoutIcon               from '@mui/icons-material/Logout'
import { useAuthStore } from '@/store/authStore'

const DRAWER_WIDTH = 240

const navItems = [
  { label: 'Agenda',      icon: <CalendarMonthIcon />,         path: '/agenda' },
  { label: 'Financeiro',  icon: <AccountBalanceWalletIcon />,  path: '/financeiro' },
  { label: 'Cadastros',   icon: <BusinessIcon />,              path: '/cadastros' },
  { label: 'Ajustes',     icon: <SettingsIcon />,              path: '/ajustes' },
]

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [avatarAnchor, setAvatarAnchor] = useState(null)

  function handleLogout() {
    setAvatarAnchor(null)
    logout()
    navigate('/login')
  }

  const currentIndex = navItems.findIndex(
    (item) => location.pathname.startsWith(item.path)
  )

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: 'text.primary' }}
        >
          Vitalis
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Controle de Plantões
        </Typography>
      </Box>
      <Divider />

      {/* Nav items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname.startsWith(item.path)
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={selected}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '0.875rem' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* User info + logout */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.crm}</Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleLogout}
          title="Sair"
          sx={{ color: 'text.disabled', flexShrink: 0, '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar — desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Drawer temporário — mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* AppBar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, fontSize: '1rem' }}>
              {navItems.find((i) => location.pathname.startsWith(i.path))?.label || 'Vitalis'}
            </Typography>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', cursor: 'pointer' }}
              onClick={(e) => setAvatarAnchor(e.currentTarget)}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Menu
              anchorEl={avatarAnchor}
              open={Boolean(avatarAnchor)}
              onClose={() => setAvatarAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { mt: 0.75, minWidth: 160, borderRadius: '8px' } } }}
            >
              <MenuItem
                onClick={() => { navigate('/ajustes'); setAvatarAnchor(null) }}
                sx={{ fontSize: '0.85rem', gap: 1.25 }}
              >
                <SettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                Ajustes
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{ fontSize: '0.85rem', gap: 1.25, color: 'error.main' }}
              >
                <LogoutIcon fontSize="small" />
                Sair
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            pb: isMobile ? 8 : 0, // espaço para bottom nav
          }}
        >
          <Outlet />
        </Box>

        {/* Bottom Navigation — mobile */}
        {isMobile && (
          <BottomNavigation
            value={currentIndex}
            onChange={(_, newValue) => navigate(navItems[newValue].path)}
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        )}
      </Box>
    </Box>
  )
}
