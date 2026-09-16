import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding finance module to existing tenants...');

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      modulesEnabled: true,
    },
  });

  console.log(`Found ${tenants.length} tenants to update`);

  let updatedCount = 0;
  for (const tenant of tenants) {
    const currentModules = (tenant.modulesEnabled as string[]) || [];
    
    // Add finance if not already present
    if (!currentModules.includes('finance')) {
      const updatedModules = [...currentModules, 'finance'];
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          modulesEnabled: updatedModules,
          updatedAt: new Date(),
        },
      });

      // Also create a module override entry for finance
      await prisma.tenantModuleOverride.upsert({
        where: {
          tenantId_moduleKey: {
            tenantId: tenant.id,
            moduleKey: 'finance',
          },
        },
        update: {
          enabled: true,
          updatedAt: new Date(),
        },
        create: {
          tenantId: tenant.id,
          moduleKey: 'finance',
          enabled: true,
        },
      });

      console.log(`✓ Added finance module to tenant: ${tenant.name}`);
      updatedCount++;
    } else {
      console.log(`- Finance module already enabled for tenant: ${tenant.name}`);
    }
  }

  console.log(`\nSummary: Updated ${updatedCount} tenants to include finance module`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
