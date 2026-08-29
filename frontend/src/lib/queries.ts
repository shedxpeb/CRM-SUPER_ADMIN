'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tenantsApi from './api/tenants';
import * as iamApi from './api/iam';
import * as monitoringApi from './api/monitoring';
import * as platformApi from './api/platform';

export const qk = {
  tenants: (params?: unknown) => ['tenants', params] as const,
  tenant: (id: string) => ['tenants', id] as const,
  tenantActivity: (id: string, params?: unknown) => ['tenants', id, 'activity', params] as const,
  tenantUsers: (id: string, params?: unknown) => ['tenants', id, 'users', params] as const,
  tenantRoles: (id: string, params?: unknown) => ['tenants', id, 'roles', params] as const,
  tenantLoginHistory: (id: string, params?: unknown) => ['tenants', id, 'login-history', params] as const,
  tenantModules: (id: string) => ['tenants', id, 'modules'] as const,
  tenantPermissions: (id: string) => ['tenants', id, 'permissions'] as const,
  users: (params?: unknown) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  userSessions: (id: string) => ['users', id, 'sessions'] as const,
  roles: (params?: unknown) => ['roles', params] as const,
  role: (id: string) => ['roles', id] as const,
  roleUsers: (id: string) => ['roles', id, 'users'] as const,
  permissions: (params?: unknown) => ['permissions', params] as const,

  auditLogs: (params?: unknown) => ['audit-logs', params] as const,
  systemLogs: (params?: unknown) => ['monitoring', 'system-logs', params] as const,

  settings: (params?: unknown) => ['platform', 'settings', params] as const,
  moduleCatalog: () => ['platform', 'modules'] as const,
};

// ── Tenants ──────────────────────────────────────────────────────────────────

export function useTenants(params?: tenantsApi.TenantListParams) {
  return useQuery({
    queryKey: qk.tenants(params),
    queryFn: () => tenantsApi.getTenants(params),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: qk.tenant(id),
    queryFn: () => tenantsApi.getTenant(id),
    enabled: !!id,
  });
}

export function useTenantActivity(id: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.tenantActivity(id, params),
    queryFn: () => tenantsApi.getTenantActivity(id, params),
    enabled: !!id,
  });
}

export function useTenantUsers(id: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.tenantUsers(id, params),
    queryFn: () => tenantsApi.getTenantUsers(id, params),
    enabled: !!id,
  });
}

export function useTenantLoginHistory(id: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.tenantLoginHistory(id, params),
    queryFn: () => tenantsApi.getTenantLoginHistory(id, params),
    enabled: !!id,
  });
}

export function useTenantRoles(id: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.tenantRoles(id, params),
    queryFn: () => tenantsApi.getTenantRoles(id, params),
    enabled: !!id,
  });
}

export function useTenantModules(id: string) {
  return useQuery({
    queryKey: qk.tenantModules(id),
    queryFn: () => tenantsApi.getTenantModules(id),
    enabled: !!id,
  });
}

export function useRetryTenantProvisioning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.retryTenantProvisioning(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['tenants', id] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenantModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      modules,
    }: {
      id: string;
      modules: Record<string, boolean>;
    }) => tenantsApi.updateTenantModules(id, modules),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: ['tenants', id, 'modules'] }),
  });
}

export function useTenantPermissions(tenantId: string) {
  return useQuery({
    queryKey: qk.tenantPermissions(tenantId),
    queryFn: () => tenantsApi.getTenantPermissions(tenantId),
    enabled: !!tenantId,
  });
}

export function usePermissionCatalog(tenantId: string) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'permissions', 'catalog'] as const,
    queryFn: () => tenantsApi.getPermissionCatalog(tenantId),
    enabled: !!tenantId,
  });
}

export function useUserRoles(tenantId: string, userId: string | null) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users', userId, 'roles'] as const,
    queryFn: () => tenantsApi.getTenantUserRoles(tenantId, userId!),
    enabled: !!tenantId && !!userId,
  });
}

export function useAssignTenantUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, roleId }: { id: string; userId: string; roleId: string }) =>
      tenantsApi.assignTenantUserRole(id, userId, { roleId }),
    onSuccess: (_data, { id, userId }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users', userId, 'roles'] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useRemoveTenantUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      tenantsApi.removeTenantUserRoles(id, userId),
    onSuccess: (_data, { id, userId }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users', userId, 'roles'] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useEffectivePermissions(tenantId: string, userId: string | null) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users', userId, 'effective-permissions'] as const,
    queryFn: () => tenantsApi.getEffectivePermissions(tenantId, userId!),
    enabled: !!tenantId && !!userId,
  });
}

export function useUserPermissions(tenantId: string, userId: string | null) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users', userId, 'permissions'] as const,
    queryFn: () => tenantsApi.getUserPermissions(tenantId, userId!),
    enabled: !!tenantId && !!userId,
  });
}

export function useSetUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
      input,
    }: {
      id: string;
      userId: string;
      input: { granted: string[]; denied: string[] };
    }) => tenantsApi.setUserPermissions(id, userId, input),
    onSuccess: (_data, { id, userId }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users', userId, 'permissions'] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useUserModules(tenantId: string, userId: string | null) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users', userId, 'modules'] as const,
    queryFn: () => tenantsApi.getUserModules(tenantId, userId!),
    enabled: !!tenantId && !!userId,
  });
}

export function useSetUserModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
      input,
    }: {
      id: string;
      userId: string;
      input: { allowed: string[]; denied: string[] };
    }) => tenantsApi.setUserModules(id, userId, input),
    onSuccess: (_data, { id, userId }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users', userId, 'modules'] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useTenantAssignableRoles(id: string) {
  return useQuery({
    queryKey: ['tenants', id, 'roles', 'assignable'] as const,
    queryFn: () => tenantsApi.getTenantAssignableRoles(id),
    enabled: !!id,
  });
}

export function useTenantRole(id: string, roleId: string | null) {
  return useQuery({
    queryKey: ['tenants', id, 'roles', roleId] as const,
    queryFn: () => tenantsApi.getTenantRole(id, roleId!),
    enabled: !!id && !!roleId,
  });
}

export function useSetTenantRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      roleId,
      permissions,
    }: {
      id: string;
      roleId: string;
      permissions: string[];
    }) => tenantsApi.setTenantRolePermissions(id, roleId, permissions),
    onSuccess: (_data, { id, roleId }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'roles'] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'roles', roleId] });
      qc.invalidateQueries({ queryKey: ['tenants', id, 'permissions'] });
    },
  });
}

export function useCreateTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof tenantsApi.createTenantUser>[1] }) =>
      tenantsApi.createTenantUser(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useDeleteTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      tenantsApi.deleteTenantUser(id, userId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'users'] });
    },
  });
}

export function useCreateTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; code?: string; description?: string } }) =>
      tenantsApi.createTenantRole(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants', id, 'roles'] });
    },
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.createTenant,
    // No optimistic insert: the list query key includes filters (qk.tenants(params)),
    // so a partial tenant can't be placed into the correct cache slot. Refetch on success.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof tenantsApi.updateTenant>[1] }) =>
      tenantsApi.updateTenant(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ['tenants', id] });
      const previousTenant = qc.getQueryData(['tenants', id]);
      qc.setQueryData(['tenants', id], (old: any) => ({ ...old, ...input }));
      return { previousTenant };
    },
    onError: (error, { id }, context) => {
      console.error('Failed to update tenant:', error);
      if (context?.previousTenant) {
        qc.setQueryData(['tenants', id], context.previousTenant);
      }
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants', id] });
    },
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => tenantsApi.suspendTenant(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants', id] });
    },
    onError: (error) => {
      console.error('Failed to suspend tenant:', error);
    },
  });
}

export function useUnsuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => tenantsApi.unsuspendTenant(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenants', id] });
    },
  });
}

// ── Identity & Access ────────────────────────────────────────────────────────

export function useUsers(params?: { page?: number; pageSize?: number; q?: string; roleId?: string; status?: string }) {
  return useQuery({ queryKey: qk.users(params), queryFn: () => iamApi.getUsers(params) });
}

export function useOrganizedUsers(params?: {
  page?: number;
  pageSize?: number;
  organizationId?: string;
  role?: string;
  status?: 'active' | 'inactive';
  q?: string;
}) {
  return useQuery({ queryKey: ['users', 'organized', params] as const, queryFn: () => iamApi.getOrganizedUsers(params) });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: iamApi.createUser,
    onMutate: async (newUser) => {
      await qc.cancelQueries({ queryKey: ['users'] });
      const previousUsers = qc.getQueryData(['users']);
      qc.setQueryData(['users'], (old: any) => ({
        ...old,
        items: [newUser, ...(old?.items || [])],
      }));
      return { previousUsers };
    },
    onError: (error, _, context) => {
      console.error('Failed to create user:', error);
      if (context?.previousUsers) {
        qc.setQueryData(['users'], context.previousUsers);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof iamApi.updateUser>[1] }) =>
      iamApi.updateUser(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ['users', id] });
      const previousUser = qc.getQueryData(['users', id]);
      qc.setQueryData(['users', id], (old: any) => ({ ...old, ...input }));
      return { previousUser };
    },
    onError: (error, { id }, context) => {
      console.error('Failed to update user:', error);
      if (context?.previousUser) {
        qc.setQueryData(['users', id], context.previousUser);
      }
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useForceLogoutUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iamApi.forceLogoutUser(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
      qc.invalidateQueries({ queryKey: ['users', id, 'sessions'] });
    },
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iamApi.unlockUser(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      iamApi.resetPassword(id, newPassword),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      iamApi.suspendUser(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useRoles(params?: { page?: number; pageSize?: number; q?: string }) {
  return useQuery({ queryKey: qk.roles(params), queryFn: () => iamApi.getRoles(params) });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: qk.role(id),
    queryFn: () => iamApi.getRole(id),
    enabled: !!id,
  });
}

export function usePermissions(params?: { page?: number; pageSize?: number; module?: string }) {
  return useQuery({
    queryKey: qk.permissions(params),
    queryFn: () => iamApi.getPermissions(params),
  });
}

export function useRoleUsers(id: string) {
  return useQuery({
    queryKey: qk.roleUsers(id),
    queryFn: () => iamApi.getRoleUsers(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: iamApi.createRole,
    onMutate: async (newRole) => {
      await qc.cancelQueries({ queryKey: ['roles'] });
      const previousRoles = qc.getQueryData(['roles']);
      qc.setQueryData(['roles'], (old: any) => ({
        ...old,
        items: [newRole, ...(old?.items || [])],
      }));
      return { previousRoles };
    },
    onError: (error, _, context) => {
      console.error('Failed to create role:', error);
      if (context?.previousRoles) {
        qc.setQueryData(['roles'], context.previousRoles);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useAssignRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionKeys }: { id: string; permissionKeys: string[] }) =>
      iamApi.assignRolePermissions(id, permissionKeys),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ── Monitoring ───────────────────────────────────────────────────────────────

export function useAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  action?: string;
  actorEmail?: string;
  tenantId?: string;
  severity?: string;
}) {
  return useQuery({
    queryKey: qk.auditLogs(params),
    queryFn: () => monitoringApi.getAuditLogs(params),
  });
}

export function useSystemLogs(params?: { page?: number; pageSize?: number; level?: string; component?: string }) {
  return useQuery({
    queryKey: qk.systemLogs(params),
    queryFn: () => monitoringApi.getSystemLogs(params),
  });
}

export function useErrors(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  service?: string;
}) {
  return useQuery({
    queryKey: ['monitoring', 'errors', params] as const,
    queryFn: () => monitoringApi.getErrors(params),
  });
}

// ── Platform Config ──────────────────────────────────────────────────────────

export function useModuleCatalog() {
  return useQuery({
    queryKey: qk.moduleCatalog(),
    queryFn: () => platformApi.getModuleCatalog(),
  });
}

export function usePlatformSettings(params?: { page?: number; pageSize?: number; category?: string }) {
  return useQuery({
    queryKey: qk.settings(params),
    queryFn: () => platformApi.getPlatformSettings(params),
  });
}

export function useUpdatePlatformSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: { value: unknown; description?: string } }) =>
      platformApi.updatePlatformSetting(key, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'settings'] }),
  });
}
