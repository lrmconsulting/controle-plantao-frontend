import {
  Box, Typography, IconButton, Chip,
  Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import BusinessIcon from '@mui/icons-material/Business'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { institutionsApi } from '@/api/institutions'

const PAYMENT_REF_LABELS = {
  last_day:       'Últ. dia do mês',
  issue_date:     'Emissão da NF',
  first_day_next: '1º mês seguinte',   // encurtado para não quebrar linha
}

export default function InstitutionCard({ institution, onEdit }) {
  const [anchor, setAnchor] = useState(null)
  const queryClient = useQueryClient()

  const archiveMutation = useMutation({
    mutationFn: () => institutionsApi.remove(institution.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['institutions'] }),
  })

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        // altura uniforme: ícone (40) + padding (20 top + 16 bot) + chips (28) + gap (16) = ~120px
        minHeight: 112,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Linha principal */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 2 }}>
        {/* Ícone */}
        <Box sx={{
          width: 38, height: 38, borderRadius: '8px', flexShrink: 0,
          bgcolor: '#f0fdfa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BusinessIcon sx={{ color: 'primary.main', fontSize: 19 }} />
        </Box>

        {/* Nome + CNPJ */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ fontSize: '0.875rem', lineHeight: 1.35 }}
          >
            {institution.name}
          </Typography>
          {institution.cnpj && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {institution.cnpj}
            </Typography>
          )}
        </Box>

        {/* Menu */}
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} sx={{ flexShrink: 0 }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => { setAnchor(null); onEdit(institution) }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => { setAnchor(null); archiveMutation.mutate() }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><ArchiveIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Arquivar</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Chips — fixados na base do card */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 2,
          pb: 1.75,
          pt: 1.25,
          // nunca quebra linha; excedente fica invisible atrás do overflow hidden
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <Chip
          label={`${institution.payment_days}d`}
          size="small"
          sx={{
            bgcolor: '#f0fdfa', color: 'primary.dark', fontWeight: 700,
            fontSize: '0.7rem', height: 22, borderRadius: '5px', flexShrink: 0,
          }}
        />
        <Chip
          label={PAYMENT_REF_LABELS[institution.payment_ref] ?? institution.payment_ref}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'divider', color: 'text.secondary',
            fontSize: '0.7rem', height: 22, borderRadius: '5px', flexShrink: 0,
          }}
        />
        <Chip
          label={`${institution.units_count} un.`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'divider', color: 'text.secondary',
            fontSize: '0.7rem', height: 22, borderRadius: '5px', flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  )
}
