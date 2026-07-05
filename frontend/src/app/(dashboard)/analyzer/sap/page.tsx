'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Alert,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  TextField, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Storage, Psychology, Search, Warning, CheckCircle, Error,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { aiApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const IDOC_EXAMPLE = `EDI_DC40
TABNAM         EDI_DC40
MANDT          100
DOCNUM         0000000000123456
DOCREL         700
STATUS         51
DIRECT         2
OUTMOD         2
EXPRSS
IDOCTYP        ORDERS05
MESTYP         ORDERS
SNDPRT         LS
SNDPOR         SAPLSB001
SNDPRN         ARIBA_SENDER
RCVPRT         LS
RCVPOR         SAPLOC001
RCVPRN         SAPRCV001
CREDAT         20240115
CRETIM         103000
REFMES
ARCKEY

E1EDK01
CURCY          BRL
HWAER          BRL
WKURS          1.00000
ZTERM          NT30
BSART          NB

MESSAGE ERRO:
- Parceiro (partner profile) não configurado: ARIBA_SENDER
- Verificar WE20 para configuração do partner profile`;

const CONTEXTS = [
  'IDoc SAP ECC/S4',
  'WE02 / WE05 Status IDoc',
  'SM58 / SMQ1 / SMQ2 qRFC',
  'SLG1 Application Log',
  'BD87 Reprocessamento IDoc',
  'WE20 Partner Profile',
  'SM30 Table Maintenance',
  'AL11 / SE11 File Monitor',
];

export default function SapAnalyzerPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);

  const [content, setContent] = useState(IDOC_EXAMPLE);
  const [context, setContext] = useState('IDoc SAP ECC/S4');
  const [statusCode, setStatusCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      enqueueSnackbar('Cole o conteúdo do log/IDoc para analisar', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await aiApi.diagnose({
        errorMessage: content.substring(0, 3000),
        statusCode: statusCode ? parseInt(statusCode) : undefined,
        context: `SAP Integration - ${context}`,
        payload: content.substring(0, 2000),
      });
      setResult(res);
    } catch {
      enqueueSnackbar('Erro ao analisar conteúdo SAP', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = (p: string) => {
    if (p === 'critical') return 'error';
    if (p === 'high') return 'warning';
    if (p === 'medium') return 'info';
    return 'success';
  };

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold">SAP Analyzer</Typography>
        <Typography variant="body2" color="text.secondary">
          Diagnóstico IA para logs SAP — IDocs, qRFC, Application Logs, Partner Profiles
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Contexto SAP</InputLabel>
                  <Select value={context} onChange={(e) => setContext(e.target.value)} label="Contexto SAP">
                    {CONTEXTS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Status Code (opcional)"
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                  placeholder="51, 52, 64..."
                  sx={{ width: 180 }}
                />
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? 'Analisando...' : 'Diagnosticar'}
                </Button>
              </Box>

              <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={1}>
                CONTEÚDO DO LOG / IDOC / ERRO SAP
              </Typography>
              <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                <Editor
                  height="420px"
                  language="plaintext"
                  value={content}
                  onChange={(v) => setContent(v || '')}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on', lineNumbers: 'on' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          {result ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Psychology color="primary" />
                      <Typography variant="subtitle2" fontWeight="bold">Diagnóstico IA</Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Chip label={`${result.confidence}% confiança`} size="small" color="primary" />
                      <Chip
                        label={result.priority}
                        size="small"
                        color={priorityColor(result.priority) as any}
                      />
                    </Box>
                  </Box>

                  <Alert severity={priorityColor(result.priority) as any} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{result.diagnosis}</Typography>
                  </Alert>

                  {result.impact && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      <strong>Impacto:</strong> {result.impact}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Causa Provável</Typography>
                  <Typography variant="body2" color="text.secondary">{result.possibleCause}</Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Solução Sugerida</Typography>
                  <Typography variant="body2" color="text.secondary">{result.suggestedFix}</Typography>
                </CardContent>
              </Card>

              {result.investigationSteps?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Passos de Investigação
                    </Typography>
                    <List dense disablePadding>
                      {result.investigationSteps.map((step: string, i: number) => (
                        <ListItem key={i} disableGutters>
                          <Chip label={i + 1} size="small" sx={{ mr: 1, minWidth: 24 }} />
                          <ListItemText
                            primary={step}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {result.source === 'knowledge-base' && (
                <Alert severity="info" icon={<CheckCircle />}>
                  Diagnóstico baseado na Base de Conhecimento local (IA não configurada)
                </Alert>
              )}
            </Box>
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Box textAlign="center" color="text.secondary">
                  <Storage sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Cole um log SAP, IDoc ou mensagem de erro</Typography>
                  <Typography variant="caption" display="block" mt={1}>
                    Suporta: WE02, WE05, SLG1, SM58, SMQ1
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
