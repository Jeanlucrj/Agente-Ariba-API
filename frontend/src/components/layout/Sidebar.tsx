'use client';

import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Tooltip,
} from '@mui/material';
import {
  Dashboard, Api, VpnKey, PlayArrow, Code, Analytics,
  Psychology, MenuBook, Settings, Logout, ChevronLeft, ChevronRight,
  Compare, Storage, MonitorHeart, Assignment,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 68;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'APIs', icon: <Api />, path: '/apis' },
  { label: 'OAuth Manager', icon: <VpnKey />, path: '/oauth' },
  { label: 'Executor', icon: <PlayArrow />, path: '/executor' },
  { label: 'Analisador XML', icon: <Code />, path: '/analyzer/xml' },
  { label: 'Analisador JSON', icon: <Analytics />, path: '/analyzer/json' },
  { label: 'CIG Analyzer', icon: <Compare />, path: '/analyzer/cig' },
  { label: 'SAP Analyzer', icon: <Storage />, path: '/analyzer/sap' },
  { label: 'IA Troubleshooting', icon: <Psychology />, path: '/ai' },
  { label: 'Monitoramento', icon: <MonitorHeart />, path: '/monitoring' },
  { label: 'Evidências', icon: <Assignment />, path: '/evidences' },
  { label: 'Base de Conhecimento', icon: <MenuBook />, path: '/knowledge-base' },
];

const bottomItems = [
  { label: 'Configurações', icon: <Settings />, path: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    router.push('/login');
  };

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = pathname === item.path || pathname.startsWith(item.path + '/');
    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        <Tooltip title={collapsed ? item.label : ''} placement="right">
          <ListItemButton
            selected={active}
            onClick={() => router.push(item.path)}
            sx={{
              minHeight: 44,
              justifyContent: collapsed ? 'center' : 'initial',
              px: 2.5,
              borderRadius: 1,
              mx: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          transition: 'width 0.2s',
          overflowX: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1 }}>
        {!collapsed && (
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" noWrap>
              Agente Ariba
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Enterprise AI
            </Typography>
          </Box>
        )}
        <ListItemButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{ minWidth: 0, p: 0.5, borderRadius: 1 }}
        >
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </ListItemButton>
      </Box>

      <Divider />

      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => <NavItem key={item.path} item={item} />)}
      </List>

      <Divider />

      <List sx={{ py: 1 }}>
        {bottomItems.map((item) => <NavItem key={item.path} item={item} />)}
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'Sair' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{ minHeight: 44, justifyContent: collapsed ? 'center' : 'initial', px: 2.5, mx: 0.5, borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>
                <Logout />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 13 }} />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>

      {!collapsed && user && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" noWrap fontWeight="bold">{user.name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {user.role}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
