'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Database,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { componentTextSizes } from '@/lib/design-system';
import { useSASidebarStore } from '@/store/useSASidebarStore';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/super-admin' },
  { name: 'Companies', icon: Building2, path: '/super-admin/companies' },
  { name: 'Users & RBAC', icon: Users, path: '/super-admin/users' },
  { name: 'Subscriptions', icon: CreditCard, path: '/super-admin/subscriptions' },
  { name: 'Backup', icon: Database, path: '/super-admin/backup' },
  { name: 'Audit Logs', icon: FileText, path: '/super-admin/audit-logs' },
  { name: 'Settings', icon: Settings, path: '/super-admin/settings' },
];

export const SuperAdminSidebar = memo(function SuperAdminSidebar() {
  const pathname = usePathname();
  const collapsed = useSASidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSASidebarStore((s) => s.toggle);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/super-admin') return pathname === '/super-admin';
    return pathname?.startsWith(path);
  };

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sa-border">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/30">
              <Shield className="h-4.5 w-4.5 text-sa-text" />
            </div>
            <div>
              <span className="font-bold text-sa-text text-sm block leading-tight">Super Admin</span>
              <span className={cn(componentTextSizes.badge, 'text-sa-text-muted leading-tight')}>PEB CRM Console</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="hidden lg:flex text-sa-text-muted hover:text-sa-text hover:bg-sa-border/50 h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-sa-text-muted hover:text-sa-text hover:bg-sa-border/50 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={`${item.path}-${index}`}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                active
                  ? 'bg-gradient-to-r from-red-600/20 to-red-600/5 text-red-400 font-medium'
                  : 'text-sa-text-muted hover:bg-sa-border/50 hover:text-sa-text-secondary',
                collapsed && 'justify-center'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-red-400' : 'text-sa-text-dim group-hover:text-sa-text-muted')} />
              {!collapsed && <span className={cn(componentTextSizes.nav.item)}>{item.name}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sa-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-sa-border-solid to-sa-card-solid rounded-full flex items-center justify-center text-sa-text text-xs font-bold ring-2 ring-sa-border">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sa-text-secondary truncate">System Admin</p>
              <p className={cn(componentTextSizes.badge, 'text-sa-text-muted truncate')}>admin@pebcrm.com</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-sa-card-solid border border-sa-border shadow-lg backdrop-blur-sm"
      >
        <Menu className="h-5 w-5 text-sa-text-secondary" />
      </button>

      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-sa-sidebar border-r border-sa-border transition-all duration-300 z-40',
          collapsed ? 'w-[68px]' : 'w-[220px]'
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-sa-overlay backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[220px] h-full bg-sa-sidebar border-r border-sa-border flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
});
