export interface RoleSummaryDto {
  id: string;
  name: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  isLocked: boolean;
  department: string | null;
  designation: string | null;
  activeSessions: number;
  roles: RoleSummaryDto[];
  createdAt: Date;
  updatedAt: Date;
}
