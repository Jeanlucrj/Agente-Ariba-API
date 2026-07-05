'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress,
  TextField, InputAdornment, Grid, Collapse, IconButton, Tooltip,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button,
} from '@mui/material';
import {
  Search, MenuBook, ExpandMore, ExpandLess, CheckCircle, Warning,
  Lightbulb, BugReport, Refresh,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { knowledgeApi } from '@/services/api';

const CATEGORIES = [
  'OAuth', 'CIG', 'SAP Ariba', 'Business Network', 'SAP ECC', 'SAP S/4HANA',
  'XML', 'JSON', 'HTTP', 'IDoc', 'Mapping',
];

const CATEGORY_COLORS: Record<string, any> = {
  OAuth: 'warning', CIG: 'secondary', 'SAP Ariba': 'primary', 'Business Network': 'info',
  'SAP ECC': 'default', 'SAP S/4HANA': 'default', XML: 'success', JSON: 'success',
  HTTP: 'error', IDoc: 'default', Mapping: 'secondary',
};

function KnowledgeCard({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {entry.title}
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
              <Chip
                label={entry.category}
                size="small"
                color={CATEGORY_COLORS[entry.category] || 'default'}
                variant="filled"
              />
              {entry.errorCode && (
                <Chip label={entry.errorCode} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
              )}
              {entry.usageCount > 0 && (
                <Chip label={`${entry.usageCount}x consultado`} size="small" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {entry.description}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {entry.tags?.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {entry.tags.map((tag: string) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
            ))}
          </Box>
        )}

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />

          {entry.possibleCauses?.length > 0 && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BugReport fontSize="small" color="warning" />
                <Typography variant="caption" fontWeight="bold" color="warning.main">
                  CAUSAS PROVÁVEIS
                </Typography>
              </Box>
              <List dense disablePadding>
                {entry.possibleCauses.map((cause: string, i: number) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <Warning fontSize="small" color="warning" sx={{ fontSize: 14 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={cause}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {entry.investigationSteps?.length > 0 && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Search fontSize="small" color="info" />
                <Typography variant="caption" fontWeight="bold" color="info.main">
                  PASSOS DE INVESTIGAÇÃO
                </Typography>
              </Box>
              <List dense disablePadding>
                {entry.investigationSteps.map((step: string, i: number) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                    <Chip label={i + 1} size="small" sx={{ mr: 1, minWidth: 22, height: 20, fontSize: 11 }} />
                    <ListItemText
                      primary={step}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {entry.solutions?.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Lightbulb fontSize="small" color="success" />
                <Typography variant="caption" fontWeight="bold" color="success.main">
                  SOLUÇÕES
                </Typography>
              </Box>
              <List dense disablePadding>
                {entry.solutions.map((sol: string, i: number) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ fontSize: 14 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={sol}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['knowledge-base', activeCategory],
    queryFn: () => knowledgeApi.list({ category: activeCategory || undefined, limit: 50 }),
    enabled: !searching,
  });

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await knowledgeApi.search(search, activeCategory || undefined);
      setSearchResults(res as any[]);
    } catch {
      setSearchResults([]);
    }
  };

  const handleClear = () => {
    setSearch('');
    setSearchResults(null);
    setSearching(false);
  };

  const entries = searchResults ?? (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Base de Conhecimento</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchResults ? `${searchResults.length} resultados para "${search}"` : `${total} entradas — erros e soluções SAP Ariba`}
          </Typography>
        </Box>
        <Tooltip title="Atualizar"><IconButton onClick={() => refetch()}><Refresh /></IconButton></Tooltip>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Buscar erro, código, solução..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 300 }}
            />
            <Button variant="contained" size="small" onClick={handleSearch}>Buscar</Button>
            {searchResults && (
              <Button variant="outlined" size="small" onClick={handleClear}>Limpar</Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Category filter */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip
          label="Todas"
          onClick={() => setActiveCategory('')}
          color={activeCategory === '' ? 'primary' : 'default'}
          variant={activeCategory === '' ? 'filled' : 'outlined'}
        />
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
            color={activeCategory === cat ? (CATEGORY_COLORS[cat] || 'primary') : 'default'}
            variant={activeCategory === cat ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              {searchResults !== null ? 'Nenhum resultado encontrado para sua busca.' : 'Base de conhecimento vazia.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {entries.map((entry: any) => (
            <Grid item xs={12} md={6} key={entry.id}>
              <KnowledgeCard entry={entry} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
