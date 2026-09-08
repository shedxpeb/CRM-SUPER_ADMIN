import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function checkTableWithPool() {
  try {
    console.log('Checking blocked_ips table with custom pool...');
    
    const rawUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/peb-platform?sslmode=disable';
    
    // Create pg Pool with SSL configuration (same as PrismaService)
    const pool = new Pool({
      connectionString: rawUrl,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Create Prisma adapter with the pool
    const adapter = new PrismaPg(pool);

    const prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
    
    // Try to query the table
    const count = await prisma.blockedIp.count();
    console.log('blocked_ips table exists, count:', count);
    
    // Try to findFirst
    const row = await prisma.blockedIp.findFirst();
    console.log('findFirst succeeded, row:', row);
    
    await prisma.$disconnect();
    await pool.end();
    
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

checkTableWithPool();
