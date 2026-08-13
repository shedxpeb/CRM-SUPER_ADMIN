'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ShieldCheck, Users } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { BooleanBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useRoles,
  usePermissions,
  useRole,
  useRoleUsers,
  useCreateRole,
  useAssignRolePermissions,
} from '@/lib/queries';
import { formatNumber } from '@/lib/format';
import type { Role } from '@/lib/types';
import { RouteGuard } from '@/features/auth/RouteGuard';

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useRoles({ page, pageSize: 20 });
  const createRole = useCreateRole();

  const columns: ColumnDef<Role, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Role',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sa-border-solid to-sa-card-solid flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-sa-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sa-text">{row.original.name}</p>
            <p className="text-xs text-sa-text-dim">{formatNumber(row.original.userCount ?? 0)} assigned</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-muted">{row.original.description ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'permissionCount',
      header: 'Permissions',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-secondary">{formatNumber(row.original.permissionCount ?? 0)}</span>
      ),
    },
    {
      accessorKey: 'isSystem',
      header: 'System',
      cell: ({ row }) => <BooleanBadge value={row.original.isSystem} trueLabel="Yes" falseLabel="No" />,
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => <BooleanBadge value={row.original.isActive} trueLabel="Yes" falseLabel="No" />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setManageId(row.original.id)}
          >
            <Users className="h-3.5 w-3.5" />
            Manage permissions
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard requiredPermission="roles:read">
      <div>
        <PageHeader
          title="Roles & Permissions"
          subtitle="RBAC roles and their permission sets"
          actions={
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          }
        />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No roles found"
      />
      <Pagination page={page} pageSize={20} total={data?.meta?.total ?? 0} onPageChange={setPage} />

      {createOpen && (
        <RoleCreateDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            await createRole.mutateAsync(input);
            setCreateOpen(false);
          }}
          loading={createRole.isPending}
        />
      )}

      {manageId && <RoleManageDialog roleId={manageId} onClose={() => setManageId(null)} />}
    </div>
    </RouteGuard>
  );
}

function RoleCreateDialog({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (input: { name: string; description?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Role</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSubmit({ name, description: description || undefined });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create role');
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">
              Name <span className="text-sa-text-dim">(uppercase letters, digits or underscore)</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="SUPPORT_MANAGER" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleManageDialog({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const role = useRole(roleId);
  const permissions = usePermissions({ page: 1, pageSize: 500 });
  const roleUsers = useRoleUsers(roleId);
  const assign = useAssignRolePermissions();

  const currentKeys = new Set((role.data?.permissions ?? []).map((p) => p.key));
  const [selected, setSelected] = useState<Set<string>>(currentKeys);
  const [saved, setSaved] = useState(false);

  const grouped = (permissions.data?.data ?? []).reduce<Record<string, string[]>>((acc, p) => {
    (acc[p.category] ||= []).push(p.key);
    return acc;
  }, {});

  const toggle = (key: string) => {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissions · {role.data?.name}</DialogTitle>
        </DialogHeader>

        {roleUsers.data && roleUsers.data.items.length > 0 && (
          <div className="text-xs text-sa-text-muted">
            Assigned to {roleUsers.data.items.length} user{roleUsers.data.items.length === 1 ? '' : 's'}
          </div>
        )}

        {permissions.isLoading ? (
          <p className="text-sm text-sa-text-muted py-6 text-center">Loading permissions…</p>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
            {Object.entries(grouped).map(([category, keys]) => (
              <div key={category}>
                <p className="text-[10px] uppercase tracking-wider font-medium text-sa-text-muted mb-2">
                  {category}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {keys.map((key) => {
                    const checked = selected.has(key);
                    return (
                      <label
                        key={key}
                        className={[
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-colors',
                          checked
                            ? 'border-sa-accent bg-red-500/10 text-sa-text'
                            : 'border-sa-border text-sa-text-muted hover:text-sa-text',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(key)}
                          className="h-3.5 w-3.5 accent-[var(--sa-accent)]"
                        />
                        <span className="font-mono">{key}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {saved && <p className="text-xs text-emerald-400">Saved.</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={assign.isPending}
            onClick={async () => {
              await assign.mutateAsync({ id: roleId, permissionKeys: Array.from(selected) });
              setSaved(true);
            }}
          >
            {assign.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
