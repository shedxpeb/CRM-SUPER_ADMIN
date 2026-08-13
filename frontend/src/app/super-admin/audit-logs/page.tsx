'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { LevelBadge } from '@/components/sa/StatusBadge';
import { Input } from '@/components/ui/input';
import { useAuditLogs } from '@/lib/queries';
import { formatDateTime, truncate } from '@/lib/format';
import type { AuditLogEntry } from '@/lib/types';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [actionInput, setActionInput] = useState('');

  const { data, isLoading, isError, refetch } = useAuditLogs({
    page,
    pageSize: 25,
    action: action || undefined,
  });

  const columns: ColumnDef<AuditLogEntry, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-sa-text-secondary">{row.original.action}</span>
      ),
    },
    {
      accessorKey: 'actorEmail',
      header: 'Actor',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-secondary">{row.original.actorEmail ?? 'system'}</span>
      ),
    },
    {
      accessorKey: 'targetType',
      header: 'Target',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-xs text-sa-text-secondary">{row.original.targetType ?? '—'}</p>
          {row.original.targetId && (
            <p className="text-[10px] text-sa-text-dim font-mono">{truncate(row.original.targetId, 18)}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => <LevelBadge level={row.original.severity} />,
    },
    {
      accessorKey: 'correlationId',
      header: 'Trace',
      cell: ({ row }) => (
        <span className="text-[10px] font-mono text-sa-text-dim">
          {row.original.correlationId ? truncate(row.original.correlationId, 12) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Append-only record of admin actions across the platform" />
      <div className="max-w-md mb-4">
        <Input
          placeholder="Filter by action (e.g. tenants.suspend)…"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setAction(actionInput);
            }
          }}
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No audit log entries found"
      />
      <Pagination page={page} pageSize={25} total={data?.meta?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
