'use client';

import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton,
} from '@mui/material';
import {
  CheckCircle, Error, Api, Speed, TrendingUp, Warning,
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { executorApi, apisApi } from '@/services/api';

const COLORS = ['#0070c9', '#ef4444', '#f59e0b', '#10b981'];

function StatCard({
  title, value, subtitle, icon, color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [mockChartData] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({
      day: `D-${6 - i}`,
      success: Math.floor(Math.random() * 100) + 50,
      error: Math.floor(Math.random() * 20) + 2,
    }))
  );
  const { data: execStats, isLoading: loadingExec } = useQuery({
    queryKey: ['exec-stats'],
    queryFn: () => executorApi.stats(),
    refetchInterval: 30000,
  });

  const { data: apiStats, isLoading: loadingApis } = useQuery({
    queryKey: ['api-stats'],
    queryFn: () => apisApi.stats(),
  });

  const stats = execStats as any;
  const apis = apiStats as any;

  const pieData = [
    { name: 'Sucesso', value: stats?.success || 0 },
    { name: 'Erro', value: stats?.error || 0 },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">Dashboard Executivo</Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral do ambiente SAP Ariba
        </Typography>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          {loadingApis ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /> : (
            <StatCard
              title="APIs Cadastradas"
              value={apis?.total ?? '—'}
              icon={<Api />}
              color="primary"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loadingExec ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /> : (
            <StatCard
              title="Execuções com Sucesso"
              value={stats?.success ?? '—'}
              subtitle={`${stats?.successRate ?? 0}% de taxa de sucesso`}
              icon={<CheckCircle />}
              color="success"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loadingExec ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /> : (
            <StatCard
              title="Execuções com Erro"
              value={stats?.error ?? '—'}
              icon={<Error />}
              color="error"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          {loadingExec ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /> : (
            <StatCard
              title="Tempo Médio"
              value={stats?.avgDurationMs ? `${stats.avgDurationMs}ms` : '—'}
              icon={<Speed />}
              color="warning"
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Histórico de Execuções (7 dias)
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="success" stackId="1" stroke="#0070c9" fill="#0070c9" fillOpacity={0.6} name="Sucesso" />
                  <Area type="monotone" dataKey="error" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Erro" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Distribuição de Status
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {apis?.byModule && apis.byModule.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  APIs por Módulo SAP Ariba
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={apis.byModule}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0070c9" radius={[4, 4, 0, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
