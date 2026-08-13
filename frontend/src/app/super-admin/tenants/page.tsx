'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Building2, Eye, Ban, Undo2, UserCog, Settings2, FileText, MoreVertical, Users } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useTenants,
  useCreateTenant,
  useSuspendTenant,
  useUnsuspendTenant,
  useImpersonateTenant,
} from '@/lib/queries';
import { Can, useCan } from '@/features/auth/rbac';
import { formatNumber, formatBytes, timeAgo, formatDate } from '@/lib/format';
import type { Tenant } from '@/lib/types';
import { RouteGuard } from '@/features/auth/RouteGuard';

export default function TenantsPage() {
  const router = useRouter();
  const can = useCan();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Tenant | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');

  const { data, isLoading, isError, refetch } = useTenants({
    page,
    pageSize: 20,
    q: search || undefined,
    status: status || undefined,
  });

  const createTenant = useCreateTenant();
  const suspendTenant = useSuspendTenant();
  const unsuspendTenant = useUnsuspendTenant();
  const impersonate = useImpersonateTenant();

  const handleCreate = async (input: {
    name: string;
    email?: string;
    maxUsers?: number;
    maxStorageGB?: number;
  }) => {
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await createTenant.mutateAsync({ ...input, slug });
    setCreateOpen(false);
  };

  function getTenantHealth(tenant: Tenant): { label: string; variant: 'success' | 'warning' | 'destructive' } {
    if (tenant.status === 'SUSPENDED' || tenant.status === 'DELETED') {
      return { label: 'Critical', variant: 'destructive' };
    }
    const usageRatio = (tenant.userCount ?? 0) / Math.max(tenant.maxUsers, 1);
    if (usageRatio > 0.9) {
      return { label: 'Warning', variant: 'warning' };
    }
    if (tenant.syncState === 'FAILED' || tenant.syncState === 'SYNCING') {
      return { label: 'Warning', variant: 'warning' };
    }
    return { label: 'Healthy', variant: 'success' };
  }

  function getTenantRowClassName(tenant: Tenant): string {
    const health = getTenantHealth(tenant);
    if (health.variant === 'destructive' || tenant.status === 'SUSPENDED') {
      return 'bg-red-500/5';
    }
    if (health.variant === 'warning') {
      return 'bg-yellow-500/5';
    }
    return '';
  }

  const columns: ColumnDef<Tenant, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Tenant Name',
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/super-admin/tenants/${row.original.id}`)}
          className="flex items-center gap-2.5 text-left hover:text-sa-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sa-border-solid to-sa-card-solid flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-sa-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sa-text truncate">{row.original.name}</p>
            <p className="text-xs text-sa-text-dim truncate">{row.original.slug}</p>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Org ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-sa-text-dim">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'maxUsers',
      header: 'Users',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-secondary">
          {formatNumber(row.original.userCount ?? 0)}/{row.original.maxUsers}
        </span>
      ),
    },
    {
      accessorKey: 'maxStorageGB',
      header: 'Storage',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-secondary">{formatBytes(row.original.maxStorageGB * 1024 * 1024 * 1024)}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Activity',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.updatedAt)}</span>,
    },
    {
      accessorKey: 'health',
      header: 'Health',
      cell: ({ row }) => {
        const health = getTenantHealth(row.original);
        return <Badge variant={health.variant} className="text-[10px]">{health.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1.5 text-xs"
            onClick={() => router.push(`/super-admin/tenants/${row.original.id}`)}
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1.5 text-xs"
            onClick={() => router.push(`/super-admin/tenants/${row.original.id}?tab=settings`)}
          >
            <Settings2 className="h-3 w-3" />
            Edit
          </Button>
          {can('organization:impersonate') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={() => {
                setDetail(row.original);
                setImpersonateReason('');
              }}
            >
              <UserCog className="h-3 w-3" />
              Login As
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can('organization:suspend') && (
                row.original.status === 'SUSPENDED' ? (
                  <DropdownMenuItem onClick={() => unsuspendTenant.mutate({ id: row.original.id })}>
                    <Undo2 className="h-3.5 w-3.5 mr-2" />
                    Activate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => suspendTenant.mutate({ id: row.original.id, reason: 'Suspended from console' })}>
                    <Ban className="h-3.5 w-3.5 mr-2" />
                    Suspend
                  </DropdownMenuItem>
                )
              )}
              <DropdownMenuItem onClick={() => router.push(`/super-admin/tenants/${row.original.id}?tab=audit-logs`)}>
                <FileText className="h-3.5 w-3.5 mr-2" />
                View Audit Logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/super-admin/tenants/${row.original.id}?tab=users`)}>
                <Users className="h-3.5 w-3.5 mr-2" />
                Manage Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard requiredPermission="organization:read">
      <div>
        <PageHeader
          title="Tenants"
          subtitle="Manage organizations on the platform"
          actions={
            <Can required="organization:create">
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Tenant
              </Button>
            </Can>
          }
        />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, slug or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearch(searchInput);
              }
            }}
            className="w-full"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No tenants match your filters"
        getRowClassName={getTenantRowClassName}
      />
      <Pagination
        page={page}
        pageSize={20}
        total={data?.meta?.total ?? 0}
        onPageChange={setPage}
      />

      {createOpen && (
        <TenantCreateDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          loading={createTenant.isPending}
        />
      )}

      {detail && (
        <Dialog open onOpenChange={() => setDetail(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonate {detail.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-sa-text-muted">
                You&apos;ll receive a scoped grant token to access this tenant as its super admin. The session is
                audited and expires in 30 minutes.
              </p>
              <Input
                placeholder="Reason (audit log)"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDetail(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={impersonate.isPending}
                  onClick={async () => {
                    const res = await impersonate.mutateAsync({
                      id: detail.id,
                      reason: impersonateReason || 'Console impersonation',
                    });
                    if (res?.token) {
                      localStorage.setItem('sa_impersonation_grant', res.token);
                    }
                    setDetail(null);
                  }}
                  className="gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  Start Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </RouteGuard>
  );
}

function TenantCreateDialog({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    email?: string;
    maxUsers?: number;
    maxStorageGB?: number;
  }) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [maxUsers, setMaxUsers] = useState('10');
  const [error, setError] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Tenant</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSubmit({ name, email: email || undefined, maxUsers: Number(maxUsers) });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create tenant');
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Organization name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Inc." />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Contact email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acme.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Max users</label>
            <Input
              type="number"
              min={1}
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
