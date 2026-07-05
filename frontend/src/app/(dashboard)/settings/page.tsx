'use client';

import {
  Box, Card, CardContent, Typography, Switch, FormControlLabel, Divider,
  Grid, Chip, Alert, Avatar, TextField, Button, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Tooltip,
} from '@mui/material';
import {
  Person, Palette, Security, VpnKey, Info, ContentCopy,
  DarkMode, LightMode,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const API_ENDPOINTS = [
  { label: 'Executor', path: 'POST /v1/executor/execute', desc: 'Executa chamadas HTTP para APIs SAP Ariba' },
  { label: 'OAuth Profiles', path: 'GET /v1/oauth/profiles', desc: 'Lista perfis OAuth cadastrados' },
  { label: 'OAuth Token', path: 'POST /v1/oauth/profiles/:id/token', desc: 'Obtém token OAuth' },
  { label: 'APIs Catálogo', path: 'GET /v1/apis', desc: 'Lista APIs cadastradas' },
  { label: 'Analyzer XML', path: 'POST /v1/analyzer/xml', desc: 'Analisa payload cXML' },
  { label: 'Analyzer JSON', path: 'POST /v1/analyzer/json', desc: 'Analisa payload JSON' },
  { label: 'CIG Analyzer', path: 'POST /v1/analyzer/cig', desc: 'Compara fluxo CIG' },
  { label: 'IA Diagnose', path: 'POST /v1/ai/diagnose', desc: 'Diagnóstico IA de erros' },
  { label: 'IA Chat', path: 'POST /v1/ai/chat', desc: 'Chat com especialista IA' },
  { label: 'Knowledge Base', path: 'GET /v1/knowledge-base', desc: 'Base de conhecimento' },
  { label: 'Histórico', path: 'GET /v1/executor/history', desc: 'Histórico de execuções' },
];

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      {icon}
      <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
    </Box>
  );
}

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);
  const theme = useAuthStore((s) => s.theme);
  const toggleTheme = useAuthStore((s) => s.toggleTheme);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copiado!', { variant: 'info' });
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">Configurações</Typography>
        <Typography variant="body2" color="text.secondary">
          Preferências do usuário e informações do sistema
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* User Profile */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionHeader icon={<Person color="primary" />} title="Perfil do Usuário" />

              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 22 }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{user?.name || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">{user?.email || '—'}</Typography>
                  <Chip label={user?.role || '—'} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nome"
                    value={user?.name || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="E-mail"
                    value={user?.email || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Função"
                    value={user?.role || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Security fontSize="small" color={user?.mfaEnabled ? 'success' : 'disabled'} />
                    <Typography variant="body2">
                      MFA: {user?.mfaEnabled ? (
                        <Chip label="Ativo" size="small" color="success" />
                      ) : (
                        <Chip label="Inativo" size="small" color="default" />
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionHeader icon={<Palette color="primary" />} title="Aparência" />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {theme === 'dark' ? <DarkMode /> : <LightMode />}
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Alterna entre tema claro e escuro
                    </Typography>
                  </Box>
                </Box>
                <Switch checked={theme === 'dark'} onChange={toggleTheme} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" icon={<Info />}>
                <Typography variant="body2">
                  <strong>Monaco Editor</strong> acompanha o tema selecionado automaticamente em todas as telas de edição.
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Auth Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <SectionHeader icon={<VpnKey color="primary" />} title="Sessão Atual" />

              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">Sessão ativa com token JWT</Typography>
              </Alert>

              <Typography variant="caption" color="text.secondary">
                Para gerenciar credenciais OAuth do SAP Ariba, acesse <strong>OAuth Manager</strong> no menu lateral.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* API Reference */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <SectionHeader icon={<Info color="primary" />} title="Referência de Endpoints da API" />

              <Typography variant="body2" color="text.secondary" mb={2}>
                Endpoints disponíveis no backend (NestJS) — todos requerem autenticação JWT.
              </Typography>

              <List dense disablePadding>
                {API_ENDPOINTS.map((ep, i) => (
                  <Box key={i}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="bold">{ep.label}</Typography>
                            <Chip
                              label={ep.path}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: 11 }}
                            />
                          </Box>
                        }
                        secondary={ep.desc}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Copiar endpoint">
                          <IconButton size="small" onClick={() => copyToClipboard(ep.path)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {i < API_ENDPOINTS.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
