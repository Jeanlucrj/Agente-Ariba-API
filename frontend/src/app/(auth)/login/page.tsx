'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api';
import { useSnackbar } from 'notistack';

export default function LoginPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result: any = await authApi.login(email, password, mfaCode || undefined);
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciais inválidas';
      if (msg === 'Código MFA obrigatório') {
        setNeedsMfa(true);
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #002d52 50%, #0070c9 100%)',
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', mx: 2, borderRadius: 3, boxShadow: 24 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h5" fontWeight="bold" color="primary">
              Agente Ariba
            </Typography>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Enterprise AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plataforma de Testes e Diagnóstico SAP Ariba
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: needsMfa ? 2 : 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {needsMfa && (
              <TextField
                label="Código MFA (6 dígitos)"
                type="text"
                fullWidth
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                sx={{ mb: 3 }}
                inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                placeholder="000000"
              />
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              SAP Ariba • Business Network • CIG • ECC • S/4HANA
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
