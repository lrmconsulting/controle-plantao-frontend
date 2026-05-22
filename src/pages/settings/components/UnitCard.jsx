import {
  Card, CardContent, Box, Typography, IconButton,
  Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unitsApi } from '@/api/units'

export default function UnitCard({ unit, onEdit }) {
  const [anchor, setAnchor] = useState(null)
  const queryClient = useQueryClient()

  const archiveMutation = useMutation({
    mutationFn: () => unitsApi.remove(unit.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
    },
  })

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(unit.shift_value)

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Dot colorido */}
          <Box sx={{
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: unit.color || '#0d9488', flexShrink: 0,
          }} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{unit.name}</Typography>
            <Typography variant="caption" color="text.secondary">{formatted} / plantão</Typography>
          </Box>

          <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem onClick={() => { setAnchor(null); onEdit(unit) }}>
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
      </CardContent>
    </Card>
  )
}
