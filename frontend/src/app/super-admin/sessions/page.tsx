'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { BooleanBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { useSessions, useRevokeSession } from '@/lib/queries';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { PlatformSession } from '@/lib/types';

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const sessions = useSessions({ page, pageSize: 20 });
  const revokeSession = useRevokeSession();

  const columns: ColumnDef<PlatformSession, unknown>[] = [
    {
      accessorKey: 'userAgent',
      header: 'Device',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm text-sa-text-secondary truncate max-w-[260px]">
            {row.original.deviceInfo ?? row.original.userAgent ?? 'Unknown device'}
          </p>
          <p className="text-xs text-sa-text-dim">{row.original.ipAddress ?? '—'} {row.original.location ?? ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <BooleanBadge value={row.original.isActive} trueLabel="Active" falseLabel="Revoked" />,
    },
    {
      accessorKey: 'lastActivityAt',
      header: 'Last activity',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.lastActivityAt)}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.isActive ? (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-400"
              onClick={() => revokeSession.mutate(row.original.id)}
            >
              Revoke
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Sessions" subtitle="Active sessions across the platform" />
      <DataTable
        columns={columns}
        data={sessions.data?.data ?? []}
        isLoading={sessions.isLoading}
        isError={sessions.isError}
        onRetry={sessions.refetch}
        emptyMessage="No sessions"
      />
      <Pagination page={page} pageSize={20} total={sessions.data?.meta?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
