import { Role, FeederStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

// Helpers for randomization
const capacities = [50, 100, 150, 200, 250, 300];
const getLoad = () => [5, 10, 15, 20, 25, 30, 35, 40][Math.floor(Math.random() * 8)];

const statuses = ['ENERGIZED', 'LOAD_SHED', 'FAULT', 'MAINTENANCE'] as FeederStatus[];
const getStatus = () => statuses[Math.floor(Math.random() * statuses.length)];

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Priority[];
const getPriority = () => priorities[Math.floor(Math.random() * priorities.length)];

async function main() {
  console.log('🧹 Wiping existing database...');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Meter", "Payment", "Bill", "OutageReport", "OutageIncident", "ScheduledOutage", "SheddingQuota", "Area", "Feeder", "Substation", "DistributionZone", "AuditLog", "User" CASCADE;`,
  );

  console.log('🌱 Seeding fresh data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- 1. Distribution Zones ---
  console.log('Creating 10 Distribution Zones...');
  const zones = [];
  for (let i = 1; i <= 10; i++) {
    const zone = await prisma.distributionZone.create({
      data: { name: `Zone ${i}`, code: `ZN-${i}` },
    });
    zones.push(zone);
  }

  // --- 2. Substations & Feeders (Physics-Aware) ---
  console.log('Creating 50 Substations and 250 Feeders...');
  const substations = [];
  const feeders = [];
  let feederCounter = 1;

  for (let i = 1; i <= 50; i++) {
    // Generate 5 feeders first to calculate total load
    const feederLoads = [getLoad(), getLoad(), getLoad(), getLoad(), getLoad()];
    const totalFeederLoad = feederLoads.reduce((a, b) => a + b, 0);

    // Pick a substation capacity that is AT LEAST the total feeder load
    const validCapacities = capacities.filter((c) => c >= totalFeederLoad);
    // Randomly pick from valid capacities, or fallback to the max (300)
    const capacityMW =
      validCapacities.length > 0
        ? validCapacities[Math.floor(Math.random() * validCapacities.length)]
        : 300;

    const sub = await prisma.substation.create({
      data: {
        name: `Substation ${i}`,
        code: `SUB-${i}`,
        capacityMW: capacityMW,
        zoneId: zones[(i - 1) % 10].id,
      },
    });
    substations.push(sub);

    // Now insert the 5 feeders into the database
    for (let j = 0; j < 5; j++) {
      const feeder = await prisma.feeder.create({
        data: {
          name: `Feeder ${feederCounter}`,
          code: `FDR-${feederCounter}`,
          loadMW: feederLoads[j],
          status: getStatus(),
          substationId: sub.id,
        },
      });
      feeders.push(feeder);
      feederCounter++;
    }
  }

  // --- 3. Areas ---
  console.log('Creating 600 Areas...');
  const areas = [];
  for (let i = 1; i <= 600; i++) {
    const area = await prisma.area.create({
      data: {
        name: `Area ${i}`,
        code: `ARA-${i}`,
        priority: getPriority(),
        feederId: feeders[(i - 1) % 250].id,
      },
    });
    areas.push(area);
  }

  // --- 4. Users & Meters ---
  console.log('Creating Staff Users & their Meters...');
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@powerbank.com',
      name: 'System Admin',
      password: passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      meterNumber: 'SYS-ADMIN-METER',
      areaId: areas[0].id, // Staff assigned to area 0
    },
  });
  await prisma.meter.create({ data: { number: admin.meterNumber, areaId: admin.areaId!, userId: admin.id } });

  const op1 = await prisma.user.create({
    data: {
      email: 'operator1@powerbank.com',
      name: 'Grid Operator Alpha',
      password: passwordHash,
      role: Role.OPERATOR,
      isVerified: true,
      meterNumber: 'SYS-OP1-METER',
      areaId: areas[0].id,
    },
  });
  await prisma.meter.create({ data: { number: op1.meterNumber, areaId: op1.areaId!, userId: op1.id } });

  const op2 = await prisma.user.create({
    data: {
      email: 'operator2@powerbank.com',
      name: 'Grid Operator Beta',
      password: passwordHash,
      role: Role.OPERATOR,
      isVerified: true,
      meterNumber: 'SYS-OP2-METER',
      areaId: areas[0].id,
    },
  });
  await prisma.meter.create({ data: { number: op2.meterNumber, areaId: op2.areaId!, userId: op2.id } });


  console.log('Creating 150 Customer Users & their Meters...');
  for (let i = 1; i <= 150; i++) {
    const area = areas[(i - 1) % 600];
    const mtrNum = `MTR-CUST-${i}`;

    const user = await prisma.user.create({
      data: {
        email: `customer${i}@powerbank.com`,
        name: `Customer ${i}`,
        password: passwordHash,
        role: Role.CUSTOMER,
        isVerified: true,
        meterNumber: mtrNum,
        areaId: area.id,
      },
    });

    await prisma.meter.create({
      data: {
        number: mtrNum,
        areaId: area.id,
        userId: user.id,
      }
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
