export interface TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  domain: string | null;
  status: string;
  maxUsers: number;
  maxStorageGB: number;
  modulesEnabled: string[] | null;
  syncState: string;
  lastSyncedAt: Date | null;
  syncError: string | null;
  syncVersion: number;
  notes: string | null;
  crmOrganizationId: string | null;
  version: number;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}
