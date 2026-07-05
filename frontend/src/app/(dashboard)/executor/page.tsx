'use client';

import { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, MenuItem,
  Select, FormControl, InputLabel, Chip, Divider, CircularProgress,
  Alert, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import { PlayArrow, Psychology, ContentCopy, Clear } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { executorApi, oauthApi, aiApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export default function ExecutorPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [oauthProfileId, setOauthProfileId] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const { data: oauthProfiles } = useQuery({
    queryKey: ['oauth-profiles'],
    queryFn: () => oauthApi.listProfiles(),
  });

  const executeMutation = useMutation({
    mutationFn: (payload: any) => executorApi.execute(payload),
    onSuccess: (data: any) => {
      setResult(data);
      setActiveTab(1);
      const status = data.response?.statusCode;
      if (status >= 200 && status < 300) {
        enqueueSnackbar(`Sucesso: ${status} — ${data.durationMs}ms`, { variant: 'success' });
      } else {
        enqueueSnackbar(`Erro: ${status}`, { variant: 'error' });
      }
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || 'Erro na execução', { variant: 'error' });
    },
  });

  const handleExecute = () => {
    if (!url) {
      enqueueSnackbar('URL é obrigatória', { variant: 'warning' });
      return;
    }

    let parsedHeaders = {};
    try {
      parsedHeaders = headers ? JSON.parse(headers) : {};
    } catch {
      enqueueSnackbar('Headers JSON inválido', { variant: 'error' });
      return;
    }

    executeMutation.mutate({
      method,
      url,
      headers: parsedHeaders,
      body: body || undefined,
      oauthProfileId: oauthProfileId || undefined,
    });
  };

  const handleAiDiagnose = async () => {
    if (!result) return;
    setDiagnosing(true);
    try {
      const diagnosis: any = await aiApi.diagnose({
        statusCode: result.response?.statusCode,
        errorMessage: result.status === 'error' ? JSON.stringify(result.response?.body) : undefined,
        payload: JSON.stringify(result.request?.body),
        context: 'SAP Ariba API',
      });
      setAiDiagnosis(diagnosis);
      setActiveTab(2);
    } catch {
      enqueueSnackbar('Erro ao chamar IA', { variant: 'error' });
    } finally {
      setDiagnosing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copiado!', { variant: 'info' });
  };

  const profiles = (oauthProfiles as any[]) || [];

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold">Executor de APIs</Typography>
        <Typography variant="body2" color="text.secondary">
          Ferramenta de testes — SAP Ariba, Business Network, Commerce Automation
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Request Panel */}
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" mb={2}>Configurar Request</Typography>

              <Box display="flex" gap={1} mb={2}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Método</InputLabel>
                  <Select value={method} onChange={(e) => setMethod(e.target.value)} label="Método">
                    {HTTP_METHODS.map((m) => (
                      <MenuItem key={m} value={m}>
                        <Chip label={m} size="small" color={
                          m === 'GET' ? 'success' : m === 'POST' ? 'primary' :
                          m === 'DELETE' ? 'error' : 'default'
                        } />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  fullWidth
                  label="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://openapi.ariba.com/api/..."
                />
              </Box>

              {profiles.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>OAuth Profile (opcional)</InputLabel>
                  <Select
                    value={oauthProfileId}
                    onChange={(e) => setOauthProfileId(e.target.value)}
                    label="OAuth Profile (opcional)"
                  >
                    <MenuItem value="">— Sem OAuth —</MenuItem>
                    {profiles.map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Typography variant="caption" fontWeight="bold" color="text.secondary">HEADERS</Typography>
              <Box mb={2} border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                <Editor
                  height="120px"
                  language="json"
                  value={headers}
                  onChange={(v) => setHeaders(v || '')}
                  theme={editorTheme}
                  options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'off' }}
                />
              </Box>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">BODY</Typography>
                  <Box mb={2} border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                    <Editor
                      height="200px"
                      language="json"
                      value={body}
                      onChange={(v) => setBody(v || '')}
                      theme={editorTheme}
                      options={{ minimap: { enabled: false }, fontSize: 12 }}
                    />
                  </Box>
                </>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={executeMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
                onClick={handleExecute}
                disabled={executeMutation.isPending}
                sx={{ fontWeight: 'bold' }}
              >
                {executeMutation.isPending ? 'Executando...' : 'Executar'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Panel */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 36 }}>
                  <Tab label="Request" sx={{ minHeight: 36, py: 0 }} />
                  <Tab label="Response" sx={{ minHeight: 36, py: 0 }} />
                  <Tab label="IA Diagnóstico" sx={{ minHeight: 36, py: 0 }} />
                </Tabs>

                {result && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={result.response?.statusCode}
                      color={result.status === 'success' ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip label={`${result.durationMs}ms`} size="small" variant="outlined" />
                    <Tooltip title="Diagnóstico IA">
                      <IconButton size="small" onClick={handleAiDiagnose} disabled={diagnosing}>
                        {diagnosing ? <CircularProgress size={16} /> : <Psychology fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {activeTab === 0 && result && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {result.request?.method} {result.request?.url}
                  </Typography>
                  <Box mt={1} border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                    <Editor
                      height="400px"
                      language="json"
                      value={JSON.stringify(result.request, null, 2)}
                      theme={editorTheme}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                    />
                  </Box>
                </Box>
              )}

              {activeTab === 1 && result && (
                <Box position="relative">
                  <Tooltip title="Copiar resposta">
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}
                      onClick={() => copyToClipboard(JSON.stringify(result.response?.body, null, 2))}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                    <Editor
                      height="400px"
                      language="json"
                      value={
                        typeof result.response?.body === 'string'
                          ? result.response.body
                          : JSON.stringify(result.response?.body, null, 2)
                      }
                      theme={editorTheme}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                    />
                  </Box>
                </Box>
              )}

              {activeTab === 2 && aiDiagnosis && (
                <Box>
                  <Alert
                    severity={
                      aiDiagnosis.priority === 'critical' ? 'error' :
                      aiDiagnosis.priority === 'high' ? 'warning' : 'info'
                    }
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {aiDiagnosis.diagnosis}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">CAUSA PROVÁVEL</Typography>
                      <Typography variant="body2" mt={0.5}>{aiDiagnosis.possibleCause}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">SOLUÇÃO SUGERIDA</Typography>
                      <Typography variant="body2" mt={0.5}>{aiDiagnosis.suggestedFix}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">PASSOS DE INVESTIGAÇÃO</Typography>
                      <Box mt={0.5}>
                        {aiDiagnosis.investigationSteps?.map((step: string, i: number) => (
                          <Typography key={i} variant="body2">• {step}</Typography>
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label={`Confiança: ${aiDiagnosis.confidence}%`} color="primary" size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip
                        label={`Prioridade: ${aiDiagnosis.priority}`}
                        color={aiDiagnosis.priority === 'critical' ? 'error' : aiDiagnosis.priority === 'high' ? 'warning' : 'default'}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {!result && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height={400}
                  color="text.secondary"
                >
                  <Typography>Execute uma API para ver o resultado aqui</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
