'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
export const WILDCARD = '*';

export function can(permissions: string[] | undefined, required: string | string[]): boolean {
  if (!permissions) return false;
  if (permissions.includes(WILDCARD)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((key) => permissions.includes(key));
}

export function hasRole(roles: string[] | undefined, required: string | string[]): boolean {
  if (!roles) return false;
  const list = Array.isArray(required) ? required : [required];
  return list.some((role) => roles.includes(role));
}

export function usePermissions(): string[] {
  return useAuth().user?.permissions ?? [];
}

export function useCan(): (required: string | string[]) => boolean {
  const permissions = usePermissions();
  return (required) => can(permissions, required);
}

export function Can({
  required,
  fallback = null,
  children,
}: {
  required: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  if (!can(user.permissions, required)) return fallback;
  return <>{children}</>;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return null;
  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !can(user.permissions, permission)) return null;
  return <>{children}</>;
}
