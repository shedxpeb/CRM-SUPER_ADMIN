import { api, buildQueryString } from '../api';
import type { Paginated, Tenant, TenantActivityEntry } from '../types';

export interface TenantListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  sort?: string;
}

export async function getTenants(params?: TenantListParams): Promise<Paginated<Tenant>> {
  const res = await api.get<Tenant[]>(`/tenants${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function getTenant(id: string): Promise<Tenant> {
  const res = await api.get<Tenant>(`/tenants/${id}`);
  return res.data;
}

export async function createTenant(input: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  domain?: string;
  status?: string;
  maxUsers?: number;
  maxStorageGB?: number;
  notes?: string;
}): Promise<Tenant> {
  const res = await api.post<Tenant>('/tenants', input);
  return res.data;
}

export async function updateTenant(
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    domain?: string;
    status?: string;
    maxUsers?: number;
    maxStorageGB?: number;
    notes?: string;
    version?: number;
  },
): Promise<Tenant> {
  const res = await api.patch<Tenant>(`/tenants/${id}`, input);
  return res.data;
}

export async function suspendTenant(id: string, reason?: string): Promise<{ success: boolean; message: string; tenant: Tenant }> {
  const res = await api.post<{ success: boolean; message: string; tenant: Tenant }>(`/tenants/${id}/suspend`, reason ? { reason } : {});
  return res.data;
}

export async function unsuspendTenant(id: string): Promise<{ success: boolean; message: string; tenant: Tenant }> {
  const res = await api.post<{ success: boolean; message: string; tenant: Tenant }>(`/tenants/${id}/unsuspend`);
  return res.data;
}

export async function restoreTenant(id: string): Promise<Tenant> {
  const res = await api.post<Tenant>(`/tenants/${id}/restore`);
  return res.data;
}

export async function impersonateTenant(id: string, reason?: string) {
  const res = await api.post<{
    grantId: string;
    token: string;
    expiresIn: string;
    startedAt: string;
    tenant: { id: string; name: string; slug: string; status: string };
  }>(`/tenants/${id}/impersonate`, reason ? { reason } : {});
  return res.data;
}

export async function getTenantUsers(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<Paginated<import('../types').TenantUser>> {
  const res = await api.get<import('../types').TenantUser[]>(
    `/tenants/${id}/users${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getTenantActivity(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<Paginated<TenantActivityEntry>> {
  const res = await api.get<TenantActivityEntry[]>(
    `/tenants/${id}/activity${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getTenantImpersonations(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<Paginated<import('../types').ImpersonationLog>> {
  const res = await api.get<import('../types').ImpersonationLog[]>(
    `/tenants/${id}/impersonations${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getImpersonations(
  params?: { page?: number; pageSize?: number; active?: string },
): Promise<Paginated<import('../types').ImpersonationLog>> {
  const res = await api.get<import('../types').ImpersonationLog[]>(
    `/impersonation${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getActiveImpersonation() {
  const res = await api.get<{ active: boolean } & Partial<import('../types').ImpersonationLog>>(
    '/impersonation/active',
  );
  return res.data;
}

export async function exitImpersonation(reason?: string) {
  const res = await api.post<{ success: boolean; ended: number }>(
    '/impersonation/exit',
    reason ? { reason } : {},
  );
  return res.data;
}

export async function getTenantRoles(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<Paginated<import('../types').TenantRole>> {
  const res = await api.get<import('../types').TenantRole[]>(
    `/tenants/${id}/roles${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getTenantLoginHistory(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<Paginated<import('../types').LoginAttempt>> {
  const res = await api.get<import('../types').LoginAttempt[]>(
    `/tenants/${id}/login-history${buildQueryString(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function getTenantModules(id: string): Promise<Record<string, boolean>> {
  const res = await api.get<Record<string, boolean>>(`/tenants/${id}/modules`);
  return res.data;
}

export async function updateTenantModules(
  id: string,
  modules: Record<string, boolean>,
): Promise<Record<string, boolean>> {
  const res = await api.put<Record<string, boolean>>(`/tenants/${id}/modules`, modules);
  return res.data;
}

export async function getTenantPermissions(tenantId: string): Promise<Record<string, Record<string, boolean>>> {
  const res = await api.get<Record<string, Record<string, boolean>>>(`/tenants/${tenantId}/permissions`);
  return res.data;
}

export async function createTenantUser(
  id: string,
  input: {
    email: string;
    name?: string;
    mobile?: string;
    department?: string;
    designation?: string;
    role?: string;
    isActive?: boolean;
  },
): Promise<{ id: string; email: string; name: string | null; role: string; isActive: boolean; createdAt: string }> {
  const res = await api.post<{ id: string; email: string; name: string | null; role: string; isActive: boolean; createdAt: string }>(
    `/tenants/${id}/users`,
    input,
  );
  return res.data;
}

export async function createTenantRole(
  id: string,
  input: { name: string; code?: string; description?: string; permissions?: string[] },
): Promise<import('../types').TenantRole> {
  const res = await api.post<import('../types').TenantRole>(`/tenants/${id}/roles`, input);
  return res.data;
}

export async function getTenantAssignableRoles(id: string): Promise<{ id: string; name: string; code: string }[]> {
  const res = await api.get<{ id: string; name: string; code: string }[]>(`/tenants/${id}/roles/assignable`);
  return res.data;
}
