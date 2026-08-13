'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Globe, ShieldAlert, Activity, Fingerprint } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { BooleanBadge, StatusBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useBlockedIps,
  useCreateBlockedIp,
  useUnblockIp,
  useSessions,
  useRevokeSession,
  useLoginAttempts,
} from '@/lib/queries';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { BlockedIp, PlatformSession } from '@/lib/types';

export default function SecurityPage() {
  const [tab, setTab] = useState<'sessions' | 'blocked-ips' | 'login-attempts'>('sessions');
  const [page, setPage] = useState(1);
  const [blockOpen, setBlockOpen] = useState(false);

  const sessions = useSessions({ page, pageSize: 20 });
  const blockedIps = useBlockedIps({ page, pageSize: 20, active: 'true' });
  const loginAttempts = useLoginAttempts({ page, pageSize: 20 });
  const createBlockedIp = useCreateBlockedIp();
  const unblock = useUnblockIp();
  const revokeSession = useRevokeSession();

  const sessionColumns: ColumnDef<PlatformSession, unknown>[] = [
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

  const blockedColumns: ColumnDef<BlockedIp, unknown>[] = [
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-sa-text-secondary">{row.original.ipAddress}</span>
      ),
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

  const loginAttemptColumns: ColumnDef<import('@/lib/types').LoginAttempt, unknown>[] = [
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

  const tabs = [
    { key: 'sessions' as const, label: 'Active Sessions', icon: Activity },
    { key: 'blocked-ips' as const, label: 'Blocked IPs', icon: Globe },
    { key: 'login-attempts' as const, label: 'Login Attempts', icon: Fingerprint },
  ];

  return (
    <div>
      <PageHeader
        title="Security"
        subtitle="Sessions, blocked IPs, and authentication activity"
        actions={
          tab === 'blocked-ips' ? (
            <Button className="gap-2" onClick={() => setBlockOpen(true)}>
              <Plus className="h-4 w-4" />
              Block IP
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={[
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'text-sa-accent border-sa-accent'
                  : 'text-sa-text-muted border-transparent hover:text-sa-text',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'sessions' && (
        <>
          <DataTable
            columns={sessionColumns}
            data={sessions.data?.data ?? []}
            isLoading={sessions.isLoading}
            isError={sessions.isError}
            onRetry={sessions.refetch}
            emptyMessage="No sessions"
          />
          <Pagination page={page} pageSize={20} total={sessions.data?.meta?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      {tab === 'blocked-ips' && (
        <>
          <DataTable
            columns={blockedColumns}
            data={blockedIps.data?.data ?? []}
            isLoading={blockedIps.isLoading}
            isError={blockedIps.isError}
            onRetry={blockedIps.refetch}
            emptyMessage="No blocked IPs"
          />
          <Pagination page={page} pageSize={20} total={blockedIps.data?.meta?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      {tab === 'login-attempts' && (
        <>
          <DataTable
            columns={loginAttemptColumns}
            data={loginAttempts.data?.data ?? []}
            isLoading={loginAttempts.isLoading}
            isError={loginAttempts.isError}
            onRetry={loginAttempts.refetch}
            emptyMessage="No login attempts"
          />
          <Pagination page={page} pageSize={20} total={loginAttempts.data?.meta?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      {blockOpen && (
        <BlockIpDialog
          onClose={() => setBlockOpen(false)}
          onSubmit={async (input) => {
            await createBlockedIp.mutateAsync(input);
            setBlockOpen(false);
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
