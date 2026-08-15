'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { componentTextSizes } from '@/lib/design-system';
import { useSASidebarStore } from '@/store/useSASidebarStore';
import { useAuth } from '@/features/auth/AuthContext';
import { can } from '@/features/auth/rbac';

interface NavItem {
  name: string;
  icon: typeof Building2;
  path: string;
  requiredPermission?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', icon: LayoutDashboard, path: '/super-admin' }],
  },
  {
    label: 'Organization Management',
    items: [
      { name: 'Organizations', icon: Building2, path: '/super-admin/tenants', requiredPermission: 'tenants:read' },
    ],
  },
  {
    label: 'Identity & Access',
    items: [
      { name: 'Users', icon: Users, path: '/super-admin/users', requiredPermission: 'users:read' },
      { name: 'Roles', icon: ShieldCheck, path: '/super-admin/roles', requiredPermission: 'roles:read' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'Audit Logs', icon: FileText, path: '/super-admin/audit-logs', requiredPermission: 'audit:read' },
      { name: 'System Errors', icon: AlertTriangle, path: '/super-admin/errors', requiredPermission: 'monitoring:read' },
      { name: 'Health Checks', icon: HeartPulse, path: '/super-admin/health-checks', requiredPermission: 'monitoring:read' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'System Settings', icon: Settings, path: '/super-admin/settings', requiredPermission: 'settings:write' },
    ],
  },
];

export const SuperAdminSidebar = memo(function SuperAdminSidebar() {
  const pathname = usePathname();
  const collapsed = useSASidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSASidebarStore((s) => s.toggle);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/super-admin') return pathname === '/super-admin';
    return pathname?.startsWith(path);
  };

  // Filter navigation items based on user permissions
  const filteredNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.requiredPermission) return true;
      return can(user?.permissions, item.requiredPermission);
    })
  })).filter(group => group.items.length > 0);

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sa-border">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-sa-accent-bold to-sa-accent rounded-lg flex items-center justify-center shadow-lg shadow-sa-accent/30">
              <LayoutDashboard className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sa-text text-sm block leading-tight">Super Admin</span>
              <span className={cn(componentTextSizes.badge, 'text-sa-text-muted leading-tight')}>PEB Control Plane</span>
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

      <nav className="p-3 space-y-3 overflow-y-auto flex-1">
        {filteredNavGroups.map((group) => {
          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                        active
                          ? 'bg-gradient-to-r from-sa-accent-subtle to-sa-accent-subtle/40 text-sa-accent font-medium'
                          : 'text-sa-text-muted hover:bg-sa-border/50 hover:text-sa-text-secondary',
                        collapsed && 'justify-center',
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-sa-accent' : 'text-sa-text-dim group-hover:text-sa-text-muted',
                        )}
                      />
                      {!collapsed && <span className={cn(componentTextSizes.nav.item)}>{item.name}</span>}
                      {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sa-accent" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sa-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-sa-border-solid to-sa-card-solid rounded-full flex items-center justify-center text-sa-text text-xs font-bold ring-2 ring-sa-border">
              {user?.name?.charAt(0)?.toUpperCase() || 'SA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sa-text-secondary truncate">{user?.name || 'Admin'}</p>
              <p className={cn(componentTextSizes.badge, 'text-sa-text-muted truncate')}>{user?.email}</p>
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
          collapsed ? 'w-[68px]' : 'w-[220px]',
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
