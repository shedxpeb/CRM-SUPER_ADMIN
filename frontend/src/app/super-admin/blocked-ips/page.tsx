'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBlockedIps, useCreateBlockedIp, useUnblockIp } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import type { BlockedIp } from '@/lib/types';

export default function BlockedIpsPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const blockedIps = useBlockedIps({ page, pageSize: 20, active: 'true' });
  const createBlockedIp = useCreateBlockedIp();
  const unblock = useUnblockIp();

  const columns: ColumnDef<BlockedIp, unknown>[] = [
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => <span className="text-xs font-mono text-sa-text-secondary">{row.original.ipAddress}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.reason ?? '—'}</span>,
    },
    {
      accessorKey: 'blockedUntil',
      header: 'Blocked until',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-muted">
          {row.original.blockedUntil ? formatDateTime(row.original.blockedUntil) : 'Permanent'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Blocked at',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDateTime(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => unblock.mutate(row.original.id)}>
            Unblock
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Blocked IPs"
        subtitle="IP addresses blocked from accessing the platform"
        actions={
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Block IP
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={blockedIps.data?.data ?? []}
        isLoading={blockedIps.isLoading}
        isError={blockedIps.isError}
        onRetry={blockedIps.refetch}
        emptyMessage="No blocked IPs"
      />
      <Pagination page={page} pageSize={20} total={blockedIps.data?.meta?.total ?? 0} onPageChange={setPage} />

      {open && (
        <BlockIpDialog
          onClose={() => setOpen(false)}
          onSubmit={async (input) => {
            await createBlockedIp.mutateAsync(input);
            setOpen(false);
          }}
          loading={createBlockedIp.isPending}
        />
      )}
    </div>
  );
}

function BlockIpDialog({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (input: { ipAddress: string; reason?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block IP Address</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSubmit({ ipAddress, reason: reason || undefined });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to block IP');
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">IP address</label>
            <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required placeholder="203.0.113.7" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Suspected abuse" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              {loading ? 'Blocking…' : 'Block'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
