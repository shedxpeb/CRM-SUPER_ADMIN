'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Ban, Undo2, Lock, Edit, Key, Shield } from 'lucide-react';
import { PageHeader } from '@/components/sa/PageHeader';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import { BooleanBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUsers, useRoles, useCreateUser, useUpdateUser, useForceLogoutUser, useUnlockUser, useSuspendUser, useResetPassword } from '@/lib/queries';
import { useAuth } from '@/features/auth/AuthContext';
import { RouteGuard } from '@/features/auth/RouteGuard';
import { timeAgo } from '@/lib/format';
import type { PlatformUser } from '@/lib/types';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [resetUser, setResetUser] = useState<PlatformUser | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({ page, pageSize: 20, q: search || undefined });
  const roles = useRoles({ page: 1, pageSize: 100 });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const forceLogoutUser = useForceLogoutUser();
  const unlockUser = useUnlockUser();
  const suspendUser = useSuspendUser();
  const resetPassword = useResetPassword();

  const handleEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const handleUnlock = async (userId: string) => {
    await unlockUser.mutateAsync(userId);
  };

  const handleForceLogout = async (userId: string) => {
    await forceLogoutUser.mutateAsync(userId);
  };

  const handleResetPassword = async (user: PlatformUser) => {
    setResetUser(user);
  };

  const handleDisable = async (user: PlatformUser) => {
    await suspendUser.mutateAsync({ id: user.id, reason: 'Disabled from console' });
  };

  const columns: ColumnDef<PlatformUser, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-sa-text">{row.original.name ?? row.original.email}</p>
          <p className="text-xs text-sa-text-dim truncate">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.email}</span>,
    },
    {
      accessorKey: 'roles',
      header: 'Role',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.roles ?? []).map((r) => (
            <Badge key={r.id} variant="secondary" className="text-[10px] gap-1">
              <Shield className="h-2.5 w-2.5" />
              {r.name}
            </Badge>
          ))}
          {(row.original.roles ?? []).length === 0 && (
            <Badge variant="outline" className="text-[10px]">No roles</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isLocked ? (
          <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            Locked
          </Badge>
        ) : (
          <BooleanBadge value={row.original.isActive} trueLabel="Active" falseLabel="Inactive" />
        ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.lastLoginAt ? timeAgo(row.original.lastLoginAt) : 'Never'}</span>,
    },
    {
      accessorKey: 'activeSessions',
      header: 'Sessions',
      cell: ({ row }) => (
        <Badge variant={(row.original.activeSessions ?? 0) > 0 ? 'secondary' : 'outline'} className="text-[10px]">
          {row.original.activeSessions ?? 0} active
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) =>
        row.original.id === currentUser?.id ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7">
                <span className="sr-only">Actions</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => handleForceLogout(row.original.id)}
              >
                <Lock className="h-3.5 w-3.5" />
                Force Logout
              </DropdownMenuItem>
              {row.original.isLocked && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-green-400"
                  onClick={() => handleUnlock(row.original.id)}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Unlock
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => handleResetPassword(row.original)}
              >
                <Key className="h-3.5 w-3.5" />
                Reset Password
              </DropdownMenuItem>
              {row.original.isActive ? (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-400"
                  onClick={() => handleDisable(row.original)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Disable
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-green-400"
                  onClick={async () => {
                    await updateUser.mutateAsync({ id: row.original.id, input: { isActive: true } });
                  }}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Enable
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  return (
    <RouteGuard requiredPermission="users:read">
      <div>
        <PageHeader
          title="Users"
          subtitle="Platform operators and their role assignments"
          actions={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        }
      />

      <div className="max-w-md mb-4">
        <Input
          placeholder="Search by email or name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(searchInput);
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
        emptyMessage="No users found"
      />
      <Pagination page={page} pageSize={20} total={data?.meta?.total ?? 0} onPageChange={setPage} />

      {createOpen && (
        <UserCreateDialog
          roles={roles.data?.data ?? []}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            await createUser.mutateAsync(input);
            setCreateOpen(false);
          }}
          loading={createUser.isPending}
        />
      )}

      {editOpen && editingUser && (
        <UserEditDialog
          user={editingUser}
          roles={roles.data?.data ?? []}
          onClose={() => { setEditOpen(false); setEditingUser(null); }}
          onSubmit={async (input) => {
            await updateUser.mutateAsync({ id: editingUser.id, input });
            setEditOpen(false);
            setEditingUser(null);
          }}
          loading={updateUser.isPending}
        />
      )}

      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          loading={resetPassword.isPending}
          onClose={() => setResetUser(null)}
          onSubmit={async (newPassword) => {
            await resetPassword.mutateAsync({ id: resetUser.id, newPassword });
            setResetUser(null);
          }}
        />
      )}
    </div>
    </RouteGuard>
);
}

function UserEditDialog({
  user,
  roles,
  onClose,
  onSubmit,
  loading,
}: {
  user: PlatformUser;
  roles: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (input: {
    name?: string;
    roleIds?: string[];
    isActive?: boolean;
  }) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState(user.name ?? '');
  const [roleIds, setRoleIds] = useState<string[]>(user.roles?.map(r => r.id) ?? []);
  const [isActive, setIsActive] = useState(user.isActive);
  const [error, setError] = useState('');

  const toggleRole = (id: string) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.email}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSubmit({
                name: name || undefined,
                roleIds: roleIds.length ? roleIds : undefined,
                isActive,
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to update user');
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Status</label>
            <select
              value={isActive.toString()}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full bg-sa-input border-sa-border text-sa-text h-9 text-sm rounded-lg px-3"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Roles</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={[
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    roleIds.includes(r.id)
                      ? 'border-sa-accent text-sa-accent bg-red-500/10'
                      : 'border-sa-border text-sa-text-muted hover:text-sa-text',
                  ].join(' ')}
                >
                  {r.name}
                </button>
              ))}
              {roles.length === 0 && <p className="text-xs text-sa-text-dim">No roles available</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserCreateDialog({
  roles,
  onClose,
  onSubmit,
  loading,
}: {
  roles: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (input: {
    email: string;
    password: string;
    name: string;
    roleIds?: string[];
  }) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleRole = (id: string) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Platform User</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSubmit({
                email,
                password,
                name: name || email.split('@')[0],
                roleIds: roleIds.length ? roleIds : undefined,
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create user');
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Roles</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={[
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    roleIds.includes(r.id)
                      ? 'border-sa-accent text-sa-accent bg-red-500/10'
                      : 'border-sa-border text-sa-text-muted hover:text-sa-text',
                  ].join(' ')}
                >
                  {r.name}
                </button>
              ))}
              {roles.length === 0 && <p className="text-xs text-sa-text-dim">No roles available</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  loading,
  onClose,
  onSubmit,
}: {
  user: PlatformUser;
  loading: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password · {user.email}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            if (password !== confirm) {
              setError('Passwords do not match');
              return;
            }
            try {
              await onSubmit(password);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to reset password');
            }
          }}
        >
          <p className="text-sm text-sa-text-muted">
            The user&apos;s active sessions will be revoked and they&apos;ll be required to change
            the password on their next login.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">New password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 chars, incl. upper/lower/digit/special"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Confirm password</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
