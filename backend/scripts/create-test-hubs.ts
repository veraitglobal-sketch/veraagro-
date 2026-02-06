import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create test hubs (retail locations) for map display
 * These are distribution centers where products can be purchased
 */
async function main() {
  console.log('🌍 Creating test hubs (retail locations)...');

  // Hamburg Hub (main distribution center)
  const hamburgHub = await prisma.hubs.upsert({
    where: { id: 'hub-hamburg-001' },
    update: {},
    create: {
      id: 'hub-hamburg-001',
      name: 'Hamburg Distribution Center',
      city: 'Hamburg',
      address: 'Hafenstraße 12, 20459 Hamburg, Germany',
      location: {
        lat: 53.5511,
        lng: 9.9937,
      },
      status: 'ACTIVE',
    },
  });

  // Berlin Hub
  const berlinHub = await prisma.hubs.upsert({
    where: { id: 'hub-berlin-001' },
    update: {},
    create: {
      id: 'hub-berlin-001',
      name: 'Berlin Bio Market',
      city: 'Berlin',
      address: 'Friedrichstraße 123, 10117 Berlin, Germany',
      location: {
        lat: 52.5200,
        lng: 13.4050,
      },
      status: 'ACTIVE',
    },
  });

  // Munich Hub
  const munichHub = await prisma.hubs.upsert({
    where: { id: 'hub-munich-001' },
    update: {},
    create: {
      id: 'hub-munich-001',
      name: 'Munich Organic Hub',
      city: 'Munich',
      address: 'Marienplatz 8, 80331 München, Germany',
      location: {
        lat: 48.1351,
        lng: 11.5820,
      },
      status: 'ACTIVE',
    },
  });

  // Frankfurt Hub
  const frankfurtHub = await prisma.hubs.upsert({
    where: { id: 'hub-frankfurt-001' },
    update: {},
    create: {
      id: 'hub-frankfurt-001',
      name: 'Frankfurt Distribution Point',
      city: 'Frankfurt',
      address: 'Zeil 5, 60313 Frankfurt am Main, Germany',
      location: {
        lat: 50.1109,
        lng: 8.6821,
      },
      status: 'ACTIVE',
    },
  });

  // Cologne Hub
  const cologneHub = await prisma.hubs.upsert({
    where: { id: 'hub-cologne-001' },
    update: {},
    create: {
      id: 'hub-cologne-001',
      name: 'Cologne Bio Center',
      city: 'Cologne',
      address: 'Hohe Straße 90, 50667 Köln, Germany',
      location: {
        lat: 50.9375,
        lng: 6.9603,
      },
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created hubs:');
  console.log(`  - ${hamburgHub.name} (${hamburgHub.city})`);
  console.log(`  - ${berlinHub.name} (${berlinHub.city})`);
  console.log(`  - ${munichHub.name} (${munichHub.city})`);
  console.log(`  - ${frankfurtHub.name} (${frankfurtHub.city})`);
  console.log(`  - ${cologneHub.name} (${cologneHub.city})`);
  console.log('\n🎉 Test hubs created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating hubs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
