'use client';

import { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, InputAdornment, Switch, FormControlLabel, Divider,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Api, Refresh, Close,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apisApi, oauthApi } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';

const MODULES = [
  'Sourcing', 'Contracts', 'Buying', 'Supplier Management',
  'Commerce Automation', 'Business Network', 'Analytics', 'Catalog', 'Custom',
];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'default'> = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'default', DELETE: 'error',
};

const DEFAULT_VALUES = {
  name: '', description: '', module: 'Custom', endpoint: '', method: 'GET',
  requiresOAuth: true, oauthProfileId: '', documentation: '', tags: '',
};

export default function ApisPage() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [page] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { control, handleSubmit, reset, setValue } = useForm({ defaultValues: DEFAULT_VALUES });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['apis', search, filterModule, filterMethod, page],
    queryFn: () => apisApi.list({ search: search || undefined, module: filterModule || undefined, method: filterMethod || undefined, page, limit: 50 }),
  });

  const { data: oauthProfiles } = useQuery({
    queryKey: ['oauth-profiles'],
    queryFn: () => oauthApi.listProfiles(),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => editing ? apisApi.update(editing.id, d) : apisApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      queryClient.invalidateQueries({ queryKey: ['api-stats'] });
      enqueueSnackbar(editing ? 'API atualizada!' : 'API criada!', { variant: 'success' });
      handleClose();
    },
    onError: () => enqueueSnackbar('Erro ao salvar API', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      queryClient.invalidateQueries({ queryKey: ['api-stats'] });
      enqueueSnackbar('API removida', { variant: 'info' });
      setDeleteTarget(null);
    },
  });

  const handleClose = () => {
    setOpenForm(false);
    setEditing(null);
    reset(DEFAULT_VALUES);
  };

  const handleEdit = (api: any) => {
    setEditing(api);
    reset({
      name: api.name,
      description: api.description || '',
      module: api.module,
      endpoint: api.endpoint,
      method: api.method,
      requiresOAuth: api.requiresOAuth,
      oauthProfileId: api.oauthProfileId || '',
      documentation: api.documentation || '',
      tags: api.tags?.join(', ') || '',
    });
    setOpenForm(true);
  };

  const onSubmit = (d: any) => {
    const payload = {
      ...d,
      tags: d.tags ? d.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      oauthProfileId: d.oauthProfileId || undefined,
    };
    createMutation.mutate(payload);
  };

  const apis = (data as any)?.items || [];
  const total = (data as any)?.total || 0;
  const profiles = (oauthProfiles as any[]) || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Catálogo de APIs</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} APIs SAP Ariba cadastradas
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Atualizar"><IconButton onClick={() => refetch()}><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenForm(true)}>Nova API</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Módulo</InputLabel>
              <Select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} label="Módulo">
                <MenuItem value="">Todos</MenuItem>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Método</InputLabel>
              <Select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} label="Método">
                <MenuItem value="">Todos</MenuItem>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Módulo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Endpoint</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>OAuth</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : apis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Api sx={{ fontSize: 40, color: 'text.secondary', mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography color="text.secondary">
                    Nenhuma API cadastrada. Clique em "Nova API" para começar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              apis.map((api: any) => (
                <TableRow key={api.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{api.name}</Typography>
                    {api.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {api.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={api.module} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={api.method} size="small" color={METHOD_COLORS[api.method] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {api.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={api.requiresOAuth ? 'Sim' : 'Não'}
                      size="small"
                      color={api.requiresOAuth ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {api.tags?.slice(0, 3).map((tag: string) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEdit(api)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(api)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {editing ? 'Editar API' : 'Nova API SAP Ariba'}
            <IconButton size="small" onClick={handleClose}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Controller name="name" control={control} rules={{ required: true }}
                  render={({ field }) => <TextField {...field} label="Nome da API" size="small" required fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller name="module" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Módulo</InputLabel>
                      <Select {...field} label="Módulo">
                        {MODULES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller name="method" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Método HTTP</InputLabel>
                      <Select {...field} label="Método HTTP">
                        {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={9}>
                <Controller name="endpoint" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Endpoint" size="small" required fullWidth
                      placeholder="/api/sourcing-projects/v1/{realm}" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller name="description" control={control}
                  render={({ field }) => <TextField {...field} label="Descrição" size="small" fullWidth multiline rows={2} />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="requiresOAuth" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Requer OAuth"
                    />
                  )}
                />
              </Grid>
              {profiles.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Controller name="oauthProfileId" control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Perfil OAuth (opcional)</InputLabel>
                        <Select {...field} label="Perfil OAuth (opcional)">
                          <MenuItem value="">— Nenhum —</MenuItem>
                          {profiles.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Controller name="tags" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Tags (separadas por vírgula)" size="small" fullWidth
                      placeholder="oauth, sourcing, v1" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Controller name="documentation" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Documentação / Notas" size="small" fullWidth multiline rows={3} />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : (editing ? 'Salvar' : 'Criar')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remover API</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja desativar a API <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button
            color="error" variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? <CircularProgress size={18} /> : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
