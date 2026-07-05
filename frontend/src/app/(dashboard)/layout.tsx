'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  if (!isAuthenticated()) return null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
