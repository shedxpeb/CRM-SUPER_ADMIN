import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSION_CATALOG: { key: string; module: string; label: string; category: string }[] = [
  // Tenants (Organization permissions)
  { key: 'organization:read', module: 'tenants', label: 'View tenants', category: 'tenants' },
  { key: 'organization:create', module: 'tenants', label: 'Create tenants', category: 'tenants' },
  { key: 'organization:update', module: 'tenants', label: 'Update tenants', category: 'tenants' },
  { key: 'organization:suspend', module: 'tenants', label: 'Suspend tenants', category: 'tenants' },
  { key: 'organization:restore', module: 'tenants', label: 'Restore tenants', category: 'tenants' },
  { key: 'organization:delete', module: 'tenants', label: 'Delete tenants', category: 'tenants' },
  // Users & RBAC
  { key: 'users:read', module: 'users', label: 'View platform users', category: 'rbac' },
  { key: 'users:manage', module: 'users', label: 'Manage platform users', category: 'rbac' },
  { key: 'roles:read', module: 'roles', label: 'View roles', category: 'rbac' },
  { key: 'roles:manage', module: 'roles', label: 'Manage roles', category: 'rbac' },
  { key: 'permissions:read', module: 'permissions', label: 'View permissions', category: 'rbac' },
  { key: 'permissions:manage', module: 'permissions', label: 'Manage permissions', category: 'rbac' },
  // CRM Module Access
  { key: 'modules:manage', module: 'modules', label: 'Manage tenant modules', category: 'tenants' },
  // Monitoring
  { key: 'monitoring:read', module: 'monitoring', label: 'View monitoring', category: 'monitoring' },
  { key: 'health:read', module: 'monitoring', label: 'View health', category: 'monitoring' },
  { key: 'errors:read', module: 'monitoring', label: 'View errors', category: 'monitoring' },
  { key: 'errors:resolve', module: 'monitoring', label: 'Resolve errors', category: 'monitoring' },
  { key: 'audit:read', module: 'audit', label: 'View audit logs', category: 'security' },
  { key: 'logs:read', module: 'monitoring', label: 'View logs', category: 'security' },
  // Security
  { key: 'security:read', module: 'security', label: 'View security', category: 'security' },
  { key: 'security:manage', module: 'security', label: 'Manage security', category: 'security' },
  // Settings
  { key: 'settings:read', module: 'settings', label: 'View settings', category: 'settings' },
  { key: 'settings:manage', module: 'settings', label: 'Manage settings', category: 'settings' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*', ...PERMISSION_CATALOG.map((p) => p.key)],
  OWNER: [
    'organization:read', 'organization:create', 'organization:update', 'organization:suspend', 'organization:restore',
    'users:read', 'users:manage', 'roles:read', 'roles:manage', 'permissions:read', 'permissions:manage', 'modules:manage',
    'monitoring:read', 'health:read', 'errors:read', 'errors:resolve', 'logs:read', 'audit:read',
    'security:read', 'settings:read', 'settings:manage',
  ],
  ADMIN: [
    'organization:read', 'organization:create', 'organization:update',
    'users:read', 'users:manage', 'roles:read', 'permissions:read', 'modules:manage',
    'monitoring:read', 'health:read', 'errors:read', 'logs:read', 'audit:read',
    'security:read', 'settings:read',
  ],
  MANAGER: [
    'organization:read', 'users:read', 'roles:read', 'permissions:read',
    'monitoring:read', 'health:read', 'errors:read', 'audit:read', 'logs:read', 'settings:read',
  ],
  EMPLOYEE: [
    'organization:read', 'users:read', 'health:read', 'settings:read',
  ],
};

async function main() {
  const bcryptRounds = parseInt(process.env.SECURITY_BCRYPT_ROUNDS || process.env.BCRYPT_ROUNDS || '12', 10);

  // 1. Permission catalog
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, label: p.label, category: p.category },
      create: p,
    });
  }

  // 2. System roles + role-permission grants
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.platformRole.upsert({
      where: { name: roleName },
      update: { isSystem: true, isActive: true },
      create: { name: roleName, isSystem: true, isActive: true },
    });
    for (const key of keys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // 2b. Deactivate/soft-delete platform roles that are no longer part of the
  // canonical role set (keeps the platform role list to exactly the 5 CRM roles).
  const KEEP_ROLE_NAMES = new Set(Object.keys(ROLE_PERMISSIONS));
  const obsoleteRoles = await prisma.platformRole.findMany({
    where: { name: { notIn: [...KEEP_ROLE_NAMES] } },
    select: { id: true, name: true },
  });
  for (const r of obsoleteRoles) {
    await prisma.platformRole.update({
      where: { id: r.id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
    });
  }

  // 3. Super admin user
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@pebplatform.io').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password || password === 'Admin@12345' || password === 'Admin@123') {
    throw new Error(
      'SUPER_ADMIN_PASSWORD must be set to a strong, non-default value before seeding. ' +
        'Refusing to create/overwrite the platform super admin with a known default.',
    );
  }
  const passwordHash = await bcrypt.hash(password, bcryptRounds);

  const superRole = await prisma.platformRole.findUnique({ where: { name: 'SUPER_ADMIN' } });

  // Always update password hash to ensure it matches current bcrypt settings
  const admin = await prisma.platformUser.upsert({
    where: { email },
    update: {
      isActive: true,
      isLocked: false,
      passwordHash,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email,
      name: 'Platform Super Admin',
      passwordHash,
      isActive: true,
      mustChangePassword: true,
    },
  });
  if (superRole) {
    await prisma.platformUserRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superRole.id } },
      update: {},
      create: { userId: admin.id, roleId: superRole.id },
    });
  }

  // 4. Default platform settings
  const settings: { key: string; value: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'; category: string }[] = [
    { key: 'platform.name', value: JSON.stringify('PEB SUPER-ADMIN'), type: 'STRING', category: 'general' },
    { key: 'platform.supportEmail', value: JSON.stringify('support@pebplatform.io'), type: 'STRING', category: 'general' },
    { key: 'security.mfaRequired', value: JSON.stringify(false), type: 'BOOLEAN', category: 'security' },
    { key: 'security.passwordExpiryDays', value: JSON.stringify(90), type: 'NUMBER', category: 'security' },
    { key: 'maintenance.mode', value: JSON.stringify(false), type: 'BOOLEAN', category: 'general' },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: JSON.parse(s.value), type: s.type, category: s.category },
      create: { key: s.key, value: JSON.parse(s.value), type: s.type, category: s.category },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Super admin: ${email}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });