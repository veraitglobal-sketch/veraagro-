import { PrismaClient, UserRole, UserStatus, EstateStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('Creating test data...');

  // Find farmer user
  const farmer = await prisma.users.findUnique({
    where: { partnerCode: 'FARMER001' },
  });

  if (!farmer) {
    console.error('Farmer user not found. Please run create-test-users.ts first.');
    process.exit(1);
  }

  // Create test estate
  const estate = await prisma.estates.upsert({
    where: { id: 'test-estate-001' },
    update: {},
    create: {
      id: 'test-estate-001',
      name: 'Moja Prva Njiva',
      ownerId: farmer.id,
      polygonCoordinates: [
        { lat: 44.7866, lng: 20.4489 },
        { lat: 44.7876, lng: 20.4499 },
        { lat: 44.7886, lng: 20.4509 },
        { lat: 44.7896, lng: 20.4519 },
      ],
      calculatedArea: 50000, // 5 hectares in square meters
      status: EstateStatus.ACTIVE,
      certificationStartDate: new Date(),
      daysRemaining: 1095,
    },
  });

  console.log('✅ Estate created:', estate.name);

  // Create test parcel
  const parcel = await prisma.parcels.upsert({
    where: { id: 'test-parcel-001' },
    update: {},
    create: {
      id: 'test-parcel-001',
      estateId: estate.id,
      polygonCoordinates: [
        { lat: 44.7866, lng: 20.4489 },
        { lat: 44.7876, lng: 20.4499 },
      ],
      calculatedArea: 10000, // 1 hectare
      cropType: 'Raspberry',
      plantingDate: new Date(),
    },
  });

  console.log('✅ Parcel created:', parcel.id);

  console.log('\n📋 Test Data Created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Estate: Moja Prva Njiva');
  console.log('  Area: 5 hectares');
  console.log('  Status: ACTIVE');
  console.log('\nParcel:');
  console.log('  Crop: Raspberry');
  console.log('  Area: 1 hectare');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createTestData()
  .catch((e) => {
    console.error('Error creating test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
