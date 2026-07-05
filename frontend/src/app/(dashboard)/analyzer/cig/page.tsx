'use client';

import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Alert,
  CircularProgress, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText,
  Divider, TextField, InputAdornment, Paper, Tooltip, IconButton,
  Menu, MenuItem, ListSubheader, Collapse,
} from '@mui/material';
import {
  Compare, Warning, CheckCircle, ArrowForward, Add, Remove,
  Search, Cancel, FolderOpen, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '@/store/auth.store';
import { useSnackbar } from 'notistack';

interface SampleEntry {
  id: string; label: string; type: string; docType: string;
  slot: string; path: string; description: string;
}
interface SamplePair {
  id: string; label: string; description: string; ariba: string; sap: string;
}
interface MappingEntry {
  id: string; label: string; direction: string; docType: string;
  path: string; totalMappings: number; description: string;
}
interface SamplesIndex { samples: SampleEntry[]; pairs: SamplePair[]; mappings: MappingEntry[]; }

interface MappingHit {
  mappingLabel: string;
  direction: string;
  docType: string;
  rows: Array<Record<string, string>>;
}

const ARIBA_EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<cXML payloadID="12345@buyer.ariba.com" timestamp="2024-01-15T10:30:00-08:00">
  <Header>
    <From><Credential domain="AribaNetworkUserId"><Identity>AN01234567890</Identity></Credential></From>
    <To><Credential domain="AribaNetworkUserId"><Identity>AN09876543210</Identity></Credential></To>
    <Sender>
      <Credential domain="AribaNetworkUserId"><Identity>AN01234567890</Identity></Credential>
      <UserAgent>SAP Ariba</UserAgent>
    </Sender>
  </Header>
  <Request>
    <OrderRequest>
      <OrderRequestHeader orderID="PO-2024-001" orderDate="2024-01-15T10:30:00-08:00" type="new">
        <Total><Money currency="BRL">1500.00</Money></Total>
        <ShipTo>
          <Address><Name xml:lang="pt-BR">Empresa XYZ</Name></Address>
        </ShipTo>
        <Extrinsic name="CostCenter">CC-1001</Extrinsic>
        <Extrinsic name="ProjectCode">PROJ-2024</Extrinsic>
        <Extrinsic name="Tipo de Contratação">01 Concorrencial</Extrinsic>
      </OrderRequestHeader>
      <ItemOut quantity="10" lineNumber="1">
        <ItemID><SupplierPartID>PROD-001</SupplierPartID></ItemID>
        <ItemDetail>
          <UnitPrice><Money currency="BRL">150.00</Money></UnitPrice>
          <Description xml:lang="pt-BR">Produto de Teste</Description>
          <UnitOfMeasure>EA</UnitOfMeasure>
        </ItemDetail>
      </ItemOut>
    </OrderRequest>
  </Request>
</cXML>`;

const TRANSFORMED_EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <TABNAM>EDI_DC40</TABNAM>
      <DIRECT>2</DIRECT>
      <IDOCTYP>ORDERS05</IDOCTYP>
      <MESTYP>ORDERS</MESTYP>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <BSART>NB</BSART>
      <CURCY>BRL</CURCY>
    </E1EDK01>
    <E1EDK14 SEGMENT="1">
      <QUALF>001</QUALF>
      <ORGID>CC-1001</ORGID>
    </E1EDK14>
  </IDOC>
</ORDERS05>`;

const SAP_EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <TABNAM>EDI_DC40</TABNAM>
      <DIRECT>2</DIRECT>
      <IDOCTYP>ORDERS05</IDOCTYP>
      <MESTYP>ORDERS</MESTYP>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <BSART>NB</BSART>
      <CURCY>BRL</CURCY>
    </E1EDK01>
    <E1EDK14 SEGMENT="1">
      <QUALF>001</QUALF>
      <ORGID>CC-1001</ORGID>
    </E1EDK14>
  </IDOC>
</ORDERS05>`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchMatch {
  line: number;
  content: string;
  context: string;
}

interface SearchResult {
  label: string;
  color: string;
  found: boolean;
  matches: SearchMatch[];
}

// ── Search logic ──────────────────────────────────────────────────────────────

function searchInPayload(xml: string, query: string): SearchMatch[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const lines = xml.split('\n');
  const results: SearchMatch[] = [];

  lines.forEach((line, i) => {
    if (line.toLowerCase().includes(q)) {
      // Get context: 1 line before + current + 1 line after
      const before = lines[i - 1]?.trim() ?? '';
      const after  = lines[i + 1]?.trim() ?? '';
      results.push({
        line: i + 1,
        content: line.trim(),
        context: [before, line.trim(), after].filter(Boolean).join('\n'),
      });
    }
  });

  return results;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <mark style={{ background: '#f59e0b55', color: 'inherit', borderRadius: 2, padding: '0 2px' }}>
        {text.substring(idx, idx + query.length)}
      </mark>
      {text.substring(idx + query.length)}
    </>
  );
}

// ── Comparison logic ──────────────────────────────────────────────────────────

function flattenXmlPaths(node: Element, prefix = ''): string[] {
  const paths: string[] = [];
  const tag = node.tagName;
  const path = prefix ? `${prefix}.${tag}` : tag;
  Array.from(node.attributes).forEach((attr) => { paths.push(`${path}[@${attr.name}]`); });
  const children = Array.from(node.children);
  if (children.length === 0) { paths.push(path); }
  else { children.forEach((child) => { paths.push(...flattenXmlPaths(child, path)); }); }
  return paths;
}

function flattenJsonPaths(obj: any, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return prefix ? [prefix] : [];
  return Object.entries(obj).flatMap(([k, v]) => flattenJsonPaths(v, prefix ? `${prefix}.${k}` : k));
}

function extractPaths(content: string): { paths: string[]; type: string } {
  try { const d = JSON.parse(content); return { paths: flattenJsonPaths(d), type: 'JSON' }; } catch {}
  try {
    const doc = new DOMParser().parseFromString(content, 'text/xml');
    if (!doc.querySelector('parsererror') && doc.documentElement) {
      return { paths: flattenXmlPaths(doc.documentElement), type: 'XML' };
    }
  } catch {}
  return { paths: content.split('\n').map(l => l.trim()).filter(Boolean), type: 'Texto' };
}

function comparePaths(aribaFields: string[], sapFields: string[]) {
  const aribaLeafs = aribaFields.map(f => f.split('.').pop() ?? f);
  const sapLeafs   = sapFields.map(f => f.split('.').pop() ?? f);
  return {
    lostFields:  aribaFields.filter(f => !sapLeafs.includes(f.split('.').pop() ?? f)),
    addedFields: sapFields.filter(f => !aribaLeafs.includes(f.split('.').pop() ?? f)),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CigAnalyzerPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useAuthStore((s) => s.theme);
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const [aribaPayload, setAribaPayload]             = useState(ARIBA_EXAMPLE);
  const [transformedPayload, setTransformedPayload] = useState(TRANSFORMED_EXAMPLE);
  const [sapPayload, setSapPayload]                 = useState(SAP_EXAMPLE);
  const [result, setResult]         = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [activeEditor, setActiveEditor] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState<SearchResult[] | null>(null);
  const [mappingHits, setMappingHits]         = useState<MappingHit[] | null>(null);
  const [searching, setSearching]             = useState(false);
  const [searchTab, setSearchTab]             = useState<'payloads' | 'mapping'>('payloads');

  // Samples state
  const [samplesIndex, setSamplesIndex]   = useState<SamplesIndex | null>(null);
  const [samplesAnchor, setSamplesAnchor] = useState<null | HTMLElement>(null);
  const [samplesOpen, setSamplesOpen]     = useState(false);
  const [loadingSample, setLoadingSample] = useState('');

  useEffect(() => {
    fetch('/samples/index.json').then(r => r.json()).then(setSamplesIndex).catch(() => {});
  }, []);

  const loadSample = async (sample: SampleEntry) => {
    setLoadingSample(sample.id);
    try {
      const r = await fetch(sample.path);
      const text = await r.text();
      if (sample.slot === 'ariba') { setAribaPayload(text); setActiveEditor(0); }
      else if (sample.slot === 'sap') { setSapPayload(text); setActiveEditor(2); }
      enqueueSnackbar(`"${sample.docType}" carregado no editor ${sample.slot === 'ariba' ? 'Ariba' : 'SAP'}`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao carregar sample', { variant: 'error' });
    } finally {
      setLoadingSample('');
      setSamplesOpen(false);
    }
  };

  const loadPair = async (pair: SamplePair) => {
    if (!samplesIndex) return;
    const ariba = samplesIndex.samples.find(s => s.id === pair.ariba);
    const sap   = samplesIndex.samples.find(s => s.id === pair.sap);
    setLoadingSample(pair.id);
    try {
      const [aribaText, sapText] = await Promise.all([
        ariba ? fetch(ariba.path).then(r => r.text()) : Promise.resolve(''),
        sap   ? fetch(sap.path).then(r => r.text())   : Promise.resolve(''),
      ]);
      if (aribaText) setAribaPayload(aribaText);
      if (sapText)   setSapPayload(sapText);
      setTransformedPayload('<!-- Cole aqui o XML gerado pelo CIG (output da transformação XSL) -->');
      setActiveEditor(0);
      setSamplesOpen(false);
      enqueueSnackbar(`Par "${pair.label}" carregado — adicione o XML do CIG na aba do meio`, { variant: 'info' });
    } catch {
      enqueueSnackbar('Erro ao carregar par de samples', { variant: 'error' });
    } finally {
      setLoadingSample('');
    }
  };

  const handleCompare = () => {
    if (!aribaPayload.trim() || !sapPayload.trim()) {
      enqueueSnackbar('Preencha ao menos o payload Ariba e SAP', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const ariba = extractPaths(aribaPayload);
      const sap   = extractPaths(sapPayload);
      const { lostFields, addedFields } = comparePaths(ariba.paths, sap.paths);
      setResult({
        summary: {
          aribaFieldCount: ariba.paths.length, sapFieldCount: sap.paths.length,
          lostInTransformation: lostFields.length, addedInTransformation: addedFields.length,
        },
        aribaType: ariba.type, sapType: sap.type,
        lostFields, addedFields,
        recommendations: lostFields.length > 0
          ? [`${lostFields.length} campos/elementos do Ariba não foram encontrados no SAP. Verifique os XPaths no XSL do CIG.`]
          : ['Todos os campos do Ariba foram encontrados no SAP.'],
      });
    } catch (err: any) {
      enqueueSnackbar(`Erro: ${err?.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const searchInMappings = async (query: string): Promise<MappingHit[]> => {
    if (!samplesIndex?.mappings?.length) return [];
    const q = query.toLowerCase();
    const hits: MappingHit[] = [];

    for (const mapping of samplesIndex.mappings) {
      try {
        const r = await fetch(mapping.path);
        const data = await r.json();
        const sheet = data.Sheet1 || Object.values(data)[0] as any;
        if (!sheet?.mappings) continue;

        const matched = sheet.mappings.filter((row: Record<string, string>) =>
          Object.values(row).some(v => String(v).toLowerCase().includes(q))
        );

        if (matched.length > 0) {
          hits.push({
            mappingLabel: mapping.label,
            direction: mapping.direction,
            docType: mapping.docType,
            rows: matched.slice(0, 10),
          });
        }
      } catch {}
    }
    return hits;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      enqueueSnackbar('Digite um campo para buscar', { variant: 'warning' });
      return;
    }
    setSearching(true);

    // Search payloads
    const payloads: Array<{ label: string; color: string; content: string }> = [
      { label: 'Ariba (Origem)',     color: '#0070c9', content: aribaPayload },
      { label: 'CIG (Transformado)', color: '#f59e0b', content: transformedPayload },
      { label: 'SAP (Destino)',      color: '#10b981', content: sapPayload },
    ];
    const results: SearchResult[] = payloads.map(({ label, color, content }) => ({
      label, color,
      found: searchInPayload(content, searchQuery).length > 0,
      matches: searchInPayload(content, searchQuery),
    }));
    setSearchResults(results);

    // Search real mappings
    const hits = await searchInMappings(searchQuery);
    setMappingHits(hits);
    setSearching(false);

    // Auto-switch tab based on results
    if (hits.length > 0) setSearchTab('mapping');
    else setSearchTab('payloads');

    const payloadFound = results.filter(r => r.found).length;
    if (hits.length > 0)
      enqueueSnackbar(`"${searchQuery}" encontrado em ${hits.length} mapeamento(s) oficial(is)`, { variant: 'success' });
    else if (payloadFound > 0)
      enqueueSnackbar(`"${searchQuery}" encontrado em ${payloadFound} payload(s)`, { variant: 'info' });
    else
      enqueueSnackbar(`"${searchQuery}" não encontrado em nenhum payload ou mapeamento`, { variant: 'warning' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setMappingHits(null);
  };

  const editorConfigs = [
    { label: 'Ariba (Origem)',     value: aribaPayload,       onChange: setAribaPayload,       color: '#0070c9' },
    { label: 'CIG (Transformado)', value: transformedPayload, onChange: setTransformedPayload, color: '#f59e0b' },
    { label: 'SAP (Destino)',      value: sapPayload,         onChange: setSapPayload,         color: '#10b981' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">CIG Analyzer</Typography>
          <Typography variant="body2" color="text.secondary">
            Compare o fluxo: SAP Ariba → CIG → SAP ECC/S4 · Pesquise campos no mapeamento
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Box position="relative">
            <Button
              variant="outlined"
              startIcon={<FolderOpen />}
              endIcon={samplesOpen ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setSamplesOpen(!samplesOpen)}
              disabled={!samplesIndex}
            >
              Exemplos
            </Button>

            {samplesOpen && samplesIndex && (
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute', right: 0, top: '100%', mt: 0.5,
                  zIndex: 1300, minWidth: 360, maxHeight: 480, overflow: 'auto',
                }}
              >
                <Box p={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ px: 1 }}>
                    PARES COMPLETOS (Ariba + SAP)
                  </Typography>
                  {samplesIndex.pairs.map((pair) => (
                    <MenuItem
                      key={pair.id}
                      onClick={() => loadPair(pair)}
                      disabled={loadingSample === pair.id}
                      sx={{ borderRadius: 1, mb: 0.5 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{pair.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{pair.description}</Typography>
                      </Box>
                    </MenuItem>
                  ))}

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ px: 1 }}>
                    INDIVIDUAIS
                  </Typography>
                  {samplesIndex.samples.map((s) => (
                    <MenuItem
                      key={s.id}
                      onClick={() => loadSample(s)}
                      disabled={loadingSample === s.id}
                      sx={{ borderRadius: 1, mb: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Box display="flex" gap={1} alignItems="center" width="100%">
                        <Chip
                          label={s.slot === 'ariba' ? 'Ariba' : 'SAP'}
                          size="small"
                          sx={{ bgcolor: s.slot === 'ariba' ? '#0070c9' : '#10b981', color: 'white', fontSize: 10, height: 18 }}
                        />
                        <Typography variant="body2" fontWeight="medium">{s.docType}</Typography>
                        <Chip label={s.type.toUpperCase()} size="small" variant="outlined" sx={{ ml: 'auto', fontSize: 10, height: 18 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3 }} noWrap>
                        {s.description}
                      </Typography>
                    </MenuItem>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Compare />}
            onClick={handleCompare}
            disabled={loading}
            size="large"
          >
            {loading ? 'Comparando...' : 'Comparar Fluxo'}
          </Button>
        </Box>
      </Box>

      {/* ── SEARCH BAR ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.paper' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <Search color="primary" />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ minWidth: 160 }}>
              Buscar Campo no Mapeamento
            </Typography>
            <TextField
              size="small"
              placeholder='Ex: "Tipo de Contratação", "EKKO_CI", "CostCenter"...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1, minWidth: 280 }}
              InputProps={{
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}><Cancel fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={searching} startIcon={<Search />}>
              Buscar
            </Button>
            {searchResults && (
              <Button variant="outlined" size="small" onClick={clearSearch}>Limpar</Button>
            )}
          </Box>

          {/* Search results inline */}
          {(searchResults || mappingHits) && (
            <Box mt={2}>
              {/* Tab selector */}
              <Box display="flex" gap={1} mb={1.5} alignItems="center" flexWrap="wrap">
                <Button
                  size="small"
                  variant={searchTab === 'mapping' ? 'contained' : 'outlined'}
                  onClick={() => setSearchTab('mapping')}
                  sx={{ fontSize: 11 }}
                >
                  Mapeamento Oficial ({mappingHits?.reduce((a, h) => a + h.rows.length, 0) ?? 0} hits)
                </Button>
                <Button
                  size="small"
                  variant={searchTab === 'payloads' ? 'contained' : 'outlined'}
                  onClick={() => setSearchTab('payloads')}
                  sx={{ fontSize: 11 }}
                >
                  Nos Payloads
                </Button>
                <Box display="flex" gap={0.5} ml={1}>
                  {searchResults?.map((r) => (
                    <Chip key={r.label} label={r.label} size="small"
                      icon={r.found ? <CheckCircle /> : <Cancel />}
                      color={r.found ? 'success' : 'error'}
                      variant={r.found ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              {/* Mapping official results */}
              {searchTab === 'mapping' && (
                <Box>
                  {mappingHits && mappingHits.length === 0 && (
                    <Alert severity="warning">
                      "{searchQuery}" <strong>não encontrado</strong> nos mapeamentos oficiais CIG (QuoteRequest e QuoteMessageOrder_In).
                      Isso indica que o campo pode não estar mapeado ou tem nome diferente no XSL.
                    </Alert>
                  )}
                  {mappingHits?.map((hit, hi) => (
                    <Paper key={hi} variant="outlined" sx={{ mb: 1.5, p: 1.5, borderColor: 'primary.main' }}>
                      <Box display="flex" gap={1} alignItems="center" mb={1}>
                        <Chip label={hit.docType} size="small" color="primary" />
                        <Typography variant="caption" fontWeight="bold">{hit.mappingLabel}</Typography>
                        <Chip label={hit.direction} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        <Chip label={`${hit.rows.length} resultado${hit.rows.length !== 1 ? 's' : ''}`}
                          size="small" color="success" sx={{ ml: 'auto' }} />
                      </Box>
                      <Box sx={{ overflowX: 'auto', maxHeight: 260, overflow: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'rgba(0,112,201,0.1)' }}>
                              {hit.rows[0] && Object.keys(hit.rows[0]).map(k => (
                                <th key={k} style={{ padding: '4px 8px', textAlign: 'left', whiteSpace: 'nowrap',
                                  borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }}>
                                  {k}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {hit.rows.map((row, ri) => (
                              <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {Object.values(row).map((val, ci) => (
                                  <td key={ci} style={{ padding: '3px 8px', verticalAlign: 'top', maxWidth: 280 }}>
                                    <span dangerouslySetInnerHTML={{
                                      __html: String(val).replace(
                                        new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                                        m => `<mark style="background:#f59e0b55;border-radius:2px;padding:0 1px">${m}</mark>`
                                      )
                                    }} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Payload results */}
              {searchTab === 'payloads' && searchResults && (
                <Grid container spacing={1.5}>
                  {searchResults.map((r) => (
                    <Grid item xs={12} md={4} key={r.label}>
                      <Paper variant="outlined" sx={{
                        p: 1.5,
                        borderColor: r.found ? r.color : 'error.main',
                        borderWidth: 1.5,
                        bgcolor: r.found ? `${r.color}08` : undefined,
                      }}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                          <Typography variant="caption" fontWeight="bold">{r.label}</Typography>
                          <Chip
                            label={r.found ? `${r.matches.length} ocorrência${r.matches.length !== 1 ? 's' : ''}` : 'Não encontrado'}
                            size="small" color={r.found ? 'success' : 'error'}
                            sx={{ ml: 'auto', height: 18, fontSize: 10 }}
                          />
                        </Box>
                        {r.found ? (
                          <Box sx={{ maxHeight: 160, overflow: 'auto' }}>
                            {r.matches.map((m, i) => (
                              <Box key={i} sx={{ mb: 0.5, p: 0.75, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                                  Linha {m.line}
                                </Typography>
                                <Typography component="div" sx={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', lineHeight: 1.5 }}>
                                  {highlightMatch(m.content, searchQuery)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Alert severity="error" sx={{ py: 0.5 }} icon={<Cancel fontSize="small" />}>
                            <Typography variant="caption">Não encontrado neste payload.</Typography>
                          </Alert>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Flow indicator */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        {editorConfigs.map((e, i) => (
          <Box key={i} display="flex" alignItems="center" gap={1}>
            <Chip
              label={e.label}
              size="small"
              sx={{ bgcolor: activeEditor === i ? e.color : undefined, color: activeEditor === i ? 'white' : undefined, fontWeight: 'bold' }}
              onClick={() => setActiveEditor(i)}
              variant={activeEditor === i ? 'filled' : 'outlined'}
            />
            {i < editorConfigs.length - 1 && <ArrowForward fontSize="small" color="action" />}
          </Box>
        ))}
      </Box>

      <Grid container spacing={2}>
        {/* Editors */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Tabs
                value={activeEditor}
                onChange={(_, v) => setActiveEditor(v)}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                {editorConfigs.map((e, i) => (
                  <Tab key={i} label={e.label} sx={{ fontSize: 12 }} />
                ))}
              </Tabs>
              {editorConfigs.map((e, i) => (
                <Box key={i} hidden={activeEditor !== i}>
                  <Editor
                    height="440px"
                    language="xml"
                    value={e.value}
                    onChange={(v) => e.onChange(v || '')}
                    theme={editorTheme}
                    options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Result Panel */}
        <Grid item xs={12} lg={4}>
          {result ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold">Resumo</Typography>
                    <Box display="flex" gap={0.5}>
                      <Chip label={result.aribaType} size="small" variant="outlined" />
                      <span style={{ fontSize: 12, alignSelf: 'center' }}>→</span>
                      <Chip label={result.sapType} size="small" variant="outlined" />
                    </Box>
                  </Box>
                  <Grid container spacing={1}>
                    {[
                      { label: 'Campos Ariba', value: result.summary?.aribaFieldCount, color: '#0070c9' },
                      { label: 'Campos SAP',   value: result.summary?.sapFieldCount,   color: '#10b981' },
                      { label: 'Perdidos',     value: result.summary?.lostInTransformation,  color: '#ef4444' },
                      { label: 'Adicionados',  value: result.summary?.addedInTransformation, color: '#f59e0b' },
                    ].map((s) => (
                      <Grid item xs={6} key={s.label}>
                        <Box textAlign="center" sx={{ p: 1, borderRadius: 1, border: `1px solid ${s.color}20`, bgcolor: `${s.color}10` }}>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value ?? 0}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {result.lostFields?.length > 0 && (
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Remove fontSize="small" color="error" />
                      <Typography variant="subtitle2" fontWeight="bold" color="error">
                        Campos Perdidos ({result.lostFields.length})
                      </Typography>
                    </Box>
                    <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                      Verifique os XPaths no XSL do CIG.
                    </Alert>
                    <List dense disablePadding sx={{ maxHeight: 140, overflow: 'auto' }}>
                      {result.lostFields.map((f: string, i: number) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <Warning fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={f} primaryTypographyProps={{ variant: 'caption', fontFamily: 'monospace' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {result.addedFields?.length > 0 && (
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Add fontSize="small" color="success" />
                      <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                        Campos Adicionados ({result.addedFields.length})
                      </Typography>
                    </Box>
                    <List dense disablePadding sx={{ maxHeight: 120, overflow: 'auto' }}>
                      {result.addedFields.map((f: string, i: number) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CheckCircle fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={f} primaryTypographyProps={{ variant: 'caption', fontFamily: 'monospace' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {result.recommendations?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Recomendações</Typography>
                    {result.recommendations.map((r: string, i: number) => (
                      <Alert key={i} severity={result.lostFields?.length > 0 ? 'warning' : 'success'} sx={{ mb: 1 }}>
                        {r}
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 440 }}>
                <Box textAlign="center" color="text.secondary">
                  <Compare sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>Preencha os 3 payloads e clique em</Typography>
                  <Typography fontWeight="bold">"Comparar Fluxo"</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption">
                    Use a busca acima para verificar se um campo existe no mapeamento
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
