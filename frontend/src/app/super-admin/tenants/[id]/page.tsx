'use client';

import { useState } from 'react';
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
  UserCog,
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
  useTenantImpersonations,
  useSuspendTenant,
  useUnsuspendTenant,
  useUpdateTenant,
  useAuditLogs,
  useImpersonateTenant,
  useTenantModules,
  useTenantLoginHistory,
  useUpdateTenantModules,
  useTenantPermissions,
  useTenantAssignableRoles,
  useCreateTenantUser,
  useCreateTenantRole,
} from '@/lib/queries';
import { Can } from '@/features/auth/rbac';
import { RouteGuard } from '@/features/auth/RouteGuard';
import { formatDate, formatNumber, formatBytes, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/sa/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { CRM_MODULES } from '@/lib/types';
import type { TenantActivityEntry, ImpersonationLog, AuditLogEntry, TenantUser, TenantRole } from '@/lib/types';
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
  { key: 'permissions', label: 'Permissions', icon: Key },
  { key: 'modules', label: 'Modules', icon: Puzzle },
  { key: 'activity', label: 'Activity', icon: History },
  { key: 'login-history', label: 'Login History', icon: LogIn },
  { key: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { key: 'impersonations', label: 'Impersonation Logs', icon: UserCog },
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

  const [tab, setTab] = useState<string>(searchParams.get('tab') ?? 'overview');
  const [activityPage, setActivityPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [rolesPage, setRolesPage] = useState(1);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [impPage, setImpPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  const tenant = useTenant(id);
  const activity = useTenantActivity(id, { page: activityPage, pageSize: 15 });
  const users = useTenantUsers(id, { page: usersPage, pageSize: 15 });
  const roles = useTenantRoles(id, { page: rolesPage, pageSize: 15 });
  const loginHistory = useTenantLoginHistory(id, { page: loginHistoryPage, pageSize: 15 });
  const impersonations = useTenantImpersonations(id, { page: impPage, pageSize: 15 });
  const auditLogs = useAuditLogs({ page: auditPage, pageSize: 15, tenantId: id });
  const tenantModules = useTenantModules(id);
  const suspend = useSuspendTenant();
  const unsuspend = useUnsuspendTenant();
  const updateTenant = useUpdateTenant();
  const impersonate = useImpersonateTenant();
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

  const handleImpersonate = async () => {
    const res = await impersonate.mutateAsync({
      id,
      reason: impersonateReason || 'Console impersonation',
    });
    if (res?.token) {
      localStorage.setItem('sa_impersonation_grant', res.token);
    }
    setImpersonateOpen(false);
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
            <Can required="organization:impersonate">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setImpersonateOpen(true)}>
                <UserCog className="h-3.5 w-3.5" />
                Login As Tenant
              </Button>
            </Can>
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
                  columns={usersColumns}
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
                  columns={tenantRolesColumns}
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

      {tab === 'permissions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Permissions Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionsMatrix tenantId={id} modules={CRM_MODULES} />
          </CardContent>
        </Card>
      )}

      {tab === 'modules' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">CRM Modules</CardTitle>
          </CardHeader>
          <CardContent>
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
      {tab === 'impersonations' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sa-text">Impersonation Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {impersonations.isLoading ? (
              <LoadingState label="Loading impersonation logs…" />
            ) : impersonations.isError ? (
              <ErrorState message="Failed to load impersonation logs" onRetry={impersonations.refetch} />
            ) : (
              <>
                <DataTable
                  columns={impersonationColumns}
                  data={impersonations.data?.data ?? []}
                  isLoading={impersonations.isLoading}
                  isError={impersonations.isError}
                  onRetry={impersonations.refetch}
                  emptyMessage="No impersonation sessions recorded"
                />
                <Pagination page={impPage} pageSize={15} total={impersonations.data?.meta?.total ?? 0} onPageChange={setImpPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}
      {impersonateOpen && (
        <Dialog open onOpenChange={() => setImpersonateOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonate {t.name}</DialogTitle>
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
                <Button variant="ghost" onClick={() => setImpersonateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={impersonate.isPending}
                  onClick={handleImpersonate}
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
      {createUserOpen && <AddTenantUserDialog tenantId={id} roles={assignableRoles.data ?? []} onClose={() => setCreateUserOpen(false)} onError={(e) => console.error(e)} />}
      {createRoleOpen && <AddTenantRoleDialog tenantId={id} onClose={() => setCreateRoleOpen(false)} onError={(e) => console.error(e)} />}
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
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCreate = async () => {
    setSubmitted(true);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    try {
      await createUser.mutateAsync({ id: tenantId, input: { email: email.trim(), name: name.trim() || undefined, role: role || undefined } });
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
          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1.5 text-sa-text-muted">Role</label>
              <select
                className="w-full rounded-md border border-sa-border bg-sa-input px-3 py-2 text-sm text-sa-text outline-none focus:ring-2 ring-sa-accent/50"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Default</option>
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

const usersColumns: ColumnDef<TenantUser, unknown>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.name ?? row.original.email}</span> },
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.email}</span> },
  { accessorKey: 'role', header: 'Role', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.role ?? '—'}</span> },
  { accessorKey: 'lastLogin', header: 'Last Login', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.lastLogin ? timeAgo(row.original.lastLogin) : '—'}</span> },
  { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
];

const auditColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  { accessorKey: 'action', header: 'Action', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.action}</span> },
  { accessorKey: 'actorEmail', header: 'Actor', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.actorEmail ?? 'system'}</span> },
  { accessorKey: 'targetName', header: 'Target', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.targetName ?? row.original.targetId ?? '—'}</span> },
  { accessorKey: 'severity', header: 'Severity', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.severity}</span> },
  { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.createdAt)}</span> },
];

const impersonationColumns: ColumnDef<ImpersonationLog, unknown>[] = [
  { accessorKey: 'superAdminEmail', header: 'Super Admin', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.superAdminEmail}</span> },
  { accessorKey: 'targetUserEmail', header: 'As User', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.targetUserEmail ?? '—'}</span> },
  { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.reason ?? '—'}</span> },
  { accessorKey: 'startedAt', header: 'Started', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.startedAt)}</span> },
  {
    accessorKey: 'durationSeconds',
    header: 'Duration',
    cell: ({ row }) => (
      <span className="text-xs text-sa-text-secondary">
        {row.original.durationSeconds != null ? `${Math.round(row.original.durationSeconds / 60)}m` : 'active'}
      </span>
    ),
  },
];
const tenantRolesColumns: ColumnDef<TenantRole, unknown>[] = [
  { accessorKey: 'name', header: 'Role', cell: ({ row }) => <span className="text-sm text-sa-text-secondary">{row.original.name}</span> },
  { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="text-xs font-mono text-sa-text-dim">{row.original.code}</span> },
  { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{row.original.description ?? '—'}</span> },
  { accessorKey: 'isSystem', header: 'System', cell: ({ row }) => <Badge variant={row.original.isSystem ? 'secondary' : 'outline'} className="text-[10px]">{row.original.isSystem ? 'Yes' : 'No'}</Badge> },
];

const loginHistoryColumns: ColumnDef<any, unknown>[] = [
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-xs text-sa-text-secondary">{row.original.email}</span> },
  { accessorKey: 'success', header: 'Status', cell: ({ row }) => <Badge variant={row.original.success ? 'success' : 'destructive'} className="text-[10px]">{row.original.success ? 'Success' : 'Failed'}</Badge> },
  { accessorKey: 'ipAddress', header: 'IP Address', cell: ({ row }) => <span className="text-xs font-mono text-sa-text-dim">{row.original.ipAddress ?? '—'}</span> },
  { accessorKey: 'userAgent', header: 'Device', cell: ({ row }) => <span className="text-xs text-sa-text-muted truncate max-w-[200px]">{row.original.userAgent ?? '—'}</span> },
  { accessorKey: 'failureReason', header: 'Failure Reason', cell: ({ row }) => <span className="text-xs text-red-400">{row.original.failureReason ?? '—'}</span> },
  { accessorKey: 'createdAt', header: 'Time', cell: ({ row }) => <span className="text-xs text-sa-text-muted">{timeAgo(row.original.createdAt)}</span> },
];

// Permissions Matrix Component
function PermissionsMatrix({ tenantId, modules }: { tenantId: string; modules: typeof CRM_MODULES }) {
  const permissions = useTenantPermissions(tenantId);

  if (permissions.isLoading) return <LoadingState label="Loading permissions…" />;
  if (permissions.isError) return <ErrorState message="Failed to load permissions" onRetry={permissions.refetch} />;

  const perms = permissions.data ?? {};
  const ACTIONS = ['read', 'create', 'update', 'delete', 'export', 'approve'] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-sa-border">
            <th className="py-3 px-4 font-medium text-sa-text-muted sticky left-0 bg-sa-card">Module</th>
            {ACTIONS.map((a) => (
              <th key={a} className="py-3 px-3 font-medium text-sa-text-muted text-center capitalize">{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.key} className="border-b border-sa-border last:border-0 hover:bg-sa-row-hover">
              <td className="py-3 px-4 text-sa-text-secondary font-medium whitespace-nowrap sticky left-0 bg-sa-card">
                <div className="flex items-center gap-2">
                  <span className="text-sa-text-muted">{module.icon}</span>
                  {module.label}
                </div>
              </td>
              {ACTIONS.map((action) => {
                const granted = perms[module.key]?.[`${module.key}:${action}`] ?? false;
                return (
                  <td key={action} className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={granted}
                      disabled
                      className="h-4 w-4 accent-sa-accent"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
  const [localModules, setLocalModules] = useState<Record<string, boolean>>(modules);

  const handleToggle = (moduleKey: string, enabled: boolean) => {
    setLocalModules((prev) => ({ ...prev, [moduleKey]: enabled }));
  };

  const handleSave = async () => {
    await onUpdate.mutateAsync({ id: tenantId, modules: { ...localModules } });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CRM_MODULES.map((module) => {
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
              <p className="text-xs text-sa-text-muted">{module.category}</p>
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
