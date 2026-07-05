'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0070c9' },
    secondary: { main: '#00b4d8' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
  },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
  shape: { borderRadius: 8 },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2491eb' },
    secondary: { main: '#00b4d8' },
    background: { default: '#0a0f1e', paper: '#111827' },
  },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
  shape: { borderRadius: 8 },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAuthStore((s) => s.theme);
  const muiTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={4} autoHideDuration={4000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
