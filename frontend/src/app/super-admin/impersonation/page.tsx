'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { useImpersonations, useActiveImpersonation, useExitImpersonation } from '@/lib/queries';
import { formatDateTime, formatDuration } from '@/lib/format';
import type { ImpersonationLog } from '@/lib/types';

export default function ImpersonationPage() {
  const [page, setPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(false);
  const { data, isLoading, isError, refetch } = useImpersonations({
    page,
    pageSize: 20,
    active: activeOnly ? 'true' : undefined,
  });

  const active = useActiveImpersonation();
  const exit = useExitImpersonation();

  const columns: ColumnDef<ImpersonationLog, unknown>[] = [
    {
      accessorKey: 'superAdminEmail',
      header: 'Super Admin',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm text-sa-text">{row.original.superAdminEmail}</p>
          <p className="text-xs text-sa-text-dim">{formatDateTime(row.original.startedAt)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'tenant',
      header: 'Tenant',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm text-sa-text-secondary">{row.original.tenant?.name ?? row.original.tenantId}</p>
          <p className="text-xs text-sa-text-dim">{row.original.tenant?.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-secondary">{row.original.reason ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.endedAt ? <StatusBadge status="COMPLETED" /> : <StatusBadge status="ACTIVE" />,
    },
    {
      accessorKey: 'durationSeconds',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-muted">
          {row.original.durationSeconds ? formatDuration(row.original.durationSeconds) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'targetUserEmail',
      header: 'Target User',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-muted">{row.original.targetUserEmail ?? '—'}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Impersonation Sessions"
        subtitle="Audit trail of tenant impersonation activity"
        actions={
          active.data?.active ? (
            <Button
              variant="destructive"
              className="gap-2"
              disabled={exit.isPending}
              onClick={() => exit.mutate(undefined, { onSuccess: () => setPage(1) })}
            >
              <LogOut className="h-4 w-4" />
              Exit active session
            </Button>
          ) : undefined
        }
      />

      {active.data?.active && (
        <div
          className="rounded-xl border border-red-500/25 p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          <div>
            <p className="text-sm font-medium text-red-400">You have an active impersonation session</p>
            <p className="text-xs text-sa-text-muted mt-1">
              {active.data.tenant?.name} · started {formatDateTime(active.data.startedAt)} ·{' '}
              {active.data.reason ?? 'no reason'}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => exit.mutate(undefined)}>
            <LogOut className="h-3.5 w-3.5" />
            End session
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-sa-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-[var(--sa-accent)]"
          />
          Active only
        </label>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No impersonation sessions found"
      />
      <Pagination page={page} pageSize={20} total={data?.meta?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
