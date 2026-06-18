/**
 * Vitalis MUI Theme
 * Estética editorial — design system ai-automation.
 * Fundo cream #F3F3F1 · Inter body · accent teal (marca Vitalis)
 */
import { createTheme } from '@mui/material/styles'

const CREAM      = '#F3F3F1'
const CREAM_DARK = '#EBEBEA'
const INK        = '#0A0A0A'
const BORDER     = 'rgba(0,0,0,0.07)'

const vitalisTheme = createTheme({
  palette: {
    primary: {
      main:        '#0d9488',
      light:       '#14b8a6',
      dark:        '#0f766e',
      contrastText: '#ffffff',
    },
    secondary: {
      main:        '#333333',
      light:       '#666666',
      dark:        '#0A0A0A',
      contrastText: '#ffffff',
    },
    background: {
      default: CREAM,
      paper:   '#FAFAF8',
    },
    text: {
      primary:   INK,
      secondary: '#555555',
      disabled:  '#AAAAAA',
    },
    divider: BORDER,
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error:   { main: '#dc2626' },
    info:    { main: '#2563eb' },
  },

  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.04em' },
    h2: { fontWeight: 600, letterSpacing: '-0.03em' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.6rem',
      letterSpacing: '0.2em',
      fontWeight: 700,
    },
    caption: { fontSize: '0.65rem', letterSpacing: '0.05em' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)',
    '0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    '0 16px 48px rgba(0,0,0,0.1)',
    ...Array(20).fill('none'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: CREAM,
          fontFamily: '"Inter", system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          padding: '10px 24px',
          fontWeight: 700,
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          backgroundColor: '#0d9488',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#0f766e',
            transform: 'scale(1.02)',
          },
        },
        outlined: {
          borderColor: BORDER,
          borderWidth: '1.5px',
          '&:hover': { borderColor: 'rgba(0,0,0,0.2)', backgroundColor: CREAM_DARK },
        },
        text: {
          color: '#666',
          '&:hover': { color: INK, backgroundColor: CREAM_DARK },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          fontWeight: 700,
          fontSize: '0.55rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          height: 24,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid ' + BORDER,
          backgroundColor: '#FAFAF8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: '#FAFAF8' },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FAFAF8',
            fontSize: '0.85rem',
            '& fieldset': { borderColor: BORDER },
            '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#0d9488', borderWidth: '1.5px' },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#888',
            '&.Mui-focused': { color: '#0d9488' },
          },
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: CREAM, border: 'none', boxShadow: 'none' },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: CREAM,
          borderBottom: '1px solid ' + BORDER,
          boxShadow: 'none',
          color: INK,
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: BORDER } },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 6px',
          width: 'calc(100% - 12px)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,0,0,0.07)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.09)' },
          },
          '&:hover': { backgroundColor: CREAM_DARK },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 36, color: '#888' } },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: { height: 60, borderTop: '1px solid ' + BORDER, backgroundColor: CREAM },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: '#999', '&.Mui-selected': { color: INK }, minWidth: 64 },
        label: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, backgroundColor: '#FAFAF8', border: '1px solid ' + BORDER },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid ' + BORDER,
          backgroundColor: CREAM,
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.8rem',
          '&:hover': { backgroundColor: CREAM_DARK },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: CREAM,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#888',
            borderBottom: '1px solid ' + BORDER,
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: BORDER, fontFamily: '"Inter", sans-serif' },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#888',
          '&.Mui-selected': { color: INK },
        },
      },
    },

    MuiTabs: {
      styleOverrides: { indicator: { backgroundColor: INK } },
    },
  },
})

export default vitalisTheme
