/**
 * One-time: MATERIAL_SUPILIER + profile + map approved (for dev map pins).
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed-material-supplier.ts
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('test123', 10);
  const id = 'seed-b2b-supplier-001';
  const user = await prisma.users.upsert({
    where: { partnerCode: 'SUPPLIER-MAP-001' },
    update: { roles: [UserRole.MATERIAL_SUPPLIER], status: UserStatus.ACTIVE },
    create: {
      id,
      partnerCode: 'SUPPLIER-MAP-001',
      email: 'seed-supplier@example.com',
      firstName: 'Vera',
      lastName: 'Seeds Distributor',
      passwordHash,
      roles: [UserRole.MATERIAL_SUPPLIER],
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  await prisma.material_supplier_profiles.upsert({
    where: { userId: user.id },
    update: {
      businessName: 'Vera Test Seeds Point',
      mapApproved: true,
      approvedAt: new Date(),
      postalCode: '20457',
      street: 'Hafenstraße 1',
    },
    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      businessName: 'Vera Test Seeds Point',
      description: 'Demo supplier on the grower map (seeds, inputs).',
      street: 'Hafenstraße 1',
      address: 'Hafenstraße 1',
      postalCode: '20457',
      city: 'Hamburg',
      country: 'Germany',
      location: { lat: 53.55, lng: 9.99 } as any,
      mapApproved: true,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('OK material supplier for map:', user.partnerCode, user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
