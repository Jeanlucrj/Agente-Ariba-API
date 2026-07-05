'use client';

import { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, IconButton, Tooltip,
} from '@mui/material';
import {
  VpnKey, Add, CheckCircle, Error, Refresh, Delete, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oauthApi } from '@/services/api';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';

export default function OAuthPage() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [tokenResults, setTokenResults] = useState<Record<string, any>>({});

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      tokenUrl: '',
      grantType: 'client_credentials',
      clientId: '',
      clientSecret: '',
      scope: '',
      realm: '',
      appKey: '',
    },
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['oauth-profiles'],
    queryFn: () => oauthApi.listProfiles(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => oauthApi.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-profiles'] });
      setOpenCreate(false);
      reset();
      enqueueSnackbar('Perfil OAuth criado!', { variant: 'success' });
    },
  });

  const testToken = async (profileId: string) => {
    try {
      const result: any = await oauthApi.testToken(profileId);
      setTokenResults((prev) => ({ ...prev, [profileId]: { ...result, ok: true } }));
      enqueueSnackbar('Token válido!', { variant: 'success' });
    } catch (err: any) {
      setTokenResults((prev) => ({
        ...prev,
        [profileId]: { ok: false, error: err?.response?.data?.message || 'Erro' },
      }));
      enqueueSnackbar('Falha ao obter token', { variant: 'error' });
    }
  };

  const invalidate = async (profileId: string) => {
    try {
      await oauthApi.invalidateToken(profileId);
      setTokenResults((prev) => {
        const n = { ...prev };
        delete n[profileId];
        return n;
      });
      enqueueSnackbar('Token invalidado', { variant: 'info' });
    } catch {}
  };

  const profileList = (profiles as any[]) || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">OAuth Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerenciamento de autenticação OAuth SAP Ariba
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          Novo Perfil
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {profileList.map((profile: any) => {
            const result = tokenResults[profile.id];
            return (
              <Grid item xs={12} md={6} lg={4} key={profile.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{profile.name}</Typography>
                        <Chip
                          label={profile.grantType.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <VpnKey color="primary" />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block">
                      {profile.tokenUrl}
                    </Typography>

                    {profile.realm && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Realm: {profile.realm}
                      </Typography>
                    )}

                    {result && (
                      <Alert
                        severity={result.ok ? 'success' : 'error'}
                        sx={{ mt: 1, py: 0 }}
                        icon={result.ok ? <CheckCircle fontSize="small" /> : <Error fontSize="small" />}
                      >
                        {result.ok
                          ? `Expira em ${result.expiresIn}s — Token: ${result.masked}`
                          : result.error}
                      </Alert>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<VpnKey />}
                        onClick={() => testToken(profile.id)}
                        sx={{ flex: 1 }}
                      >
                        Testar Token
                      </Button>
                      <Tooltip title="Invalidar cache">
                        <IconButton size="small" onClick={() => invalidate(profile.id)}>
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {profileList.length === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <VpnKey sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Nenhum perfil OAuth cadastrado. Clique em "Novo Perfil" para começar.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Perfil OAuth SAP Ariba</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField {...field} label="Nome do Perfil" size="small" required fullWidth />
              )}
            />
            <Controller
              name="tokenUrl"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Token URL"
                  size="small"
                  required
                  fullWidth
                  placeholder="https://api.ariba.com/v2/oauth/token"
                />
              )}
            />
            <Box display="flex" gap={1}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} label="Client ID" size="small" required fullWidth />
                )}
              />
              <Controller
                name="clientSecret"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client Secret"
                    type={showSecret ? 'text' : 'password'}
                    size="small"
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <IconButton size="small" onClick={() => setShowSecret(!showSecret)}>
                          {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      ),
                    }}
                  />
                )}
              />
            </Box>
            <Box display="flex" gap={1}>
              <Controller
                name="realm"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Realm" size="small" fullWidth placeholder="mycompany-T" />
                )}
              />
              <Controller
                name="appKey"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="App Key" size="small" fullWidth />
                )}
              />
            </Box>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Scope (opcional)" size="small" fullWidth />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <CircularProgress size={20} /> : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
