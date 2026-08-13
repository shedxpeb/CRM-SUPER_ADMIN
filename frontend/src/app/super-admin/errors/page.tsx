'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { LevelBadge } from '@/components/sa/StatusBadge';
import { useErrors } from '@/lib/queries';
import { formatDateTime, truncate } from '@/lib/format';
import type { PlatformError } from '@/lib/types';

export default function ErrorsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useErrors({
    page,
    pageSize: 50,
  });

  const columns: ColumnDef<PlatformError, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Level',
      cell: ({ row }) => <LevelBadge level={row.original.severity} />,
    },
    {
      accessorKey: 'service',
      header: 'Service',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-sa-text-secondary">{row.original.service ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.type ?? '—'}</span>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[460px]">
          <p className="text-xs font-mono text-sa-text-secondary break-words">{truncate(row.original.message, 120)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <span className="text-[10px] font-mono text-sa-text-dim">{row.original.status}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Errors"
        subtitle="Runtime errors captured from backend services"
        actions={
          <div className="text-xs text-sa-text-muted">
            {data?.meta?.total != null ? `${data.meta.total} recorded` : ''}
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No errors found — all systems nominal"
      />
      <Pagination page={page} pageSize={50} total={data?.meta?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
