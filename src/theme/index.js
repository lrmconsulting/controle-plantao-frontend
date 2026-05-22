import { createTheme } from '@mui/material/styles'

const vitalisTheme = createTheme({
  palette: {
    primary: {
      main:        '#0d9488', // teal-600
      light:       '#14b8a6', // teal-500
      dark:        '#0f766e', // teal-700
      contrastText: '#ffffff',
    },
    secondary: {
      main:        '#475569', // slate-600
      light:       '#94a3b8', // slate-400
      dark:        '#1e293b', // slate-800
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // slate-50
      paper:   '#ffffff',
    },
    text: {
      primary:   '#0f172a', // slate-900
      secondary: '#475569', // slate-600
      disabled:  '#94a3b8', // slate-400
    },
    divider: '#e2e8f0', // slate-200
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error:   { main: '#ef4444' },
    info:    { main: '#3b82f6' },
  },

  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: {
      fontFamily: '"Space Mono", monospace',
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
    },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
    '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
    ...Array(21).fill('none'),
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          '&:hover': { background: 'linear-gradient(135deg, #0d9488, #0f766e)' },
        },
        outlined: {
          borderColor: '#e2e8f0',
          '&:hover': { borderColor: '#0d9488', background: '#f0fdfa' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#f8fafc',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0d9488' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0d9488',
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.72rem' },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          '&.Mui-selected': { color: '#0d9488' },
          minWidth: 64,
        },
        label: {
          fontSize: '0.65rem',
          fontWeight: 600,
          '&.Mui-selected': { fontSize: '0.65rem' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #f1f5f9',
          boxShadow: 'none',
          color: '#0f172a',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none', borderRight: '1px solid #f1f5f9' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#f1f5f9' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          '&.Mui-selected': {
            backgroundColor: '#f0fdfa',
            color: '#0d9488',
            '& .MuiListItemIcon-root': { color: '#0d9488' },
            '&:hover': { backgroundColor: '#ccfbf1' },
          },
          '&:hover': { backgroundColor: '#f8fafc' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 40, color: '#94a3b8' },
      },
    },
  },
})

export default vitalisTheme
