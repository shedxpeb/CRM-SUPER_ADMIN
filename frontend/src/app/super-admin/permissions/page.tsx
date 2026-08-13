'use client';

import { useMemo } from 'react';
import { KeySquare, Check, Minus, Users, Building2, FileText, Settings, ShieldCheck, Activity } from 'lucide-react';
import { PageHeader, ErrorState } from '@/components/sa/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoles, usePermissions } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { titleCase } from '@/lib/format';
import type { Role } from '@/lib/types';
import { RouteGuard } from '@/features/auth/RouteGuard';

const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'] as const;

const CRM_MODULES = [
  { key: 'leads', name: 'Lead Management', icon: Activity },
  { key: 'customers', name: 'Customers', icon: Users },
  { key: 'projects', name: 'Projects', icon: Building2 },
  { key: 'inventory', name: 'Inventory', icon: FileText },
  { key: 'purchase_orders', name: 'Purchase Orders', icon: FileText },
  { key: 'tracking', name: 'Tracking', icon: Activity },
  { key: 'reports', name: 'Reports', icon: FileText },
  { key: 'users', name: 'Users', icon: Users },
  { key: 'roles', name: 'Roles', icon: ShieldCheck },
  { key: 'settings', name: 'Settings', icon: Settings },
] as const;

function parseKey(key: string): { module: string; action: string } {
  const idx = key.indexOf(':');
  if (idx === -1) return { module: key, action: '' };
  return { module: key.slice(0, idx), action: key.slice(idx + 1) };
}

export default function PermissionsPage() {
  const roles = useRoles({ page: 1, pageSize: 500 });
  const permissions = usePermissions({ page: 1, pageSize: 1000 });

  const error = roles.error || permissions.error;

  const matrix = useMemo(() => {
    const roleList = roles.data?.data ?? [];
    const permList = permissions.data?.data ?? [];

    const moduleMap = new Map<string, Set<string>>();
    for (const p of permList) {
      const { module, action } = parseKey(p.key);
      if (!action) continue;
      if (!moduleMap.has(module)) moduleMap.set(module, new Set());
      moduleMap.get(module)!.add(action);
    }

    const rolePerms = new Map<string, Set<string>>();
    for (const r of roleList) {
      const keys = new Set<string>();
      for (const p of r.permissions ?? []) keys.add(p.key);
      rolePerms.set(r.id, keys);
    }

    const rows: {
      module: string;
      moduleName: string;
      icon: typeof Activity;
      actions: { action: string; granted: Role[] }[];
    }[] = [];

    for (const moduleDef of CRM_MODULES) {
      const actionSet = moduleMap.get(moduleDef.key);
      if (!actionSet || actionSet.size === 0) continue;

      const actions = [...actionSet].sort((a, b) => ACTIONS.indexOf(a as never) - ACTIONS.indexOf(b as never)).map((action) => {
        const granted = roleList.filter((r) => rolePerms.get(r.id)?.has(`${moduleDef.key}:${action}`));
        return { action, granted };
      });
      rows.push({ module: moduleDef.key, moduleName: moduleDef.name, icon: moduleDef.icon, actions });
    }

    return { roleList, rows };
  }, [roles.data, permissions.data]);

  if (error) return <ErrorState message="Failed to load permissions" onRetry={() => { roles.refetch(); permissions.refetch(); }} />;

  return (
    <RouteGuard requiredPermission="permissions:read">
      <div>
        <PageHeader
          title="CRM Permissions Matrix"
          subtitle="Module-wise capability matrix across all CRM roles"
          actions={
            <Badge variant="secondary" className="gap-1.5">
              <KeySquare className="h-3.5 w-3.5" />
              {matrix.rows.length} modules · {matrix.roleList.length} roles
            </Badge>
          }
        />

      <div className="space-y-4">
        {matrix.rows.map((row) => {
          const Icon = row.icon;
          return (
            <Card key={row.module} className="bg-sa-card border-sa-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-sa-accent" />
                  <h3 className="text-sm font-semibold text-sa-text">{row.moduleName}</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ACTIONS.map((action) => {
                    const cell = row.actions.find((a) => a.action === action);
                    return (
                      <div key={action} className="p-2 rounded-lg border border-sa-border bg-sa-chart-bg">
                        <div className="text-[10px] font-medium text-sa-text-muted mb-1.5 text-center uppercase">{titleCase(action)}</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {cell?.granted.length === 0 ? (
                            <Minus className="h-3 w-3 text-sa-text-dim" />
                          ) : (
                            cell?.granted.map((r) => (
                              <span
                                key={r.id}
                                title={r.name}
                                className={cn(
                                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]',
                                  r.isSystem
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-sa-card-solid text-sa-text-muted',
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                                {r.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </RouteGuard>
  );
}
