'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { useLoginAttempts } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import type { LoginAttempt } from '@/lib/types';

export default function LoginAttemptsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useLoginAttempts({ page, pageSize: 20 });

  const columns: ColumnDef<LoginAttempt, unknown>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.email}</span>,
    },
    {
      accessorKey: 'success',
      header: 'Outcome',
      cell: ({ row }) => <StatusBadge status={row.original.success ? 'SUCCESS' : 'FAILED'} />,
    },
    {
      accessorKey: 'failureReason',
      header: 'Reason',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.failureReason ?? '—'}</span>,
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
      cell: ({ row }) => <span className="text-xs font-mono text-sa-text-muted">{row.original.ipAddress ?? '—'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'When',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDateTime(row.original.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Login Attempts" subtitle="Authentication attempts across the platform" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No login attempts"
      />
      <Pagination page={page} pageSize={20} total={data?.meta?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
