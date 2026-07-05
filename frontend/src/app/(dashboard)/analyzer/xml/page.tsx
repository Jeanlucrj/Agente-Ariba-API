'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Alert,
  CircularProgress, List, ListItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import { Code, CheckCircle, Error, Warning, Psychology, Upload } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { analyzerApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.021/cXML.dtd">
<cXML payloadID="12345@buyer.ariba.com" timestamp="2024-01-15T10:30:00-08:00"
      xml:lang="en-US" version="1.2.021">
  <Header>
    <From>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN01234567890</Identity>
      </Credential>
    </From>
    <To>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN09876543210</Identity>
      </Credential>
    </To>
    <Sender>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN01234567890</Identity>
        <SharedSecret>secret</SharedSecret>
      </Credential>
      <UserAgent>SAP Ariba Commerce Automation</UserAgent>
    </Sender>
  </Header>
  <Request>
    <OrderRequest>
      <OrderRequestHeader orderID="PO-2024-001" orderDate="2024-01-15T10:30:00-08:00" type="new">
        <Total>
          <Money currency="BRL">1500.00</Money>
        </Total>
        <ShipTo>
          <Address>
            <Name xml:lang="pt-BR">Empresa XYZ Ltda</Name>
          </Address>
        </ShipTo>
      </OrderRequestHeader>
      <ItemOut quantity="10" lineNumber="1">
        <ItemID>
          <SupplierPartID>PROD-001</SupplierPartID>
        </ItemID>
        <ItemDetail>
          <UnitPrice><Money currency="BRL">150.00</Money></UnitPrice>
          <Description xml:lang="pt-BR">Produto de Teste</Description>
          <UnitOfMeasure>EA</UnitOfMeasure>
        </ItemDetail>
      </ItemOut>
    </OrderRequest>
  </Request>
</cXML>`;

export default function XmlAnalyzerPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);
  const [xmlContent, setXmlContent] = useState(EXAMPLE_XML);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!xmlContent.trim()) {
      enqueueSnackbar('Insira um XML para analisar', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await analyzerApi.analyzeXml(xmlContent, true);
      setResult(res);
    } catch {
      enqueueSnackbar('Erro ao analisar XML', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setXmlContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold">Analisador XML</Typography>
        <Typography variant="body2" color="text.secondary">
          Valide e analise payloads cXML SAP Ariba com diagnóstico IA
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight="bold">XML Input</Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                  >
                    Upload
                    <input type="file" accept=".xml" hidden onChange={handleFileUpload} />
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Code />}
                    onClick={handleAnalyze}
                    disabled={loading}
                  >
                    {loading ? 'Analisando...' : 'Analisar'}
                  </Button>
                </Box>
              </Box>

              <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                <Editor
                  height="500px"
                  language="xml"
                  value={xmlContent}
                  onChange={(v) => setXmlContent(v || '')}
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
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold">Resultado</Typography>
                    <Chip
                      label={result.isValid ? 'VÁLIDO' : 'INVÁLIDO'}
                      color={result.isValid ? 'success' : 'error'}
                      icon={result.isValid ? <CheckCircle /> : <Error />}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tipo: <strong>{result.documentType}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tamanho: {(result.size / 1024).toFixed(2)} KB
                  </Typography>
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

              {result.warnings?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" color="warning.main" gutterBottom>
                      Avisos ({result.warnings.length})
                    </Typography>
                    <List dense disablePadding>
                      {result.warnings.map((w: string, i: number) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Warning fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={w} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {result.aiAnalysis && (
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Psychology color="primary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        Análise IA
                      </Typography>
                    </Box>

                    {result.aiAnalysis.error ? (
                      <Alert severity="info" icon={<Psychology fontSize="small" />}>
                        <Typography variant="body2">
                          <strong>IA não configurada.</strong> Configure <code>GEMINI_API_KEY</code> no arquivo <code>.env</code> para habilitar análise inteligente de XML.
                        </Typography>
                      </Alert>
                    ) : (
                      <>
                        {result.aiAnalysis.issues?.length > 0 && (
                          <Alert severity="warning" sx={{ mb: 1 }}>
                            {result.aiAnalysis.issues.join('; ')}
                          </Alert>
                        )}
                        {result.aiAnalysis.summary && (
                          <Typography variant="body2" mb={1}>{result.aiAnalysis.summary}</Typography>
                        )}
                        {result.aiAnalysis.missingFields?.length > 0 && (
                          <Box mb={1}>
                            <Typography variant="caption" fontWeight="bold" color="error.main">CAMPOS AUSENTES:</Typography>
                            {result.aiAnalysis.missingFields.map((f: string, i: number) => (
                              <Typography key={i} variant="body2" color="error">• {f}</Typography>
                            ))}
                          </Box>
                        )}
                        {result.aiAnalysis.recommendations?.map((r: string, i: number) => (
                          <Typography key={i} variant="body2" color="text.secondary">• {r}</Typography>
                        ))}
                        {!result.aiAnalysis.summary && !result.aiAnalysis.recommendations?.length && (
                          <Typography variant="body2" color="text.secondary">Nenhuma observação adicional da IA.</Typography>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <Box textAlign="center" color="text.secondary">
                  <Code sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Cole um XML e clique em Analisar</Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
