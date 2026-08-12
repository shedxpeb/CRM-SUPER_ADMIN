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
  crmOrganizationId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
