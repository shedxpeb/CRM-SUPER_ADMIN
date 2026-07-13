'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminSidebar } from '@/features/super-admin/components/SuperAdminSidebar';
import { ThemeToggle } from '@/features/super-admin/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSAThemeStore } from '@/store/useSAThemeStore';
import { useSASidebarStore } from '@/store/useSASidebarStore';
import { useAuth } from '@/features/auth/AuthContext';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSAThemeStore((s) => s.theme);
  const collapsed = useSASidebarStore((s) => s.collapsed);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sa-sidebar)' }}>
        <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sa-sidebar)' }} data-sa-theme={theme}>
      <SuperAdminSidebar />

      <div style={{ paddingLeft: collapsed ? 68 : 220 }} className="transition-[padding-left] duration-300">
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6" style={{ background: 'var(--sa-card)', borderBottom: '1px solid var(--sa-border)' }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--sa-text-muted)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to App
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="h-4 w-px" style={{ background: 'var(--sa-border)' }} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-colors"
              style={{ color: 'var(--sa-text-muted)' }}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px" style={{ background: 'var(--sa-border)' }} />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5 h-8 text-xs transition-colors"
              style={{ color: 'var(--sa-text-muted)' }}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
