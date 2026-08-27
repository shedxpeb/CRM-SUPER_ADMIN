import { PrismaClient } from '@prisma/client';
import { PrismaClient as CrmPrismaClient } from '@prisma/client-crm';

const prisma = new PrismaClient();
const crmPrisma = new CrmPrismaClient();

async function testConnection() {
  try {
    console.log('Testing Prisma connections...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('CRM_DATABASE_URL:', process.env.CRM_DATABASE_URL ? 'SET' : 'NOT SET');
    
    // Test platform database
    await prisma.$connect();
    console.log('✓ Platform database connected successfully');
    
    const platformResult = await prisma.$queryRaw`SELECT current_database()`;
    console.log('✓ Platform database:', platformResult[0].current_database);
    
    await prisma.$disconnect();
    console.log('✓ Platform database disconnected successfully');
    
    // Test CRM database (if configured)
    if (process.env.CRM_DATABASE_URL) {
      await crmPrisma.$connect();
      console.log('✓ CRM database connected successfully');
      
      const crmResult = await crmPrisma.$queryRaw`SELECT current_database()`;
      console.log('✓ CRM database:', crmResult[0].current_database);
      
      await crmPrisma.$disconnect();
      console.log('✓ CRM database disconnected successfully');
    } else {
      console.log('⚠ CRM_DATABASE_URL not set, skipping CRM database test');
    }
    
    console.log('✓ All tests passed');
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
