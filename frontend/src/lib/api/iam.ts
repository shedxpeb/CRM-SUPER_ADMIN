import { api, buildQueryString } from '../api';
import type { Paginated, Permission, PlatformUser, Role } from '../types';

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  roleId?: string;
  status?: string;
}): Promise<Paginated<PlatformUser>> {
  const res = await api.get<PlatformUser[]>(`/users${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function getUser(id: string): Promise<PlatformUser> {
  const res = await api.get<PlatformUser>(`/users/${id}`);
  return res.data;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  roleIds?: string[];
  department?: string;
  designation?: string;
}): Promise<PlatformUser> {
  const res = await api.post<PlatformUser>('/users', input);
  return res.data;
}

export async function updateUser(
  id: string,
  input: {
    email?: string;
    name?: string;
    department?: string;
    designation?: string;
    isActive?: boolean;
    roleIds?: string[];
    version?: number;
  },
): Promise<PlatformUser> {
  const res = await api.patch<PlatformUser>(`/users/${id}`, input);
  return res.data;
}

export async function suspendUser(id: string, reason?: string): Promise<{ success: boolean; message: string; user: PlatformUser }> {
  const res = await api.post<{ success: boolean; message: string; user: PlatformUser }>(`/users/${id}/suspend`, reason ? { reason } : {});
  return res.data;
}

export async function unsuspendUser(id: string): Promise<{ success: boolean; message: string; user: PlatformUser }> {
  const res = await api.post<{ success: boolean; message: string; user: PlatformUser }>(`/users/${id}/unsuspend`);
  return res.data;
}

export async function restoreUser(id: string): Promise<PlatformUser> {
  const res = await api.post<PlatformUser>(`/users/${id}/restore`);
  return res.data;
}

export async function forceLogoutUser(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/users/${id}/force-logout`);
  return res.data;
}

export async function unlockUser(id: string): Promise<{ success: boolean; message: string; user: PlatformUser }> {
  const res = await api.post<{ success: boolean; message: string; user: PlatformUser }>(`/users/${id}/unlock`);
  return res.data;
}

export async function resetPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { newPassword });
  return res.data;
}

export async function getUserSessions(id: string): Promise<{ items: import('../types').PlatformSession[] }> {
  const res = await api.get<{ items: import('../types').PlatformSession[] }>(`/users/${id}/sessions`);
  return res.data;
}

// ── Roles & Permissions ──────────────────────────────────────────────────────

export async function getRoles(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<Paginated<Role>> {
  const res = await api.get<Role[]>(`/roles${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}

export async function getRole(id: string): Promise<Role> {
  const res = await api.get<Role>(`/roles/${id}`);
  return res.data;
}

export async function createRole(input: {
  name: string;
  description?: string;
  permissionKeys?: string[];
}): Promise<Role> {
  const res = await api.post<Role>('/roles', input);
  return res.data;
}

export async function updateRole(
  id: string,
  input: {
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionKeys?: string[];
    version?: number;
  },
): Promise<Role> {
  const res = await api.patch<Role>(`/roles/${id}`, input);
  return res.data;
}

export async function assignRolePermissions(id: string, permissionKeys: string[]): Promise<Role> {
  const res = await api.post<Role>(`/roles/${id}/permissions`, { permissionKeys });
  return res.data;
}

export async function getRoleUsers(id: string): Promise<{ items: PlatformUser[] }> {
  const res = await api.get<{ items: PlatformUser[] }>(`/roles/${id}/users`);
  return res.data;
}

export async function getPermissions(params?: {
  page?: number;
  pageSize?: number;
  module?: string;
  category?: string;
}): Promise<Paginated<Permission>> {
  const res = await api.get<Permission[]>(`/permissions${buildQueryString(params)}`);
  return { data: res.data, meta: res.meta! };
}
