import { useState } from 'react'
import {
  Box, Tab, Tabs, Button, Typography,
  Grid, Skeleton, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork'
import { useQuery } from '@tanstack/react-query'
import { institutionsApi } from '@/api/institutions'
import { unitsApi } from '@/api/units'
import InstitutionCard from './components/InstitutionCard'
import InstitutionDrawer from './components/InstitutionDrawer'
import UnitCard from './components/UnitCard'
import UnitDrawer from './components/UnitDrawer'

function EmptyState({ icon, title, description, onAdd, addLabel }) {
  return (
    <Box sx={{
      textAlign: 'center', py: 8, px: 3,
      bgcolor: 'white', borderRadius: 3,
      border: '1px dashed', borderColor: 'divider',
    }}>
      <Box sx={{ color: 'text.disabled', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{description}</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>{addLabel}</Button>
    </Box>
  )
}

export default function Cadastros() {
  const [tab, setTab] = useState(0)
  const [institutionDrawer, setInstitutionDrawer] = useState({ open: false, item: null })
  const [unitDrawer, setUnitDrawer] = useState({ open: false, item: null })

  // Instituições
  const {
    data: institutions,
    isLoading: loadingInstitutions,
    error: instError,
  } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsApi.list({ is_active: true }),
    select: (res) => res.data.results ?? res.data,
  })

  // Unidades — agrupadas por instituição
  const {
    data: units,
    isLoading: loadingUnits,
    error: unitsError,
  } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.list({ is_active: true }),
    select: (res) => res.data.results ?? res.data,
    enabled: tab === 1,
  })

  // Agrupa unidades por institution_name
  const unitsByInstitution = (units || []).reduce((acc, unit) => {
    const key = unit.institution_detail?.name || unit.institution
    if (!acc[key]) acc[key] = []
    acc[key].push(unit)
    return acc
  }, {})

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Cadastros</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie suas instituições e unidades de plantão
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            tab === 0
              ? setInstitutionDrawer({ open: true, item: null })
              : setUnitDrawer({ open: true, item: null })
          }
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          {tab === 0 ? 'Nova instituição' : 'Nova unidade'}
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab
          label="Instituições"
          icon={<BusinessIcon fontSize="small" />}
          iconPosition="start"
          sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
        />
        <Tab
          label="Unidades"
          icon={<MapsHomeWorkIcon fontSize="small" />}
          iconPosition="start"
          sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
        />
      </Tabs>

      {/* ── Tab Instituições ── */}
      {tab === 0 && (
        <>
          {instError && <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar instituições.</Alert>}

          {loadingInstitutions ? (
            <Grid container spacing={2}>
              {[1, 2, 3].map((i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={110} /></Grid>)}
            </Grid>
          ) : institutions?.length === 0 ? (
            <EmptyState
              icon={<BusinessIcon sx={{ fontSize: 48 }} />}
              title="Nenhuma instituição cadastrada"
              description="Cadastre as empresas que pagam seus plantões para começar."
              onAdd={() => setInstitutionDrawer({ open: true, item: null })}
              addLabel="Nova instituição"
            />
          ) : (
            <Grid container spacing={2}>
              {institutions.map((inst) => (
                <Grid item xs={12} sm={6} md={4} key={inst.id}>
                  <InstitutionCard
                    institution={inst}
                    onEdit={(item) => setInstitutionDrawer({ open: true, item })}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── Tab Unidades ── */}
      {tab === 1 && (
        <>
          {unitsError && <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar unidades.</Alert>}

          {loadingUnits ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={72} /></Grid>)}
            </Grid>
          ) : units?.length === 0 ? (
            <EmptyState
              icon={<MapsHomeWorkIcon sx={{ fontSize: 48 }} />}
              title="Nenhuma unidade cadastrada"
              description="Cadastre os locais onde você realiza plantões, vinculados a uma instituição."
              onAdd={() => setUnitDrawer({ open: true, item: null })}
              addLabel="Nova unidade"
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(unitsByInstitution).map(([instName, instUnits]) => (
                <Box key={instName}>
                  <Typography
                    variant="overline"
                    sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}
                  >
                    {instName}
                  </Typography>
                  <Grid container spacing={1.5}>
                    {instUnits.map((unit) => (
                      <Grid item xs={12} sm={6} md={4} key={unit.id}>
                        <UnitCard
                          unit={unit}
                          onEdit={(item) => setUnitDrawer({ open: true, item })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {/* FAB mobile */}
      <Button
        variant="contained"
        onClick={() =>
          tab === 0
            ? setInstitutionDrawer({ open: true, item: null })
            : setUnitDrawer({ open: true, item: null })
        }
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed', bottom: 80, right: 20,
          borderRadius: 99, px: 2.5, py: 1.5,
          boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
          zIndex: 1000,
        }}
        startIcon={<AddIcon />}
      >
        {tab === 0 ? 'Instituição' : 'Unidade'}
      </Button>

      {/* Drawers */}
      <InstitutionDrawer
        open={institutionDrawer.open}
        institution={institutionDrawer.item}
        onClose={() => setInstitutionDrawer({ open: false, item: null })}
      />
      <UnitDrawer
        open={unitDrawer.open}
        unit={unitDrawer.item}
        onClose={() => setUnitDrawer({ open: false, item: null })}
      />
    </Box>
  )
}
