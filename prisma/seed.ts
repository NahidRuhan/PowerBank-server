import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@powerbank.com' },
    update: {},
    create: {
      email: 'admin@powerbank.com',
      name: 'System Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Operator User
  await prisma.user.upsert({
    where: { email: 'operator@powerbank.com' },
    update: {},
    create: {
      email: 'operator@powerbank.com',
      name: 'Grid Operator',
      password: passwordHash,
      role: Role.OPERATOR,
      isVerified: true,
    },
  });

  // Customer User
  await prisma.user.upsert({
    where: { email: 'customer@powerbank.com' },
    update: {},
    create: {
      email: 'customer@powerbank.com',
      name: 'Test Customer',
      password: passwordHash,
      role: Role.CUSTOMER,
      meterNumber: 'DPDC-TEST-001',
      isVerified: true,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
