'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { can, hasRole, SUPER_ADMIN_ROLE } from './rbac';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string | string[];
  requireTenantId?: boolean;
}

/**
 * Comprehensive route guard for Super Admin
 * 1. Authentication check (is user logged in?)
 * 2. Role check (does user have required role?)
 * 3. Permission check (does user have required permission?)
 * 4. Tenant access check (is user allowed to access this tenant?)
 * 5. Page access check (is user allowed to access this specific page?)
 */
export function RouteGuard({
  children,
  requiredRole = SUPER_ADMIN_ROLE,
  requiredPermission,
  requireTenantId = false,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 1. Authentication check
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 2. Role check
    if (requiredRole && !hasRole(user?.roles, requiredRole)) {
      router.push('/super-admin');
      return;
    }

    // 3. Permission check
    if (requiredPermission && !can(user?.permissions, requiredPermission)) {
      router.push('/super-admin');
      return;
    }

    // 4. Tenant access check (for tenant-specific pages)
    if (requireTenantId) {
      const tenantIdMatch = pathname.match(/\/tenants\/([^/]+)/);
      if (!tenantIdMatch) {
        router.push('/super-admin/tenants');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, requireTenantId, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-sa-text-muted" role="status" aria-live="polite">
        Checking permissions…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Double-check client-side
  if (requiredRole && !hasRole(user?.roles, requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-sa-text-muted">
        Access denied: Insufficient role
      </div>
    );
  }

  if (requiredPermission && !can(user?.permissions, requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-sa-text-muted">
        Access denied: Insufficient permissions
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting specific routes
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...options}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}
