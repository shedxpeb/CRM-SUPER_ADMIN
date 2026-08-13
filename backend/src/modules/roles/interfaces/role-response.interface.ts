export interface RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  permissionCount: number;
  permissions: { id: string; key: string }[];
}

export interface RoleSummaryDto {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
}
