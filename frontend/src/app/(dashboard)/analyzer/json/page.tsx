'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Alert,
  CircularProgress, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { DataObject, CheckCircle, Error, Analytics } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { analyzerApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const EXAMPLE_JSON = JSON.stringify({
  orderRequest: {
    orderDate: '2024-01-15T10:30:00Z',
    orderID: 'PO-2024-001',
    buyer: {
      organizationID: 'AN01234567890',
      name: 'Empresa Compradora Ltda',
    },
    supplier: {
      organizationID: 'AN09876543210',
    },
    lineItems: [
      {
        lineNumber: 1,
        quantity: 10,
        unitPrice: {
          amount: 150.00,
          currency: 'BRL',
        },
        description: 'Produto de Teste',
        supplierPartID: 'PROD-001',
      },
    ],
    totalAmount: {
      amount: 1500.00,
      currency: 'BRL',
    },
  },
}, null, 2);

function renderStructure(obj: any, depth = 0): React.ReactNode {
  if (depth > 2) return <Chip label={typeof obj === 'string' ? `"${obj}"` : String(obj)} size="small" sx={{ m: 0.2 }} />;
  if (typeof obj === 'string') return `"${obj}"`;
  if (Array.isArray(obj)) return <Chip label={`Array[${obj.length}]`} size="small" color="primary" variant="outlined" />;
  if (typeof obj === 'object' && obj !== null) {
    return (
      <Box sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
        {Object.entries(obj).map(([k, v]) => (
          <Box key={k} display="flex" alignItems="center" gap={1} mb={0.3}>
            <Typography variant="caption" color="primary" fontWeight="bold">{k}:</Typography>
            {typeof v === 'object' ? renderStructure(v, depth + 1) : (
              <Typography variant="caption" color="text.secondary">{String(v)}</Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }
  return <Typography variant="caption">{String(obj)}</Typography>;
}

export default function JsonAnalyzerPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);
  const [jsonContent, setJsonContent] = useState(EXAMPLE_JSON);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jsonContent.trim()) {
      enqueueSnackbar('Insira um JSON para analisar', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await analyzerApi.analyzeJson(jsonContent);
      setResult(res);
    } catch {
      enqueueSnackbar('Erro ao analisar JSON', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold">Analisador JSON</Typography>
        <Typography variant="body2" color="text.secondary">
          Valide e analise payloads JSON SAP Ariba — detecção de campos ausentes e estrutura
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight="bold">JSON Input</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Analytics />}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? 'Analisando...' : 'Analisar'}
                </Button>
              </Box>
              <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                <Editor
                  height="500px"
                  language="json"
                  value={jsonContent}
                  onChange={(v) => setJsonContent(v || '')}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
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
                    <Typography variant="subtitle2" fontWeight="bold">Resultado</Typography>
                    <Chip
                      label={result.isValid ? 'VÁLIDO' : 'INVÁLIDO'}
                      color={result.isValid ? 'success' : 'error'}
                      icon={result.isValid ? <CheckCircle /> : <Error />}
                    />
                  </Box>

                  {result.isValid && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      JSON bem formado e estrutura reconhecida
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {result.issues?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" color="error" gutterBottom>
                      Problemas ({result.issues.length})
                    </Typography>
                    <List dense disablePadding>
                      {result.issues.map((issue: string, i: number) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Error fontSize="small" color="error" />
                          </ListItemIcon>
                          <ListItemText primary={issue} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {result.recommendations?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Recomendações
                    </Typography>
                    {result.recommendations.map((r: string, i: number) => (
                      <Typography key={i} variant="body2" color="text.secondary">• {r}</Typography>
                    ))}
                  </CardContent>
                </Card>
              )}

              {result.structure && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Estrutura Detectada
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {renderStructure(result.structure)}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Box textAlign="center" color="text.secondary">
                  <DataObject sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Cole um JSON e clique em Analisar</Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
