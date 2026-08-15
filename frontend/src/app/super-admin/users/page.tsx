'use client';

import { useMemo, useState } from 'react';
import { Building2, Users as UsersIcon, Shield } from 'lucide-react';
import { PageHeader, ErrorState } from '@/components/sa/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/sa/DataTable';
import { BooleanBadge } from '@/components/sa/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useOrganizedUsers } from '@/lib/queries';
import { RouteGuard } from '@/features/auth/RouteGuard';
import { timeAgo } from '@/lib/format';
import type { OrganizedUser } from '@/lib/api/iam';

const ROLE_OPTIONS = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useOrganizedUsers({
    page,
    pageSize: 50,
    q: search || undefined,
    organizationId: organizationId || undefined,
    role: role || undefined,
    status: (status as 'active' | 'inactive' | undefined) || undefined,
  });

  const organizations = data?.meta?.organizations ?? [];
  const total = data?.meta?.total ?? 0;

  // Group users by organization (organization-centric view)
  const grouped = useMemo(() => {
    const map = new Map<string, { orgName: string; users: OrganizedUser[] }>();
    for (const u of data?.items ?? []) {
      const key = u.organizationId ?? 'unassigned';
      const entry = map.get(key) ?? { orgName: u.organizationName || 'Unassigned', users: [] };
      entry.users.push(u);
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => a[1].orgName.localeCompare(b[1].orgName));
  }, [data?.items]);

  if (isError) return <ErrorState message="Failed to load users" onRetry={refetch} />;

  return (
    <RouteGuard requiredPermission="users:read">
      <div>
        <PageHeader
          title="Users"
          subtitle="All CRM users grouped by organization — real database records only"
          actions={
            <Badge variant="secondary" className="gap-1.5">
              <UsersIcon className="h-3.5 w-3.5" />
              {total} users · {organizations.length} organizations
            </Badge>
          }
        />

        {/* Filters: Organization, Role, Status + search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim mb-1">Organization</label>
            <select
              value={organizationId}
              onChange={(e) => { setPage(1); setOrganizationId(e.target.value); }}
              className="w-full bg-sa-input border-sa-border text-sa-text h-9 text-sm rounded-lg px-3"
            >
              <option value="">All organizations</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => { setPage(1); setRole(e.target.value); }}
              className="w-full bg-sa-input border-sa-border text-sa-text h-9 text-sm rounded-lg px-3"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="w-full bg-sa-input border-sa-border text-sa-text h-9 text-sm rounded-lg px-3"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim mb-1">Search</label>
            <Input
              placeholder="Name or email…"
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
        </div>

        {grouped.length === 0 ? (
          <Card className="bg-sa-card border-sa-border">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-sa-text-muted">No users match the current filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map(([orgKey, group]) => (
              <Card key={orgKey} className="bg-sa-card border-sa-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-sa-border bg-sa-chart-bg">
                    <Building2 className="h-3.5 w-3.5 text-sa-accent" />
                    <span className="text-xs font-semibold text-sa-text">{group.orgName}</span>
                    <span className="text-[10px] text-sa-text-dim">({group.users.length} user{group.users.length === 1 ? '' : 's'})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sa-border">
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Name</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Email</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Tenant</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Role</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Status</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Last Login</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-sa-text-dim">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.users.map((u) => (
                          <tr key={u.id} className="border-b border-sa-border last:border-0 hover:bg-sa-row-hover">
                            <td className="px-4 py-2.5">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-sa-text">{u.name ?? u.email}</p>
                                <p className="text-xs text-sa-text-dim">{u.designation ?? u.department ?? ''}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-sa-text-muted">{u.email}</td>
                            <td className="px-4 py-2.5 text-xs text-sa-text-muted">{u.tenantId ? group.orgName : '—'}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Shield className="h-2.5 w-2.5" />
                                {u.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              {u.isLocked ? (
                                <Badge variant="destructive" className="text-[10px]">Locked</Badge>
                              ) : (
                                <BooleanBadge value={u.isActive} trueLabel="Active" falseLabel="Inactive" />
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-sa-text-muted">{u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}</td>
                            <td className="px-4 py-2.5 text-xs text-sa-text-muted">{timeAgo(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Pagination page={page} pageSize={50} total={total} onPageChange={setPage} />

        {isLoading && <p className="text-sm text-sa-text-muted py-4 text-center">Loading users…</p>}
      </div>
    </RouteGuard>
  );
}
