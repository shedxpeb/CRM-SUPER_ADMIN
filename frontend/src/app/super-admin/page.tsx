'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminKPICard } from '@/features/super-admin/components/AdminKPICard';
import { LiveActivityFeed, ActivityItem } from '@/features/super-admin/components/LiveActivityFeed';
import { SystemAlerts, SystemAlert } from '@/features/super-admin/components/SystemAlerts';
import {
  Building2, CheckCircle2, Ban, Users, AlertTriangle,
  Server, Activity, Zap, FileText, ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  useTenants,
  useUsers,
  useSystemLogs,
} from '@/lib/queries';
import { ErrorState } from '@/components/sa/PageHeader';
import { timeAgo, formatNumber } from '@/lib/format';
import { RouteGuard } from '@/features/auth/RouteGuard';

const quickActions = [
  { label: 'Create Organization', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/super-admin/tenants' },
  { label: 'Manage Users', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/super-admin/users' },
  { label: 'Roles & Permissions', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10', href: '/super-admin/roles' },
  { label: 'Audit Logs', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', href: '/super-admin/audit-logs' },
  { label: 'Health Checks', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10', href: '/super-admin/health-checks' },
];

function buildTenantGrowth(tenants: { createdAt: string }[], weeks = 12): { label: string; count: number }[] {
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (weeks - 1 - i) * 7);
    return { start: start.getTime(), end: start.getTime() + 7 * 86400000, count: 0 };
  });
  for (const t of tenants) {
    const ms = new Date(t.createdAt).getTime();
    for (const b of buckets) {
      if (ms >= b.start && ms < b.end) {
        b.count++;
        break;
      }
    }
  }
  return buckets.map((b) => ({
    label: new Date(b.start).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    count: b.count,
  }));
}

function buildHourlyVolume(logs: { createdAt: string; level: string }[], hours = 24): { period: string; label: string; total: number; errors: number }[] {
  const now = new Date();
  const buckets = Array.from({ length: hours }, (_, i) => {
    const start = new Date(now.getTime() - (hours - i) * 3600000);
    return { period: start.toISOString(), label: i % 4 === 0 ? `${start.getHours()}:00` : '', total: 0, errors: 0 };
  });
  for (const l of logs) {
    const ms = new Date(l.createdAt).getTime();
    const idx = Math.floor((ms - (now.getTime() - hours * 3600000)) / 3600000);
    const b = buckets[idx];
    if (!b) continue;
    b.total++;
    if (l.level === 'ERROR' || l.level === 'FATAL') b.errors++;
  }
  return buckets;
}

function buildComponentHealth(logs: { component?: string | null; level: string }[]): { name: string; status: 'Operational' | 'Degraded'; errors: number; total: number }[] {
  const byName = new Map<string, { total: number; errors: number }>();
  for (const l of logs) {
    const name = l.component || 'api';
    const cur = byName.get(name) ?? { total: 0, errors: 0 };
    cur.total++;
    if (l.level === 'ERROR' || l.level === 'FATAL') cur.errors++;
    byName.set(name, cur);
  }
  return [...byName.entries()]
    .map(([name, s]): { name: string; status: 'Operational' | 'Degraded'; errors: number; total: number } => ({
      name,
      ...s,
      status: s.errors > 0 ? 'Degraded' : 'Operational',
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

export default function SuperAdminPage() {
  const tenants = useTenants({ page: 1, pageSize: 1 });
  const activeTenants = useTenants({ page: 1, pageSize: 1, status: 'ACTIVE' });
  const suspendedTenants = useTenants({ page: 1, pageSize: 1, status: 'SUSPENDED' });
  const growthTenants = useTenants({ page: 1, pageSize: 1000 });
  const users = useUsers({ page: 1, pageSize: 1 });
  const errorLogs = useSystemLogs({ page: 1, pageSize: 1, level: 'ERROR' });
  const allLogs = useSystemLogs({ page: 1, pageSize: 200 });

  const error = tenants.error || users.error || errorLogs.error;

  if (error) return <ErrorState message="Failed to load dashboard data" onRetry={() => { tenants.refetch(); users.refetch(); errorLogs.refetch(); }} />;

  const totalTenants = tenants.data?.meta?.total ?? 0;
  const activeCount = activeTenants.data?.meta?.total ?? 0;
  const suspendedCount = suspendedTenants.data?.meta?.total ?? 0;
  const platformUsers = users.data?.meta?.total ?? 0;
  const criticalErrors = errorLogs.data?.meta?.total ?? 0;

  const sampledLogs = allLogs.data?.data ?? [];
  const healthHits = sampledLogs.filter((l) => l.level !== 'ERROR' && l.level !== 'FATAL').length;
  const apiHealth = sampledLogs.length > 0 ? Math.round((healthHits / sampledLogs.length) * 100) : 100;

  // Real chart data. Tenant growth: bucket tenants by ISO week (last 12 weeks).
  const tenantGrowth = buildTenantGrowth(growthTenants.data?.data ?? []);
  const hourlyVolume = buildHourlyVolume(sampledLogs);
  const componentHealth = buildComponentHealth(sampledLogs);

  const activityFeed: ActivityItem[] = sampledLogs.slice(0, 10).map((log) => {
    const meta = (log.metadata ?? {}) as Record<string, unknown>;
    return {
      id: log.id,
      userName: typeof meta.actor === 'string' ? meta.actor : (log.component ?? 'system'),
      tenantName: typeof meta.tenantName === 'string' ? meta.tenantName : 'Platform',
      action: `${log.level} ${log.message.slice(0, 80)}`,
      module: typeof meta.module === 'string' ? meta.module : (log.component ?? 'system'),
      time: timeAgo(log.createdAt),
    };
  });

  const systemAlerts: SystemAlert[] = (allLogs.data?.data ?? []).map((log) => ({
    id: log.id,
    type: log.level === 'ERROR' ? 'critical' : log.level === 'WARN' ? 'warning' : 'info',
    title: log.message.length > 60 ? `${log.message.slice(0, 60)}…` : log.message,
    description: log.component ?? 'Platform',
    module: log.component ?? 'System',
    time: timeAgo(log.createdAt),
    resolved: false,
  }));

  return (
    <RouteGuard requiredPermission="dashboard:read">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-sa-text">Executive Dashboard</h1>
          <p className="text-sm text-sa-text-muted mt-0.5">Platform-wide metrics, tenant health, and system status</p>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <AdminKPICard
          title="Total Tenants"
          value={totalTenants}
          icon={<Building2 className="h-4 w-4" />}
          color="text-blue-500"
          onClick={() => { window.location.href = '/super-admin/tenants'; }}
        />
        <AdminKPICard
          title="Active Tenants"
          value={activeCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-green-500"
          onClick={() => { window.location.href = '/super-admin/tenants?status=ACTIVE'; }}
        />
        <AdminKPICard
          title="Suspended"
          value={suspendedCount}
          icon={<Ban className="h-4 w-4" />}
          color="text-red-500"
          onClick={() => { window.location.href = '/super-admin/tenants?status=SUSPENDED'; }}
        />
        <AdminKPICard
          title="Platform Users"
          value={platformUsers}
          icon={<Users className="h-4 w-4" />}
          color="text-purple-500"
          onClick={() => { window.location.href = '/super-admin/users'; }}
        />
        <AdminKPICard
          title="Platform Health"
          value={`${apiHealth}%`}
          icon={<Activity className="h-4 w-4" />}
          color={apiHealth >= 99 ? 'text-emerald-500' : apiHealth >= 95 ? 'text-yellow-500' : 'text-red-500'}
        />
        <AdminKPICard
          title="Critical Errors"
          value={criticalErrors}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-500"
          onClick={() => { window.location.href = '/super-admin/errors'; }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="bg-sa-card border-sa-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Tenant Growth (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-end justify-around p-4">
              {tenantGrowth.length === 0 ? (
                <p className="text-xs text-sa-text-muted self-center">No tenant signups recorded yet</p>
              ) : (
                tenantGrowth.map((point, i) => (
                  <div key={i} className="flex-1 max-w-6 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-400 hover:to-blue-300"
                      style={{ height: `${Math.max(8, (point.count / Math.max(1, ...tenantGrowth.map((p) => p.count))) * 100)}%` }}
                      title={`${point.count} signups`}
                    />
                    <span className="text-[9px] text-sa-text-muted">{point.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-sa-card border-sa-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Error Rate (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-32 flex items-end justify-around p-4">
              {hourlyVolume.length === 0 ? (
                <p className="text-xs text-sa-text-muted self-center">No recent log data</p>
              ) : (
                hourlyVolume.map((point, i) => {
                  const rate = point.total > 0 ? point.errors / point.total : 0;
                  return (
                    <div key={i} className="flex-1 max-w-3 flex flex-col items-center justify-end gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all"
                        style={{ height: `${Math.max(6, rate * 100)}%` }}
                        title={`${point.errors}/${point.total} error logs at ${point.period}`}
                      />
                      <span className="text-[8px] text-sa-text-muted">{point.label}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="bg-sa-card border-sa-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Log Volume (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-32 flex items-end justify-around p-4">
              {hourlyVolume.length === 0 ? (
                <p className="text-xs text-sa-text-muted self-center">No recent log data</p>
              ) : (
                hourlyVolume.map((point, i) => (
                  <div key={i} className="flex-1 max-w-3 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                      style={{ height: `${Math.max(8, Math.min(1, point.total / 100)) * 100}%` }}
                      title={`${point.total} logs at ${point.period}`}
                    />
                    <span className="text-[8px] text-sa-text-muted">{point.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveActivityFeed activities={activityFeed} />
        <div className="space-y-4">
          <SystemAlerts alerts={systemAlerts} />

          <Card className="bg-sa-card border-sa-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-sa-text-muted flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                {componentHealth.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-lg border border-sa-border hover:bg-sa-row-hover">
                    <div className="flex items-center gap-2">
                      <Server className={cn('h-3.5 w-3.5', item.status === 'Operational' ? 'text-green-500' : 'text-red-500')} />
                      <span className="text-xs text-sa-text-secondary">{item.name}</span>
                    </div>
                    <Badge variant={item.status === 'Operational' ? 'success' : 'destructive'} className="text-[9px]">{item.status}</Badge>
                  </div>
                ))}
                {componentHealth.length === 0 && (
                  <p className="text-xs text-sa-text-muted col-span-2 py-2">No system components seen recently</p>
                )}
              </div>
              <div className="pt-2 border-t border-sa-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sa-text-muted">Recent Log Events</span>
                  <span className="text-[11px] text-sa-text-secondary">{formatNumber(sampledLogs.length)}</span>
                </div>
                <div className="w-full bg-sa-input rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${apiHealth}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sa-text-muted">Error Rate</span>
                  <span className={cn('text-[11px] font-medium', (100 - apiHealth) > 1 ? 'text-red-500' : 'text-green-500')}>{100 - apiHealth}%</span>
                </div>
                <div className="w-full bg-sa-input rounded-full h-1.5">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${100 - apiHealth}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sa-text-muted">Critical Errors</span>
                  <span className={cn('text-[11px] font-medium', criticalErrors > 0 ? 'text-yellow-500' : 'text-green-500')}>{criticalErrors}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sa-text-muted flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-sa-border bg-sa-chart-bg hover:bg-sa-card-hover hover:border-sa-border-solid transition-all cursor-pointer group">
                    <div className={cn('p-2.5 rounded-xl', action.bg)}>
                      <Icon className={cn('h-5 w-5', action.color)} />
                    </div>
                    <span className="text-xs text-sa-text-muted group-hover:text-sa-text transition-colors text-center">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
    </RouteGuard>
  );
}