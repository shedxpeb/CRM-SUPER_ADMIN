import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTable() {
  try {
    console.log('Checking blocked_ips table...');
    
    // Try to query the table
    const count = await prisma.blockedIp.count();
    console.log('blocked_ips table exists, count:', count);
    
    // Try to findFirst
    const row = await prisma.blockedIp.findFirst();
    console.log('findFirst succeeded, row:', row);
    
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
