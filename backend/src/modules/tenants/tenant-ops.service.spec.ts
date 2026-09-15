/// <reference types="jest" />

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { CrmPrismaService } from '../../database/crm-prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { TenantOpsService } from './tenant-ops.service';
import { CreateTenantUserDto } from './dto/tenant-crm.dto';

describe('TenantOpsService - createTenantUser', () => {
  let service: TenantOpsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let crmPrismaService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditService: any;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    crmOrganizationId: 'org-1',
    isDeleted: false,
  };

  const mockActor = {
    id: 'actor-1',
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantOpsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CrmPrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            role: {
              findFirst: jest.fn(),
            },
            userRoleAssignment: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantOpsService>(TenantOpsService);
    prismaService = module.get(PrismaService);
    crmPrismaService = module.get(CrmPrismaService);
    auditService = module.get(AuditService);
  });

  describe('TEST 1: Create completely new email', () => {
    it('should create a new user when email does not exist', async () => {
      const dto: CreateTenantUserDto = {
        email: 'newuser@test.com',
        name: 'New User',
        role: 'EMPLOYEE',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (crmPrismaService.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'newuser@test.com',
        name: 'New User',
        role: 'EMPLOYEE',
        isActive: true,
        createdAt: new Date(),
      });
      (crmPrismaService.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'role-1',
        code: 'EMPLOYEE',
        name: 'Employee',
        isSystem: true,
        isDeleted: false,
      });
      (crmPrismaService.userRoleAssignment.create as jest.Mock).mockResolvedValue({});

      const result = await service.createTenantUser('tenant-1', dto, mockActor);

      expect(result).toBeDefined();
      expect(result.email).toBe('newuser@test.com');
      expect(crmPrismaService.user.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'tenant.user.create',
        }),
      );
    });
  });

  describe('TEST 2: Create email of active user', () => {
    it('should return 409 Conflict when email belongs to active user', async () => {
      const dto: CreateTenantUserDto = {
        email: 'existing@test.com',
        name: 'Existing User',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'existing@test.com',
        isDeleted: false,
        organizationId: 'org-1',
      });

      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        'A user with this email already exists',
      );
    });
  });

  describe('TEST 3: Create email after hard delete', () => {
    it('should allow creating same email after hard delete', async () => {
      const dto: CreateTenantUserDto = {
        email: 'deleted@test.com',
        name: 'New User',
        role: 'EMPLOYEE',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      // First call returns null (user was hard deleted)
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (crmPrismaService.user.create as jest.Mock).mockResolvedValue({
        id: 'user-2',
        email: 'deleted@test.com',
        name: 'New User',
        role: 'EMPLOYEE',
        isActive: true,
        createdAt: new Date(),
      });
      (crmPrismaService.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'role-1',
        code: 'EMPLOYEE',
        name: 'Employee',
        isSystem: true,
        isDeleted: false,
      });
      (crmPrismaService.userRoleAssignment.create as jest.Mock).mockResolvedValue({});

      const result = await service.createTenantUser('tenant-1', dto, mockActor);

      expect(result).toBeDefined();
      expect(result.email).toBe('deleted@test.com');
      expect(crmPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('TEST 4: Create email belonging to another organization', () => {
    it('should return 409 Conflict when email belongs to another organization', async () => {
      const dto: CreateTenantUserDto = {
        email: 'otherorg@test.com',
        name: 'Other Org User',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'otherorg@test.com',
        isDeleted: false,
        organizationId: 'org-2', // Different organization
      });

      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        'A user with this email already exists',
      );
    });
  });

  describe('TEST 5: Concurrent duplicate creation', () => {
    it('should handle race conditions with P2002 unique constraint errors', async () => {
      const dto: CreateTenantUserDto = {
        email: 'race@test.com',
        name: 'Race User',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Simulate P2002 unique constraint error
      const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002' },
      );
      (crmPrismaService.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createTenantUser('tenant-1', dto, mockActor)).rejects.toThrow(
        'A user with this email already exists',
      );
    });
  });

  describe('Email normalization', () => {
    it('should normalize email to lowercase and trim', async () => {
      const dto: CreateTenantUserDto = {
        email: '  MixedCase@TEST.COM  ',
        name: 'Test User',
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (crmPrismaService.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'mixedcase@test.com',
        name: 'Test User',
        role: 'EMPLOYEE',
        isActive: true,
        createdAt: new Date(),
      });
      (crmPrismaService.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'role-1',
        code: 'EMPLOYEE',
        name: 'Employee',
        isSystem: true,
        isDeleted: false,
      });
      (crmPrismaService.userRoleAssignment.create as jest.Mock).mockResolvedValue({});

      await service.createTenantUser('tenant-1', dto, mockActor);

      expect(crmPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'mixedcase@test.com',
          }),
        }),
      );
    });
  });
});

describe('TenantOpsService - softDeleteTenantUser (Hard Delete)', () => {
  let service: TenantOpsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let crmPrismaService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditService: any;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    crmOrganizationId: 'org-1',
    isDeleted: false,
  };

  const mockActor = {
    id: 'actor-1',
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantOpsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CrmPrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantOpsService>(TenantOpsService);
    prismaService = module.get(PrismaService);
    crmPrismaService = module.get(CrmPrismaService);
    auditService = module.get(AuditService);
  });

  describe('Hard delete user', () => {
    it('should permanently delete user from database', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        organizationId: 'org-1',
        isDeleted: false,
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (crmPrismaService.$transaction as jest.Mock).mockResolvedValue([]);
      (crmPrismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.softDeleteTenantUser('tenant-1', 'user-1', mockActor);

      expect(result).toEqual({ success: true, message: 'User permanently deleted' });
      expect(crmPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'tenant.user.delete',
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (crmPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.softDeleteTenantUser('tenant-1', 'nonexistent-user', mockActor),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
