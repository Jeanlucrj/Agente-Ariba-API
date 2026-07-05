'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress, Collapse,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  TextField, InputAdornment, Tabs, Tab, Alert,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, Refresh, Search, Psychology, ContentCopy,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { executorApi, aiApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  success: 'success',
  error: 'error',
  timeout: 'warning',
  auth_failed: 'warning',
};

const METHOD_COLORS: Record<string, any> = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'default', DELETE: 'error',
};

function HistoryRow({ item }: { item: any }) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const res: any = await aiApi.diagnose({
        statusCode: item.statusCode,
        errorMessage: item.errorMessage || item.responseBody?.substring(0, 500),
        context: `SAP Ariba API - ${item.method} ${item.url}`,
      });
      setDiagnosis(res);
      setTab(2);
    } catch {
      enqueueSnackbar('Erro ao diagnosticar', { variant: 'error' });
    } finally {
      setDiagnosing(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copiado!', { variant: 'info' });
  };

  const createdAt = new Date(item.createdAt);

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: open ? 0 : undefined } }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ width: 32, py: 1 }}>
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          <Chip label={item.method} size="small" color={METHOD_COLORS[item.method]} />
        </TableCell>
        <TableCell sx={{ py: 1, maxWidth: 300 }}>
          <Typography variant="caption" fontFamily="monospace" noWrap display="block">
            {item.url}
          </Typography>
          {item.apiName && (
            <Typography variant="caption" color="text.secondary">{item.apiName}</Typography>
          )}
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          <Chip
            label={item.statusCode || '—'}
            size="small"
            color={item.statusCode >= 200 && item.statusCode < 300 ? 'success' : 'error'}
            variant="outlined"
          />
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          <Chip
            label={item.status.replace('_', ' ')}
            size="small"
            color={STATUS_COLORS[item.status] || 'default'}
          />
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          <Typography variant="caption">{item.durationMs ? `${item.durationMs}ms` : '—'}</Typography>
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {createdAt.toLocaleDateString('pt-BR')} {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, px: 2 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 32 }}>
                  <Tab label="Request" sx={{ minHeight: 32, py: 0, fontSize: 12 }} />
                  <Tab label="Response" sx={{ minHeight: 32, py: 0, fontSize: 12 }} />
                  <Tab label="IA Diagnóstico" sx={{ minHeight: 32, py: 0, fontSize: 12 }} />
                </Tabs>
                <Box display="flex" gap={1}>
                  {item.status === 'error' && (
                    <Tooltip title="Diagnóstico IA">
                      <IconButton size="small" onClick={handleDiagnose} disabled={diagnosing}>
                        {diagnosing ? <CircularProgress size={16} /> : <Psychology fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {tab === 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {item.method} {item.url}
                  </Typography>
                  <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                    <Editor
                      height="200px"
                      language="json"
                      value={JSON.stringify({ headers: item.requestHeaders, body: item.requestBody }, null, 2)}
                      theme={editorTheme}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                    />
                  </Box>
                </Box>
              )}

              {tab === 1 && (
                <Box position="relative">
                  <Tooltip title="Copiar">
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}
                      onClick={() => copy(item.responseBody || '')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
                    <Editor
                      height="200px"
                      language="json"
                      value={item.responseBody || ''}
                      theme={editorTheme}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                    />
                  </Box>
                  {item.errorMessage && (
                    <Alert severity="error" sx={{ mt: 1 }}>{item.errorMessage}</Alert>
                  )}
                </Box>
              )}

              {tab === 2 && diagnosis && (
                <Box>
                  <Alert severity={diagnosis.priority === 'critical' ? 'error' : 'warning'} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{diagnosis.diagnosis}</Typography>
                  </Alert>
                  <Typography variant="body2" mb={1}><strong>Causa:</strong> {diagnosis.possibleCause}</Typography>
                  <Typography variant="body2"><strong>Solução:</strong> {diagnosis.suggestedFix}</Typography>
                </Box>
              )}

              {tab === 2 && !diagnosis && (
                <Box textAlign="center" py={3} color="text.secondary">
                  <Typography variant="body2">Clique no botão IA para diagnosticar este erro</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function MonitoringPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['execution-history', filterStatus, page],
    queryFn: () => executorApi.history({ page, limit: 50 }),
    refetchInterval: 30000,
  });

  const items = (data as any)?.items || [];
  const total = (data as any)?.total || 0;

  const filtered = items.filter((item: any) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (search && !item.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Monitoramento</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} execuções registradas — atualiza a cada 30s
          </Typography>
        </Box>
        <Tooltip title="Atualizar">
          <IconButton onClick={() => refetch()}><Refresh /></IconButton>
        </Tooltip>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar por URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="success">Sucesso</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
                <MenuItem value="timeout">Timeout</MenuItem>
                <MenuItem value="auth_failed">Auth Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 32 }} />
              <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>URL / API</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>HTTP</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Duração</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhuma execução encontrada. Use o Executor de APIs para realizar chamadas.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item: any) => <HistoryRow key={item.id} item={item} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
