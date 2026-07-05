'use client';

import {
  AppBar, Toolbar, Typography, IconButton, Chip, Box, Tooltip,
} from '@mui/material';
import { LightMode, DarkMode, Notifications } from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Agente Ariba Enterprise AI' }: TopBarProps) {
  const { theme, toggleTheme, user } = useAuthStore();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar variant="dense">
        <Typography variant="h6" color="text.primary" fontWeight="bold" sx={{ flex: 1 }}>
          {title}
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={user?.role?.replace('_', ' ').toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
          />

          <Tooltip title="Notificações">
            <IconButton size="small">
              <Notifications fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
            <IconButton size="small" onClick={toggleTheme}>
              {theme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
