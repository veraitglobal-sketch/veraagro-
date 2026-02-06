import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('Creating test users...');

  // Hash password
  const passwordHash = await bcrypt.hash('test123', 10);

  // Create Admin user
  const admin = await prisma.users.upsert({
    where: { partnerCode: 'ADMIN001' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      partnerCode: 'ADMIN001',
      email: 'admin@biovera.app',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      roles: [UserRole.SUPER_ADMIN],
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Admin user created:', admin.partnerCode);

  // Create Farmer/Grower user
  const farmer = await prisma.users.upsert({
    where: { partnerCode: 'FARMER001' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      partnerCode: 'FARMER001',
      email: 'farmer@biovera.app',
      phone: '+381601234567',
      firstName: 'Marko',
      lastName: 'Petrović',
      passwordHash,
      roles: [UserRole.GROWER],
      status: UserStatus.ACTIVE,
      isVeraPartner: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Farmer user created:', farmer.partnerCode);

  // Create Buyer user
  const buyer = await prisma.users.upsert({
    where: { partnerCode: 'BUYER001' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      partnerCode: 'BUYER001',
      email: 'buyer@biovera.app',
      firstName: 'Anna',
      lastName: 'Schmidt',
      passwordHash,
      roles: [UserRole.BUYER],
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Buyer user created:', buyer.partnerCode);

  // Create Logistics Partner user
  const logistics = await prisma.users.upsert({
    where: { partnerCode: 'LOG001' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      partnerCode: 'LOG001',
      email: 'logistics@biovera.app',
      firstName: 'Ivan',
      lastName: 'Jovanović',
      passwordHash,
      roles: [UserRole.LOGISTICS_PARTNER],
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Logistics user created:', logistics.partnerCode);

  console.log('\n📋 Test Users Created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Partner Code: ADMIN001');
  console.log('  Password: test123');
  console.log('  Email: admin@biovera.app');
  console.log('\nFarmer/Grower:');
  console.log('  Partner Code: FARMER001');
  console.log('  Password: test123');
  console.log('  Email: farmer@biovera.app');
  console.log('\nBuyer:');
  console.log('  Partner Code: BUYER001');
  console.log('  Password: test123');
  console.log('  Email: buyer@biovera.app');
  console.log('\nLogistics Partner:');
  console.log('  Partner Code: LOG001');
  console.log('  Password: test123');
  console.log('  Email: logistics@biovera.app');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createTestUsers()
  .catch((e) => {
    console.error('Error creating users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
