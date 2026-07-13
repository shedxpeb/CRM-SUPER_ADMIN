import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@pebcrm.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: 'System Admin',
      role: 'SUPER_ADMIN',
      organizationType: 'SYSTEM',
      isActive: true,
      isVerified: true,
      passwordHistory: JSON.stringify([{ password: passwordHash, changedAt: new Date().toISOString() }]),
    },
  });

  console.log(`Super admin created: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });