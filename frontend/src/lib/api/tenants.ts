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
  initialPassword?: string;
  phone?: string;
  domain?: string;
  status?: string;
  maxUsers?: number;
  maxStorageGB?: number;
  notes?: string;
}): Promise<Tenant & { adminUser?: { email: string; role: string; passwordSet: boolean } | null }> {
  const res = await api.post<Tenant & { adminUser?: { email: string; role: string; passwordSet: boolean } | null }>('/tenants', input);
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

export async function retryTenantProvisioning(id: string): Promise<Tenant> {
  const res = await api.post<Tenant>(`/tenants/${id}/retry-provisioning`);
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
    password?: string;
    isActive?: boolean;
  },
): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}> {
  const res = await api.post<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>(`/tenants/${id}/users`, input);
  return res.data;
}

export async function deleteTenantUser(
  id: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/tenants/${id}/users/${userId}`);
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

export async function getTenantUserRoles(id: string, userId: string): Promise<{ id: string; name: string; code: string }[]> {
  const res = await api.get<{ id: string; name: string; code: string }[]>(`/tenants/${id}/users/${userId}/roles`);
  return res.data;
}

export async function assignTenantUserRole(
  id: string,
  userId: string,
  input: { roleId: string },
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/tenants/${id}/users/${userId}/roles`, input);
  return res.data;
}

export async function removeTenantUserRoles(
  id: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/tenants/${id}/users/${userId}/roles`);
  return res.data;
}

export async function getTenantRole(id: string, roleId: string): Promise<import('../types').TenantRole> {
  const res = await api.get<import('../types').TenantRole>(`/tenants/${id}/roles/${roleId}`);
  return res.data;
}

export async function setTenantRolePermissions(
  id: string,
  roleId: string,
  permissions: string[],
): Promise<import('../types').TenantRole> {
  const res = await api.put<import('../types').TenantRole>(`/tenants/${id}/roles/${roleId}/permissions`, {
    permissions,
  });
  return res.data;
}

export async function getPermissionCatalog(id: string): Promise<Record<string, string[]>> {
  const res = await api.get<Record<string, string[]>>(`/tenants/${id}/permissions/catalog`);
  return res.data;
}

export interface EffectivePermissions {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  assignedRole: { id: string; name: string; code: string } | null;
  rolePermissions: string[];
  userOverrides: { key: string; type: 'granted' | 'denied' }[];
  moduleOverrides: { allowed: string[]; denied: string[] };
  effectivePermissions: string[];
}

export async function getEffectivePermissions(id: string, userId: string): Promise<EffectivePermissions> {
  const res = await api.get<EffectivePermissions>(`/tenants/${id}/users/${userId}/effective-permissions`);
  return res.data;
}

export interface UserPermissionOverrides {
  userId: string;
  email: string;
  granted: string[];
  denied: string[];
}

export async function getUserPermissions(id: string, userId: string): Promise<UserPermissionOverrides> {
  const res = await api.get<UserPermissionOverrides>(`/tenants/${id}/users/${userId}/permissions`);
  return res.data;
}

export async function setUserPermissions(
  id: string,
  userId: string,
  input: { granted: string[]; denied: string[] },
): Promise<UserPermissionOverrides> {
  const res = await api.put<UserPermissionOverrides>(`/tenants/${id}/users/${userId}/permissions`, input);
  return res.data;
}

export interface UserModuleOverrides {
  userId: string;
  email: string;
  allowed: string[];
  denied: string[];
}

export async function getUserModules(id: string, userId: string): Promise<UserModuleOverrides> {
  const res = await api.get<UserModuleOverrides>(`/tenants/${id}/users/${userId}/modules`);
  return res.data;
}

export async function setUserModules(
  id: string,
  userId: string,
  input: { allowed: string[]; denied: string[] },
): Promise<UserModuleOverrides> {
  const res = await api.put<UserModuleOverrides>(`/tenants/${id}/users/${userId}/modules`, input);
  return res.data;
}
