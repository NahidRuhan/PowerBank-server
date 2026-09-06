import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

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
  const customer = await prisma.user.upsert({
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

  console.log('Seeding Infrastructure...');

  const zone = await prisma.distributionZone.upsert({
    where: { code: 'DHK-NORTH' },
    update: {},
    create: {
      name: 'Dhaka North',
      code: 'DHK-NORTH',
      description: 'Northern part of Dhaka city',
    },
  });

  const substation = await prisma.substation.upsert({
    where: { code: 'MIR-10' },
    update: {},
    create: {
      name: 'Mirpur 10 Substation',
      code: 'MIR-10',
      capacityMW: 200,
      zoneId: zone.id,
    },
  });

  const feeder = await prisma.feeder.upsert({
    where: { code: 'MIR-10-F3' },
    update: {},
    create: {
      name: 'Mirpur 10 Feeder 3',
      code: 'MIR-10-F3',
      loadMW: 15,
      substationId: substation.id,
    },
  });

  const area = await prisma.area.upsert({
    where: { code: 'PALLABI-1' },
    update: {},
    create: {
      name: 'Pallabi Phase 1',
      code: 'PALLABI-1',
      priority: 'MEDIUM',
      customerCount: 1500,
      feederId: feeder.id,
    },
  });

  // Assign customer to area
  await prisma.user.update({
    where: { id: customer.id },
    data: { areaId: area.id },
  });

  console.log('Seeding Phase 3: Schedules and Quotas...');

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@powerbank.com' } });
  
  const quota = await prisma.sheddingQuota.upsert({
    where: { date_timeSlot: { date: new Date(), timeSlot: '18:00-19:00' } },
    update: {},
    create: {
      date: new Date(),
      timeSlot: '18:00-19:00',
      targetMW: 100,
      createdBy: adminUser!.id,
    },
  });

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  await prisma.scheduledOutage.create({
    data: {
      feederId: feeder.id,
      quotaId: quota.id,
      startTime: now,
      endTime: oneHourLater,
      reason: 'Evening peak load shedding',
      status: 'SCHEDULED',
      createdBy: adminUser!.id,
    },
  });

  console.log('Seeding Phase 4 & 5: Incidents and Bills...');

  await prisma.outageIncident.create({
    data: {
      feederId: feeder.id,
      description: 'Transformer blown near block C',
      status: 'INVESTIGATING',
      createdBy: adminUser!.id,
    },
  });

  await prisma.bill.create({
    data: {
      userId: customer.id,
      areaId: area.id,
      month: '2026-08',
      amount: 1500,
      totalAmount: 1500,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      status: 'UNPAID',
    }
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
