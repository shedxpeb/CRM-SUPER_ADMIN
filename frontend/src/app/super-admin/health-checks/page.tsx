'use client';

import { useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState } from '@/components/sa/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { useSystemLogs } from '@/lib/queries';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { RouteGuard } from '@/features/auth/RouteGuard';

export default function HealthChecksPage() {
  const logs = useSystemLogs({ page: 1, pageSize: 500 });

  const loading = logs.isLoading;
  const error = logs.error;

  const services = useMemo(() => {
    const entries = logs.data?.data ?? [];
    const byService = new Map<string, { errors: number; warns: number; last: string }>();
    for (const log of entries) {
      const name = log.component ?? 'unknown';
      if (!byService.has(name)) byService.set(name, { errors: 0, warns: 0, last: log.createdAt });
      const rec = byService.get(name)!;
      if (log.level === 'ERROR') rec.errors += 1;
      if (log.level === 'WARN') rec.warns += 1;
      if (new Date(log.createdAt) > new Date(rec.last)) rec.last = log.createdAt;
    }
    return [...byService.entries()].map(([name, rec]) => {
      const status = rec.errors > 0 ? 'degraded' : rec.warns > 0 ? 'warning' : 'operational';
      return { name, ...rec, status };
    });
  }, [logs.data]);

  if (loading) return <LoadingState label="Running health checks…" />;
  if (error) return <ErrorState message="Failed to load health data" onRetry={() => logs.refetch()} />;

  const operational = services.filter((s) => s.status === 'operational').length;

  return (
    <RouteGuard requiredPermission="monitoring:read">
      <div>
        <PageHeader
          title="Health Checks"
          subtitle="Service availability derived from recent runtime logs"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={operational === services.length ? 'SUCCESS' : 'WARNING'} />
              <span className="text-xs text-sa-text-muted">
                {operational}/{services.length} services operational
              </span>
            </div>
          }
        />

      {services.length === 0 ? (
        <div className="rounded-xl border border-sa-border p-10 text-center text-sm text-sa-text-muted">
          No service activity recorded yet — health status will appear once services emit logs.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {services.map((s) => {
            const Icon = s.status === 'operational' ? CheckCircle2 : AlertCircle;
            return (
              <Card key={s.name} className={cn('bg-sa-card border', s.status === 'degraded' ? 'border-red-500/30' : s.status === 'warning' ? 'border-yellow-500/30' : 'border-sa-border')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-sa-text-secondary truncate">{s.name}</p>
                    <Icon className={cn('h-4 w-4 shrink-0', s.status === 'degraded' ? 'text-red-400' : s.status === 'warning' ? 'text-yellow-400' : 'text-green-500')} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <StatusBadge status={s.status === 'operational' ? 'SUCCESS' : s.status === 'warning' ? 'WARNING' : 'FAILED'} />
                  </div>
                  <p className="text-[10px] text-sa-text-dim mt-2">
                    {s.errors} errors · {s.warns} warnings {s.last ? `· last ${timeAgo(s.last)}` : '· no logs'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
