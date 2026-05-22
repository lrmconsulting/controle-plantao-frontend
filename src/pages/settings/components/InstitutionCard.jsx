import {
  Card, CardContent, Box, Typography, IconButton, Chip,
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
  last_day:       'últ. dia do mês',
  issue_date:     'emissão da NF',
  first_day_next: '1º dia do mês seg.',
}

export default function InstitutionCard({ institution, onEdit }) {
  const [anchor, setAnchor] = useState(null)
  const queryClient = useQueryClient()

  const archiveMutation = useMutation({
    mutationFn: () => institutionsApi.remove(institution.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['institutions'] }),
  })

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Ícone */}
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={700} noWrap>{institution.name}</Typography>
            {institution.cnpj && (
              <Typography variant="caption" color="text.secondary">{institution.cnpj}</Typography>
            )}
          </Box>

          {/* Menu */}
          <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
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

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${institution.payment_days} dias`}
            size="small"
            sx={{ bgcolor: '#f0fdfa', color: 'primary.dark', fontWeight: 600 }}
          />
          <Chip
            label={PAYMENT_REF_LABELS[institution.payment_ref]}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          />
          <Chip
            label={`${institution.units_count} unidade${institution.units_count !== 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
