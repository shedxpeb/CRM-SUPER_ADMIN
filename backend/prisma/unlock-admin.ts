import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pebplatform.io';

  const user = await prisma.platformUser.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  await prisma.platformUser.update({
    where: { email },
    data: {
      loginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
    },
  });

  console.log(`Account unlocked for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
