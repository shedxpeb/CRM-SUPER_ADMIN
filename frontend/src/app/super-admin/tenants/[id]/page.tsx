'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  Undo2,
  Building2,
  Users,
  HardDrive,
  Activity,
  History,
  Calendar,
  Mail,
  Globe,
  Settings2,
  FileText,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Key,
  Puzzle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { PageHeader, LoadingState, ErrorState } from '@/components/sa/PageHeader';
import { StatusBadge } from '@/components/sa/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useTenant,
  useTenantActivity,
  useTenantUsers,
  useTenantRoles,
  useSuspendTenant,
  useUnsuspendTenant,
  useUpdateTenant,
  useAuditLogs,
  useTenantModules,
  useTenantLoginHistory,
  useUpdateTenantModules,
  useTenantAssignableRoles,
  useCreateTenantUser,
  useCreateTenantRole,
  useModuleCatalog,
  usePermissionCatalog,
  useSetTenantRolePermissions,
  useUserRoles,
  useAssignTenantUserRole,
  useRemoveTenantUserRoles,
  useUserPermissions,
  useSetUserPermissions,
  useUserModules,
  useSetUserModules,
} from '@/lib/queries';
import { Can } from '@/features/auth/rbac';
import { RouteGuard } from '@/features/auth/RouteGuard';
import { formatDate, formatNumber, formatBytes, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { TenantActivityEntry, AuditLogEntry, TenantUser, TenantRole } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'roles', label: 'Roles', icon: ShieldCheck },
  { key: 'module-access', label: 'Module Access', icon: Puzzle },
  { key: 'activity', label: 'Activity', icon: History },
  { key: 'login-history', label: 'Login History', icon: LogIn },
  { key: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings2 },
] as const;

function getTenantHealth(tenant: any): { label: string; variant: 'success' | 'warning' | 'destructive'; icon: typeof CheckCircle2 | typeof AlertCircle | typeof XCircle } {
  if (tenant.status === 'SUSPENDED' || tenant.status === 'DELETED') {
    return { label: 'Critical', variant: 'destructive', icon: XCircle };
  }
  const usageRatio = (tenant.userCount ?? 0) / Math.max(tenant.maxUsers, 1);
  if (usageRatio > 0.9) {
    return { label: 'Warning', variant: 'warning', icon: AlertCircle };
  }
  if (tenant.syncState === 'FAILED' || tenant.syncState === 'SYNCING') {
    return { label: 'Warning', variant: 'warning', icon: AlertCircle };
  }
  return { label: 'Healthy', variant: 'success', icon: CheckCircle2 };
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-sa-text-muted">{label}</p>
            <p className="text-xl font-bold text-sa-text mt-1">{value}</p>
            {hint && <p className="text-xs text-sa-text-muted mt-0.5">{hint}</p>}
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sa-border-solid to-sa-card-solid flex items-center justify-center">
            <Icon className="h-4 w-4 text-sa-text-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;

  const [tab, setTab] = useState<string>(() => {
    // Legacy tabs: 'permissions' (per-role CRUD matrix) and 'modules' were merged
    // into a single tenant-level 'module-access' tab with ON/OFF switches only.
    const t = searchParams.get('tab') ?? 'overview';
    return t === 'permissions' || t === 'modules' ? 'module-access' : t;
  });
  const [activityPage, setActivityPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [rolesPage, setRolesPage] = useState(1);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editPermissionsRole, setEditPermissionsRole] = useState<TenantRole | null>(null);
  const [accessControlUser, setAccessControlUser] = useState<TenantUser | null>(null);

  const tenant = useTenant(id);
  const activity = useTenantActivity(id, { page: activityPage, pageSize: 15 });
  const users = useTenantUsers(id, { page: usersPage, pageSize: 15 });
  const roles = useTenantRoles(id, { page: rolesPage, pageSize: 15 });
  const loginHistory = useTenantLoginHistory(id, { page: loginHistoryPage, pageSize: 15 });
  const auditLogs = useAuditLogs({ page: auditPage, pageSize: 15, tenantId: id });
  const tenantModules = useTenantModules(id);
  const suspend = useSuspendTenant();
  const unsuspend = useUnsuspendTenant();
  const updateTenant = useUpdateTenant();
  const updateTenantModules = useUpdateTenantModules();
  const assignableRoles = useTenantAssignableRoles(id);

  if (tenant.isError || !tenant.data)
    return <ErrorState message="Failed to load tenant" onRetry={tenant.refetch} />;

  const t = tenant.data;
  const health = getTenantHealth(t);

  const selectTab = (key: string) => {
    setTab(key);
    router.replace(`/super-admin/tenants/${id}?tab=${key}`, { scroll: false });
  };

  return (
    <RouteGuard requiredPermission="tenants:read" requireTenantId>
      <div>
        <button
          onClick={() => router.push('/super-admin/tenants')}
          className="flex items-center gap-1.5 text-xs text-sa-text-muted hover:text-sa-text transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to tenants
        </button>

      <PageHeader
        title={t.name}
        subtitle={`${t.slug} · Created ${formatDate(t.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={t.status} />
            <Badge variant={health.variant} className="gap-1.5">
              <health.icon className="h-3 w-3" />
              {health.label}
            </Badge>
            <Can required="organization:suspend">
              {t.status === 'SUSPENDED' ? (
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => unsuspend.mutate({ id })}>
                  <Undo2 className="h-3.5 w-3.5" />
                  Activate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => suspend.mutate({ id, reason: 'Suspended from console' })}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Suspend
                </Button>
              )}
            </Can>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push(`/super-admin/tenants/${id}?tab=audit-logs`)}>
              <FileText className="h-3.5 w-3.5" />
              Audit Logs
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-sa-border mb-6 overflow-x-auto pb-px">
        {TABS.map((tabspec) => {
          const Icon = tabspec.icon;
          return (
            <button
              key={tabspec.key}
              onClick={() => selectTab(tabspec.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
                tab === tabspec.key
                  ? 'text-sa-accent border-sa-accent'
                  : 'text-sa-text-muted border-transparent hover:text-sa-text',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tabspec.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Users" value={`${formatNumber(t.userCount ?? 0)} / ${t.maxUsers}`} hint="current / max" />
            <StatCard icon={HardDrive} label="Storage" value={formatBytes(t.maxStorageGB * 1024 * 1024 * 1024)} hint="allocated" />
            <StatCard icon={Calendar} label="Sync" value={t.syncState ?? '—'} hint="last updated" />
            <StatCard icon={Activity} label="Last Activity" value={timeAgo(t.updatedAt)} hint={formatDate(t.updatedAt)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base text-sa-text">Tenant Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow icon={Mail} label="Email" value={t.email ?? '—'} />
                <DetailRow icon={Globe} label="Domain" value={t.domain ?? '—'} />
                <DetailRow icon={Building2} label="Org ID" value={<span className="font-mono text-xs text-sa-text-dim">{t.slug}</span>} />
                <DetailRow icon={HardDrive} label="Max users" value={t.maxUsers} />
                <DetailRow icon={HardDrive} label="Max storage" value={formatBytes(t.maxStorageGB * 1024 * 1024 * 1024)} />
                <DetailRow icon={Calendar} label="Created" value={formatDate(t.createdAt)} />
                <DetailRow icon={Activity} label="Last Activity" value={timeAgo(t.updatedAt)} />
                {t.notes && (
                  <div>
                    <p className="text-xs text-sa-text-muted mb-1">Notes</p>
                    <p className="text-sm text-sa-text-secondary">{t.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-sa-text">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => selectTab('activity')}>
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {activity.isLoading ? (
                  <LoadingState label="Loading activity…" />
                ) : activity.isError ? (
                  <ErrorState message="Failed to load activity" onRetry={activity.refetch} />
                ) : (activity.data?.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-sa-text-muted py-6 text-center">No activity recorded yet</p>
                ) : (
                  <div className="space-y-0">
                    {activity.data!.data.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 py-2.5 border-b last:border-0"
                        style={{ borderColor: 'var(--sa-border)' }}
                      >
                        <div className="w-6 h-6 rounded-full bg-sa-card-solid flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="h-3 w-3 text-sa-text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-sa-text-secondary truncate">{entry.action}</p>
                          <p className="text-xs text-sa-text-dim mt-0.5">
                            {entry.actorEmail ?? 'system'} · {timeAgo(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-sa-text">Users</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            {users.isLoading ? (
              <LoadingState label="Loading users…" />
            ) : users.isError ? (
              <ErrorState message="Failed to load users" onRetry={users.refetch} />
            ) : (
              <>
                <DataTable
                  columns={usersColumns((user) => setAccessControlUser(user))}
                  data={users.data?.data ?? []}
                  isLoading={users.isLoading}
                  isError={users.isError}
                  onRetry={users.refetch}
                  emptyMessage="No users in this tenant"
                />
                <Pagination page={usersPage} pageSize={15} total={users.data?.meta?.total ?? 0} onPageChange={setUsersPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'roles' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-sa-text">Roles</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateRoleOpen(true)}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Add Role
            </Button>
          </CardHeader>
          <CardContent>
            {roles.isLoading ? (
              <LoadingState label="Loading roles…" />
            ) : roles.isError ? (
              <ErrorState message="Failed to load roles" onRetry={roles.refetch} />
            ) : (
              <>
                <DataTable
                  columns={tenantRolesColumns((role) => setEditPermissionsRole(role))}
                  data={roles.data?.data ?? []}
                  isLoading={roles.isLoading}
                  isError={roles.isError}
                  onRetry={roles.refetch}
                  emptyMessage="No roles assigned"
                />
                <Pagination page={rolesPage} pageSize={15} total={roles.data?.meta?.total ?? 0} onPageChange={setRolesPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'module-access' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Module Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-sa-text-muted mb-4">
              Tenant-level module visibility. Detailed CRUD permissions are managed per role in the Roles tab.
            </p>
            {tenantModules.isLoading ? (
              <LoadingState label="Loading modules…" />
            ) : tenantModules.isError ? (
              <ErrorState message="Failed to load modules" onRetry={tenantModules.refetch} />
            ) : (
              <ModulesTab tenantId={id} modules={tenantModules.data ?? {}} onUpdate={updateTenantModules} saving={updateTenantModules.isPending} />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <LoadingState label="Loading activity…" />
            ) : activity.isError ? (
              <ErrorState message="Failed to load activity" onRetry={activity.refetch} />
            ) : (activity.data?.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-sa-text-muted py-6 text-center">No activity recorded yet</p>
            ) : (
              <>
                <div className="space-y-0">
                  {activity.data!.data.map((entry: TenantActivityEntry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 py-2.5 border-b last:border-0"
                      style={{ borderColor: 'var(--sa-border)' }}
                    >
                      <div className="w-6 h-6 rounded-full bg-sa-card-solid flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="h-3 w-3 text-sa-text-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-sa-text-secondary truncate">{entry.action}</p>
                        <p className="text-xs text-sa-text-dim mt-0.5">
                          {entry.actorEmail ?? 'system'} · {entry.targetType ? `${entry.targetType} · ` : ''}
                          {timeAgo(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={activityPage} pageSize={15} total={activity.data?.meta?.total ?? 0} onPageChange={setActivityPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}
      {tab === 'audit-logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.isLoading ? (
              <LoadingState label="Loading audit logs…" />
            ) : auditLogs.isError ? (
              <ErrorState message="Failed to load audit logs" onRetry={auditLogs.refetch} />
            ) : (
              <>
                <DataTable
                  columns={auditColumns}
                  data={auditLogs.data?.data ?? []}
                  isLoading={auditLogs.isLoading}
                  isError={auditLogs.isError}
                  onRetry={auditLogs.refetch}
                  emptyMessage="No audit logs for this tenant"
                />
                <Pagination page={auditPage} pageSize={15} total={auditLogs.data?.meta?.total ?? 0} onPageChange={setAuditPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}
      {tab === 'login-history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Login History</CardTitle>
          </CardHeader>
          <CardContent>
            {loginHistory.isLoading ? (
              <LoadingState label="Loading login history…" />
            ) : loginHistory.isError ? (
              <ErrorState message="Failed to load login history" onRetry={loginHistory.refetch} />
            ) : (
              <>
                <DataTable
                  columns={loginHistoryColumns}
                  data={loginHistory.data?.data ?? []}
                  isLoading={loginHistory.isLoading}
                  isError={loginHistory.isError}
                  onRetry={loginHistory.refetch}
                  emptyMessage="No login history"
                />
                <Pagination page={loginHistoryPage} pageSize={15} total={loginHistory.data?.meta?.total ?? 0} onPageChange={setLoginHistoryPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}
      {tab === 'settings' && <SettingsTab tenant={t} saving={updateTenant.isPending} onSave={(input) => updateTenant.mutate({ id, input })} />}
      {createUserOpen && <AddTenantUserDialog tenantId={id} roles={assignableRoles.data ?? []} onClose={() => setCreateUserOpen(false)} onError={(e) => console.error(e)} />}
      {createRoleOpen && <AddTenantRoleDialog tenantId={id} onClose={() => setCreateRoleOpen(false)} onError={(e) => console.error(e)} />}
      {editPermissionsRole && (
        <RolePermissionsDialog
          tenantId={id}
          role={editPermissionsRole}
          onClose={() => setEditPermissionsRole(null)}
        />
      )}
      {accessControlUser && (
        <UserAccessControlDialog
          tenantId={id}
          user={accessControlUser}
          onClose={() => setAccessControlUser(null)}
        />
      )}
      </div>
    </RouteGuard>
  );
}

function AddTenantUserDialog({
  tenantId,
  roles,
  onClose,
  onError,
}: {
  tenantId: string;
  roles: { id: string; name: string; code: string }[];
  onClose: () => void;
  onError: (error: unknown) => void;
}) {
  const createUser = useCreateTenantUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCreate = async () => {
    setSubmitted(true);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    try {
      await createUser.mutateAsync({
        id: tenantId,
        input: {
          email: email.trim(),
          name: name.trim() || undefined,
          password: password || undefined,
          role: role || undefined,
        },
      });
      onClose();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tenant User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Email</label>
            <Input type="email" placeholder="user@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
              <p className="text-xs text-red-400 mt-1">A valid email is required</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Name</label>
            <Input placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">
              Password <span className="text-sa-text-dim">(optional)</span>
            </label>
            <Input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            <p className="text-xs text-sa-text-dim mt-1">
              Leave blank to let the user set their own password via email OTP (Forgot password).
            </p>
          </div>
          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Role</label>
              <select
                className="w-full rounded-md border border-sa-border bg-sa-input px-3 py-2 text-sm text-sa-text outline-none focus:ring-2 ring-sa-accent/50"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
          {createUser.isError && <p className="text-xs text-red-400">Failed to create user. Check for duplicate emails or missing assignable roles.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={createUser.isPending} onClick={handleCreate} className="gap-2">
              {createUser.isPending ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTenantRoleDialog({
  tenantId,
  onClose,
  onError,
}: {
  tenantId: string;
  onClose: () => void;
  onError: (error: unknown) => void;
}) {
  const createRole = useCreateTenantRole();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createRole.mutateAsync({ id: tenantId, input: { name: name.trim(), code: code.trim() || undefined, description: description.trim() || undefined } });
      onClose();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tenant Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Role name</label>
            <Input placeholder="Sales Manager" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Code</label>
            <Input placeholder="sales_manager" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Description</label>
            <Input placeholder="Manages the sales pipeline" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {createRole.isError && <p className="text-xs text-red-400">Failed to create role. Code may already exist.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={createRole.isPending} onClick={handleCreate} className="gap-2">
              {createRole.isPending ? 'Creating…' : 'Create Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsTab({
  tenant,
  saving,
  onSave,
}: {
  tenant: {
    name: string;
    email?: string | null;
    domain?: string | null;
    maxUsers: number;
    maxStorageGB: number;
    status: string;
  };
  saving: boolean;
  onSave: (input: {
    name?: string;
    email?: string;
    domain?: string;
    maxUsers?: number;
    maxStorageGB?: number;
  }) => void;
}) {
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email ?? '');
  const [domain, setDomain] = useState(tenant.domain ?? '');
  const [maxUsers, setMaxUsers] = useState(String(tenant.maxUsers));
  const [maxStorageGB, setMaxStorageGB] = useState(String(tenant.maxStorageGB));
  const [saved, setSaved] = useState(false);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base text-sa-text">Tenant Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Organization name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Contact email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Domain</label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Max users</label>
            <Input type="number" min={1} value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Max storage (GB)</label>
            <Input type="number" min={1} value={maxStorageGB} onChange={(e) => setMaxStorageGB(e.target.value)} />
          </div>
        </div>
        {saved && <p className="text-xs text-green-500">Settings saved.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            disabled={saving}
            onClick={() => {
              onSave({
                name,
                email: email || undefined,
                domain: domain || undefined,
                maxUsers: Number(maxUsers),
                maxStorageGB: Number(maxStorageGB),
              });
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function usersColumns(onAccessControl: (user: TenantUser) => void): ColumnDef<TenantUser, unknown>[] {
  return [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.name ?? row.original.email}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.email}</span> },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.role ?? '—'}</span> },
    { accessorKey: 'lastLogin', header: 'Last Login', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.lastLogin ? timeAgo(row.original.lastLogin) : '—'}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      id: 'access',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onAccessControl(row.original)}>
          <Key className="h-3.5 w-3.5" />
          Access Control
        </Button>
      ),
    },
  ];
}

const auditColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  { accessorKey: 'action', header: 'Action', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.action}</span> },
  { accessorKey: 'actorEmail', header: 'Actor', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.actorEmail ?? 'system'}</span> },
  { accessorKey: 'targetName', header: 'Target', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.targetName ?? row.original.targetId ?? '—'}</span> },
  { accessorKey: 'severity', header: 'Severity', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.severity}</span> },
  { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.createdAt)}</span> },
];

function tenantRolesColumns(onEditPermissions: (role: TenantRole) => void): ColumnDef<TenantRole, unknown>[] {
  return [
    { accessorKey: 'name', header: 'Role', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.name}</span> },
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="text-xs font-mono text-sa-text-dim">{row.original.code}</span> },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => (
        <span className="text-xs text-sa-text-muted">{(row.original.permissions ?? []).length} granted</span>
      ),
    },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.description ?? '—'}</span> },
    { accessorKey: 'isSystem', header: 'System', cell: ({ row }) => <Badge variant={row.original.isSystem ? 'secondary' : 'outline'} className="text-[10px]">{row.original.isSystem ? 'Yes' : 'No'}</Badge> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEditPermissions(row.original)}>
          <Key className="h-3.5 w-3.5" />
          Edit Permissions
        </Button>
      ),
    },
  ];
}

const loginHistoryColumns: ColumnDef<any, unknown>[] = [
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.email}</span> },
  { accessorKey: 'success', header: 'Status', cell: ({ row }) => <Badge variant={row.original.success ? 'success' : 'destructive'} className="text-[10px]">{row.original.success ? 'Success' : 'Failed'}</Badge> },
  { accessorKey: 'ipAddress', header: 'IP Address', cell: ({ row }) => <span className="text-xs font-mono text-sa-text-dim">{row.original.ipAddress ?? '—'}</span> },
  { accessorKey: 'userAgent', header: 'Device', cell: ({ row }) => <span className="text-xs text-sa-text-muted truncate max-w-[200px]">{row.original.userAgent ?? '—'}</span> },
  { accessorKey: 'failureReason', header: 'Failure Reason', cell: ({ row }) => <span className="text-xs text-red-400">{row.original.failureReason ?? '—'}</span> },
  { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.createdAt)}</span> },
];

// ── Editable permission matrix ──────────────────────────────────────────────
// Renders the full CRM permission catalog as a checkbox grid for one role and
// saves the selection through the SUPER API (which syncs straight to CRM).
function RolePermissionMatrix({
  tenantId,
  role,
  onSaved,
}: {
  tenantId: string;
  role: TenantRole;
  onSaved?: () => void;
}) {
  const catalog = usePermissionCatalog(tenantId);
  const setPerms = useSetTenantRolePermissions();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(role.permissions ?? []));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSelected(new Set(role.permissions ?? []));
    setDirty(false);
  }, [role.id, role.permissions]);

  if (catalog.isLoading) return <LoadingState label="Loading permission catalog…" />;
  if (catalog.isError) return <ErrorState message="Failed to load permission catalog" onRetry={catalog.refetch} />;

  const groups = catalog.data ?? {};
  const moduleKeys = Object.keys(groups).sort();

  const toggle = (perm: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
    setDirty(true);
  };

  const toggleGroup = (perms: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = perms.every((p) => next.has(p));
      if (allChecked) perms.forEach((p) => next.delete(p));
      else perms.forEach((p) => next.add(p));
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    await setPerms.mutateAsync({ id: tenantId, roleId: role.id, permissions: Array.from(selected) });
    setDirty(false);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-sa-text">
          {role.name}
          <span className="ml-2 text-xs text-sa-text-muted">({selected.size} permissions)</span>
        </p>
        <Button size="sm" disabled={!dirty || setPerms.isPending} onClick={handleSave} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {setPerms.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
      {moduleKeys.length === 0 ? (
        <p className="text-sm text-sa-text-muted py-6 text-center">No permissions available</p>
      ) : (
        <div className="rounded-lg border border-sa-border overflow-hidden">
          {moduleKeys.map((modKey, idx) => {
            const perms = groups[modKey];
            const allChecked = perms.every((p) => selected.has(p));
            const someChecked = perms.some((p) => selected.has(p));
            return (
              <div key={modKey} className={idx > 0 ? 'border-t border-sa-border' : ''}>
                <div className="flex items-center justify-between px-3 py-2 bg-sa-card-solid">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked && !allChecked;
                      }}
                      onChange={() => toggleGroup(perms)}
                      className="h-4 w-4 accent-[var(--sa-accent)]"
                    />
                    <span className="text-xs font-semibold text-sa-text-secondary uppercase tracking-wider capitalize">
                      {modKey.replace(/-/g, ' ')}
                    </span>
                  </label>
                </div>
                <div className="px-3 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {perms.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-sa-chart-bg">
                      <input
                        type="checkbox"
                        checked={selected.has(perm)}
                        onChange={() => toggle(perm)}
                        className="h-3.5 w-3.5 accent-[var(--sa-accent)]"
                      />
                      <span className="text-xs font-mono text-sa-text-secondary">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {setPerms.isError && (
        <p className="text-xs text-red-400">Failed to save permissions. Please try again.</p>
      )}
    </div>
  );
}

function RolePermissionsDialog({
  tenantId,
  role,
  onClose,
}: {
  tenantId: string;
  role: TenantRole;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions — {role.name}</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <RolePermissionMatrix tenantId={tenantId} role={role} onSaved={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── User Access Control dialog ───────────────────────────────────────────────
// Per-user tabs: Role Assignment, Direct Permissions (grant/deny), Module Access.
function UserAccessControlDialog({
  tenantId,
  user,
  onClose,
}: {
  tenantId: string;
  user: TenantUser;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'roles' | 'permissions' | 'modules'>('roles');

  const tabButton = (key: typeof tab, label: string, icon: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        tab === key
          ? 'bg-[var(--sa-accent)] text-white'
          : 'text-sa-text-muted hover:bg-sa-card-solid hover:text-sa-text-secondary',
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access Control — {user.name ?? user.email}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-1 pt-1 pb-3 border-b border-sa-border">
          {tabButton('roles', 'Role Assignment', <ShieldCheck className="h-3.5 w-3.5" />)}
          {tabButton('permissions', 'Direct Permissions', <Key className="h-3.5 w-3.5" />)}
          {tabButton('modules', 'Module Access', <Puzzle className="h-3.5 w-3.5" />)}
        </div>
        <div className="pt-4">
          {tab === 'roles' && <UserRoleAssignment tenantId={tenantId} userId={user.id} />}
          {tab === 'permissions' && <UserDirectPermissions tenantId={tenantId} userId={user.id} />}
          {tab === 'modules' && <UserModuleAccessEditor tenantId={tenantId} userId={user.id} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserRoleAssignment({ tenantId, userId }: { tenantId: string; userId: string }) {
  const roles = useTenantAssignableRoles(tenantId);
  const userRoles = useUserRoles(tenantId, userId);
  const assign = useAssignTenantUserRole();
  const removeAll = useRemoveTenantUserRoles();

  if (roles.isLoading || userRoles.isLoading) return <LoadingState label="Loading roles…" />;
  if (roles.isError || userRoles.isError)
    return <ErrorState message="Failed to load roles" onRetry={() => { roles.refetch(); userRoles.refetch(); }} />;

  const assigned = userRoles.data ?? [];
  const available = (roles.data ?? []).filter((r) => !assigned.some((a) => a.id === r.id));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-sa-text-secondary uppercase tracking-wider mb-2">Assigned roles</p>
        {assigned.length === 0 ? (
          <p className="text-sm text-sa-text-muted">No roles assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {assigned.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sa-border bg-sa-chart-bg text-xs text-sa-text-secondary">
                <ShieldCheck className="h-3 w-3 text-green-500" />
                {r.name}
                <button
                  onClick={() => removeAll.mutate({ id: tenantId, userId })}
                  className="text-sa-text-muted hover:text-red-400"
                  title="Remove role"
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-sa-text-secondary uppercase tracking-wider mb-2">Assign a role</p>
        {available.length === 0 ? (
          <p className="text-sm text-sa-text-muted">All roles already assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {available.map((r) => (
              <button
                key={r.id}
                disabled={assign.isPending}
                onClick={() => assign.mutate({ id: tenantId, userId, roleId: r.id })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sa-border text-xs text-sa-text-muted hover:border-sa-accent hover:text-sa-accent disabled:opacity-50"
              >
                <UserPlus className="h-3 w-3" />
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-sa-text-dim">
        Effective permissions = role permissions + granted direct permissions − denied direct permissions.
      </p>
    </div>
  );
}

function UserDirectPermissions({ tenantId, userId }: { tenantId: string; userId: string }) {
  const catalog = usePermissionCatalog(tenantId);
  const overrides = useUserPermissions(tenantId, userId);
  const save = useSetUserPermissions();
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [denied, setDenied] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (overrides.data && !loaded) {
      setGranted(new Set(overrides.data.granted));
      setDenied(new Set(overrides.data.denied));
      setLoaded(true);
    }
  }, [overrides.data, loaded]);

  if (catalog.isLoading || overrides.isLoading) return <LoadingState label="Loading permissions…" />;
  if (catalog.isError || overrides.isError)
    return <ErrorState message="Failed to load permissions" onRetry={() => { catalog.refetch(); overrides.refetch(); }} />;

  const groups = catalog.data ?? {};
  const dirty = !loaded || (overrides.data !== undefined && (granted.size !== overrides.data.granted.length || denied.size !== overrides.data.denied.length));

  const toggle = (perm: string, type: 'grant' | 'deny') => {
    const [setA, setB] = type === 'grant' ? [setGranted, setDenied] : [setDenied, setGranted];
    setA((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
    setB((prev) => {
      const next = new Set(prev);
      next.delete(perm);
      return next;
    });
  };

  const handleSave = async () => {
    await save.mutateAsync({
      id: tenantId,
      userId,
      input: { granted: Array.from(granted), denied: Array.from(denied) },
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sa-border overflow-hidden">
        {Object.keys(groups).sort().map((modKey, idx) => (
          <div key={modKey} className={idx > 0 ? 'border-t border-sa-border' : ''}>
            <p className="px-3 py-2 bg-sa-card-solid text-xs font-semibold text-sa-text-secondary uppercase tracking-wider capitalize">
              {modKey.replace(/-/g, ' ')}
            </p>
            <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {groups[modKey].map((perm) => (
                <div key={perm} className="flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-sa-chart-bg">
                  <span className="text-xs font-mono text-sa-text-secondary">{perm}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggle(perm, 'grant')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                        granted.has(perm)
                          ? 'border-green-500/50 bg-green-500/10 text-green-500'
                          : 'border-sa-border text-sa-text-muted hover:border-green-500/40',
                      )}
                    >
                      Grant
                    </button>
                    <button
                      onClick={() => toggle(perm, 'deny')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                        denied.has(perm)
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : 'border-sa-border text-sa-text-muted hover:border-red-500/40',
                      )}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {save.isError && <p className="text-xs text-red-400">Failed to save permissions.</p>}
      <div className="flex justify-end">
        <Button disabled={!dirty || save.isPending} onClick={handleSave} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {save.isPending ? 'Saving…' : 'Save Overrides'}
        </Button>
      </div>
    </div>
  );
}

function UserModuleAccessEditor({ tenantId, userId }: { tenantId: string; userId: string }) {
  const catalog = useModuleCatalog();
  const overrides = useUserModules(tenantId, userId);
  const save = useSetUserModules();
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [denied, setDenied] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (overrides.data && !loaded) {
      setAllowed(new Set(overrides.data.allowed));
      setDenied(new Set(overrides.data.denied));
      setLoaded(true);
    }
  }, [overrides.data, loaded]);

  if (catalog.isLoading || overrides.isLoading) return <LoadingState label="Loading modules…" />;
  if (catalog.isError || overrides.isError)
    return <ErrorState message="Failed to load modules" onRetry={() => { catalog.refetch(); overrides.refetch(); }} />;

  const entries = catalog.data ?? [];
  const dirty = !loaded || (overrides.data !== undefined && (allowed.size !== overrides.data.allowed.length || denied.size !== overrides.data.denied.length));

  const toggle = (moduleKey: string, type: 'allow' | 'deny') => {
    const [setA, setB] = type === 'allow' ? [setAllowed, setDenied] : [setDenied, setAllowed];
    setA((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
    setB((prev) => {
      const next = new Set(prev);
      next.delete(moduleKey);
      return next;
    });
  };

  const handleSave = async () => {
    await save.mutateAsync({
      id: tenantId,
      userId,
      input: { allowed: Array.from(allowed), denied: Array.from(denied) },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-sa-text-dim">
        Deny overrides the organization module state (module hidden everywhere). Allow re-enables a module even if it is
        disabled for the organization.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map((module) => (
          <div key={module.key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-sa-border">
            <div>
              <p className="text-sm font-medium text-sa-text capitalize">{module.label}</p>
              <p className="text-xs text-sa-text-muted capitalize">{module.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(module.key, 'allow')}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                  allowed.has(module.key)
                    ? 'border-green-500/50 bg-green-500/10 text-green-500'
                    : 'border-sa-border text-sa-text-muted hover:border-green-500/40',
                )}
              >
                Allow
              </button>
              <button
                onClick={() => toggle(module.key, 'deny')}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                  denied.has(module.key)
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-sa-border text-sa-text-muted hover:border-red-500/40',
                )}
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
      {save.isError && <p className="text-xs text-red-400">Failed to save module access.</p>}
      <div className="flex justify-end">
        <Button disabled={!dirty || save.isPending} onClick={handleSave} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {save.isPending ? 'Saving…' : 'Save Module Access'}
        </Button>
      </div>
    </div>
  );
}

function ModulesTab({
  tenantId,
  modules,
  onUpdate,
  saving,
}: {
  tenantId: string;
  modules: Record<string, boolean>;
  onUpdate: {
    mutateAsync: (args: { id: string; modules: Record<string, boolean> }) => Promise<unknown>;
    isPending: boolean;
  };
  saving: boolean;
}) {
  const catalog = useModuleCatalog();
  const [localModules, setLocalModules] = useState<Record<string, boolean>>(modules);

  const handleToggle = (moduleKey: string, enabled: boolean) => {
    setLocalModules((prev) => ({ ...prev, [moduleKey]: enabled }));
  };

  const handleSave = async () => {
    await onUpdate.mutateAsync({ id: tenantId, modules: { ...localModules } });
  };

  if (catalog.isLoading) return <LoadingState label="Loading modules…" />;
  if (catalog.isError) return <ErrorState message="Failed to load module catalog" onRetry={catalog.refetch} />;

  const entries = catalog.data ?? [];
  if (entries.length === 0) {
    return <p className="text-sm text-sa-text-muted py-8 text-center">No modules available</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((module) => {
          const enabled = localModules[module.key] ?? false;
          return (
            <div
              key={module.key}
              className="p-4 rounded-lg border transition-all cursor-pointer relative"
              style={{ borderColor: enabled ? 'rgba(34, 197, 94, 0.3)' : 'var(--sa-border)', backgroundColor: enabled ? 'rgba(34, 197, 94, 0.05)' : 'var(--sa-input)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize text-sa-text">{module.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleToggle(module.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sa-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sa-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sa-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sa-accent"></div>
                </label>
              </div>
              <p className="text-xs text-sa-text-muted capitalize">{module.category}</p>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-4 border-t border-sa-border">
        <Button disabled={saving} onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Module Changes'}
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-sa-text-muted">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-sm text-sa-text-secondary text-right">{value}</span>
    </div>
  );
}
