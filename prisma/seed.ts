import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧹 Wiping existing database...');
  // Hard delete all tables to avoid soft-delete unique constraint issues
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Payment", "Bill", "OutageIncident", "ScheduledOutage", "SheddingQuota", "Area", "Feeder", "Substation", "DistributionZone", "AuditLog", "User" CASCADE;`);

  console.log('🌱 Seeding fresh data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- 1. Users ---
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@powerbank.com',
      name: 'System Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const operator1 = await prisma.user.create({
    data: { email: 'operator1@powerbank.com', name: 'Grid Operator Alpha', password: passwordHash, role: Role.OPERATOR, isVerified: true },
  });
  const operator2 = await prisma.user.create({
    data: { email: 'operator2@powerbank.com', name: 'Grid Operator Beta', password: passwordHash, role: Role.OPERATOR, isVerified: true },
  });

  // --- 2. Infrastructure ---
  console.log('Creating infrastructure (Zones, Substations, Feeders, Areas)...');
  
  // Zone 1
  const zoneNorth = await prisma.distributionZone.create({
    data: { name: 'Dhaka North', code: 'DHK-NORTH', description: 'Northern part of Dhaka city' },
  });
  
  // Zone 2
  const zoneSouth = await prisma.distributionZone.create({
    data: { name: 'Dhaka South', code: 'DHK-SOUTH', description: 'Southern part of Dhaka city' },
  });

  // Substations
  const subMirpur = await prisma.substation.create({
    data: { name: 'Mirpur 10 Substation', code: 'MIR-10', capacityMW: 200, zoneId: zoneNorth.id },
  });
  const subUttara = await prisma.substation.create({
    data: { name: 'Uttara Grid Substation', code: 'UTT-01', capacityMW: 150, zoneId: zoneNorth.id },
  });
  const subMotijheel = await prisma.substation.create({
    data: { name: 'Motijheel Commercial Substation', code: 'MOT-01', capacityMW: 300, zoneId: zoneSouth.id },
  });

  // Feeders
  const feederMirpur1 = await prisma.feeder.create({
    data: { name: 'Mirpur F1 (Residential)', code: 'MIR-10-F1', loadMW: 25, substationId: subMirpur.id, status: 'ENERGIZED' },
  });
  const feederMirpur2 = await prisma.feeder.create({
    data: { name: 'Mirpur F2 (Commercial)', code: 'MIR-10-F2', loadMW: 40, substationId: subMirpur.id, status: 'ENERGIZED' },
  });
  const feederUttara1 = await prisma.feeder.create({
    data: { name: 'Uttara F1', code: 'UTT-01-F1', loadMW: 30, substationId: subUttara.id, status: 'ENERGIZED' },
  });
  const feederMotijheel1 = await prisma.feeder.create({
    data: { name: 'Motijheel Central', code: 'MOT-01-F1', loadMW: 80, substationId: subMotijheel.id, status: 'ENERGIZED' },
  });

  // Areas
  const areaPallabi = await prisma.area.create({
    data: { name: 'Pallabi Phase 1', code: 'PALLABI-1', priority: 'MEDIUM', customerCount: 2000, feederId: feederMirpur1.id },
  });
  const areaMirpur10 = await prisma.area.create({
    data: { name: 'Mirpur 10 Circle', code: 'MIR-10-C', priority: 'HIGH', customerCount: 1500, feederId: feederMirpur2.id },
  });
  const areaUttaraSec4 = await prisma.area.create({
    data: { name: 'Uttara Sector 4', code: 'UTT-S4', priority: 'MEDIUM', customerCount: 3000, feederId: feederUttara1.id },
  });
  const areaDilkusha = await prisma.area.create({
    data: { name: 'Dilkusha C/A', code: 'DILKUSHA', priority: 'CRITICAL', customerCount: 500, feederId: feederMotijheel1.id },
  });

  // --- 3. Customers ---
  console.log('Creating customers...');
  const customer1 = await prisma.user.create({
    data: { email: 'customer1@powerbank.com', name: 'Test Customer 1', password: passwordHash, role: Role.CUSTOMER, meterNumber: 'MTR-001', areaId: areaPallabi.id, isVerified: true },
  });
  const customer2 = await prisma.user.create({
    data: { email: 'customer2@powerbank.com', name: 'Test Customer 2', password: passwordHash, role: Role.CUSTOMER, meterNumber: 'MTR-002', areaId: areaMirpur10.id, isVerified: true },
  });
  const customer3 = await prisma.user.create({
    data: { email: 'customer3@powerbank.com', name: 'Test Customer 3', password: passwordHash, role: Role.CUSTOMER, meterNumber: 'MTR-003', areaId: areaUttaraSec4.id, isVerified: true },
  });
  const customer4 = await prisma.user.create({
    data: { email: 'customer4@powerbank.com', name: 'Test Customer 4', password: passwordHash, role: Role.CUSTOMER, meterNumber: 'MTR-004', areaId: areaDilkusha.id, isVerified: true },
  });

  // --- 4. Quotas & Schedules ---
  console.log('Creating quotas and schedules...');
  const now = new Date();
  
  const quota = await prisma.sheddingQuota.create({
    data: {
      date: new Date(),
      timeSlot: '18:00-20:00',
      targetMW: 150,
      createdBy: operator1.id,
    },
  });

  // Scheduled outage for Uttara
  await prisma.scheduledOutage.create({
    data: {
      feederId: feederUttara1.id,
      quotaId: quota.id,
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 mins ago
      endTime: new Date(now.getTime() + 90 * 60 * 1000), // Ends in 90 mins
      reason: 'National Grid short supply',
      status: 'ACTIVE',
      createdBy: operator1.id,
    },
  });
  
  // Future scheduled outage for Mirpur 1
  await prisma.scheduledOutage.create({
    data: {
      feederId: feederMirpur1.id,
      quotaId: quota.id,
      startTime: new Date(now.getTime() + 120 * 60 * 1000), // Starts in 2 hours
      endTime: new Date(now.getTime() + 180 * 60 * 1000), // Ends in 3 hours
      reason: 'Evening peak load balancing',
      status: 'SCHEDULED',
      createdBy: operator2.id,
    },
  });

  // Update Uttara feeder to LOAD_SHED since the schedule is active
  await prisma.feeder.update({
    where: { id: feederUttara1.id },
    data: { status: 'LOAD_SHED' },
  });

  // --- 5. Incidents ---
  console.log('Creating incidents...');
  
  // Investigating incident
  await prisma.outageIncident.create({
    data: {
      feederId: feederMirpur2.id,
      description: 'Underground cable fault reported near Circle',
      status: 'INVESTIGATING',
      createdBy: operator1.id,
    },
  });

  // Repairing incident
  await prisma.outageIncident.create({
    data: {
      feederId: feederMotijheel1.id,
      description: 'Transformer blown, maintenance team dispatched',
      status: 'REPAIRING',
      estimatedRestoration: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      createdBy: operator2.id,
    },
  });

  // Update feeder status to FAULT
  await prisma.feeder.updateMany({
    where: { id: { in: [feederMirpur2.id, feederMotijheel1.id] } },
    data: { status: 'FAULT' },
  });

  // --- 6. Bills & Payments ---
  console.log('Creating bills and payments...');
  
  // Unpaid bill
  const bill1 = await prisma.bill.create({
    data: {
      userId: customer1.id,
      areaId: areaPallabi.id,
      month: '2026-08',
      amount: 1200,
      totalAmount: 1200,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      status: 'UNPAID',
    }
  });

  // Paid bill with a succeeded payment
  const bill2 = await prisma.bill.create({
    data: {
      userId: customer2.id,
      areaId: areaMirpur10.id,
      month: '2026-08',
      amount: 4500,
      totalAmount: 4500,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      status: 'PAID',
    }
  });
  
  await prisma.payment.create({
    data: {
      billId: bill2.id,
      userId: customer2.id,
      amount: 4500,
      currency: 'BDT',
      status: 'SUCCEEDED',
      stripeSessionId: 'cs_test_mock12345',
      stripePaymentId: 'pi_test_mock12345',
    }
  });

  // Overdue bill with a failed payment attempt
  const bill3 = await prisma.bill.create({
    data: {
      userId: customer3.id,
      areaId: areaUttaraSec4.id,
      month: '2026-07',
      amount: 2500,
      surcharge: 100,
      totalAmount: 2600,
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      status: 'OVERDUE',
    }
  });

  await prisma.payment.create({
    data: {
      billId: bill3.id,
      userId: customer3.id,
      amount: 2500, // Failed before surcharge was added
      currency: 'BDT',
      status: 'FAILED',
      stripeSessionId: 'cs_test_mockfailed',
    }
  });

  console.log('✅ Seeding completed perfectly!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
