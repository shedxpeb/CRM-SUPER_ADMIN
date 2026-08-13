import type { PaginationMeta } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  passwordVersion?: number;
  permissionVersion?: number;
  createdAt?: string;
  isActive?: boolean;
  isLocked?: boolean;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: AuthUser;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Tenants ──────────────────────────────────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type SyncState = 'PENDING' | 'SYNCED' | 'SYNCING' | 'FAILED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  domain?: string | null;
  status: TenantStatus;
  maxUsers: number;
  maxStorageGB: number;
  syncState: SyncState;
  notes?: string | null;
  version: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  crmOrganizationId?: string | null;
}

export interface TenantActivityEntry {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  actorEmail?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Identity & Access ────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  key: string;
  module: string;
  label: string;
  description?: string | null;
  category: string;
  isDeprecated: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount?: number;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  activeSessions?: number;
  roles?: { id: string; name: string }[];
}

export interface PlatformSession {
  id: string;
  userId: string;
  deviceInfo?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  isActive: boolean;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
}

export interface LoginAttempt {
  id: string;
  email: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  failureReason?: string | null;
  lockedUntil?: string | null;
  createdAt: string;
}

export interface BlockedIp {
  id: string;
  ipAddress: string;
  reason?: string | null;
  blockedUntil?: string | null;
  isActive: boolean;
  createdAt: string;
  unblockedAt?: string | null;
}

// ── Monitoring & Operations ──────────────────────────────────────────────────

export interface ImpersonationLog {
  id: string;
  superAdminId: string;
  superAdminEmail: string;
  tenantId: string;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  reason?: string | null;
  grantId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  endedBy?: string | null;
  tenant?: { id: string; name: string; slug: string; status: string };
}

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity: string;
  requestId?: string | null;
  correlationId?: string | null;
  tenantId?: string | null;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  component?: string | null;
  level: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
}

export interface PlatformError {
  id: string;
  service?: string | null;
  type?: string | null;
  message: string;
  severity: string;
  status: string;
  file?: string | null;
  method?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ── Tenant (CRM) resources ───────────────────────────────────────────────────

export interface TenantUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isLocked: boolean;
  lastLogin?: string | null;
  department?: string | null;
  designation?: string | null;
  mobile?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantRole {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

// ── CRM Modules ────────────────────────────────────────────────────────────────

export type CrmModuleKey =
  | 'leads'
  | 'customers'
  | 'vendors'
  | 'inventory'
  | 'purchase_orders'
  | 'projects'
  | 'tracking'
  | 'quotations'
  | 'invoices'
  | 'reports'
  | 'hr'
  | 'finance';

export const CRM_MODULES: { key: CrmModuleKey; label: string; icon: string; category: 'sales' | 'operations' | 'finance' | 'hr' }[] = [
  { key: 'leads', label: 'Leads', icon: 'Target', category: 'sales' },
  { key: 'customers', label: 'Customers', icon: 'Users', category: 'sales' },
  { key: 'vendors', label: 'Vendors', icon: 'Truck', category: 'operations' },
  { key: 'inventory', label: 'Inventory', icon: 'Package', category: 'operations' },
  { key: 'purchase_orders', label: 'Purchase Orders', icon: 'ShoppingCart', category: 'operations' },
  { key: 'projects', label: 'Projects', icon: 'FolderKanban', category: 'operations' },
  { key: 'tracking', label: 'Tracking', icon: 'MapPin', category: 'operations' },
  { key: 'quotations', label: 'Quotations', icon: 'FileText', category: 'finance' },
  { key: 'invoices', label: 'Invoices', icon: 'Receipt', category: 'finance' },
  { key: 'reports', label: 'Reports', icon: 'BarChart3', category: 'finance' },
  { key: 'hr', label: 'HR', icon: 'UserCheck', category: 'hr' },
  { key: 'finance', label: 'Finance', icon: 'Calculator', category: 'finance' },
];

export const CRM_ACTIONS = ['read', 'create', 'update', 'delete', 'export', 'approve'] as const;

export interface TenantModule {
  tenantId: string;
  moduleKey: CrmModuleKey;
  enabled: boolean;
  enabledAt?: string | null;
  enabledBy?: string | null;
}

export interface CrmPermission {
  module: CrmModuleKey;
  action: (typeof CRM_ACTIONS)[number];
  granted: boolean;
}

// ── Platform Config ──────────────────────────────────────────────────────────

export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SECRET' | 'EMAIL' | 'URL';

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  type: SettingType;
  description?: string | null;
  category: string;
  isSecret: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
