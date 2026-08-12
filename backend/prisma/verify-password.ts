import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pebplatform.io';
  const password = 'Admin@12345';

  const user = await prisma.platformUser.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', {
    email: user.email,
    isActive: user.isActive,
    isLocked: user.isLocked,
    loginAttempts: user.loginAttempts,
    passwordHash: user.passwordHash.substring(0, 20) + '...',
  });

  // Test bcrypt comparison
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('Password validation:', isValid);

  // Test with fresh hash
  const bcryptRounds = parseInt(process.env.SECURITY_BCRYPT_ROUNDS || process.env.BCRYPT_ROUNDS || '12', 10);
  console.log('Using bcrypt rounds:', bcryptRounds);
  
  const freshHash = await bcrypt.hash(password, bcryptRounds);
  const freshValid = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash validation:', freshValid);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
