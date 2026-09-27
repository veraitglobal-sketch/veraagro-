/**
 * Local-only test accounts for manual QA (web panel + mobile against localhost API).
 * Refuses to run unless DATABASE_URL points at localhost. Credentials land in
 * scripts/local-dev-users.json (gitignored) — never reuse them on production.
 *
 *   DATABASE_URL=postgresql://<you>@localhost:5432/biovera_db node scripts/seed-local-dev.cjs
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url) && !/^postgresql:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
  console.error('Refusing to seed: DATABASE_URL is not a localhost database.');
  process.exit(1);
}

const ACCOUNTS = [
  { partnerCode: 'LOCAL-ADMIN', firstName: 'Local', lastName: 'Admin', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { partnerCode: 'LOCAL-LOGISTICS', firstName: 'Local', lastName: 'Logistika', roles: ['LOGISTICS_PARTNER'] },
  { partnerCode: 'LOCAL-FARMER', firstName: 'Local', lastName: 'Farmer', roles: ['GROWER', 'FARMER'] },
  { partnerCode: 'LOCAL-BUYER', firstName: 'Local', lastName: 'Kupac', roles: ['BUYER'] },
  { partnerCode: 'LOCAL-SUPPLIER', firstName: 'Local', lastName: 'Dobavljač', roles: ['MATERIAL_SUPPLIER'] },
];

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const out = path.join(__dirname, 'local-dev-users.json');
  const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const password = existing?.password || crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);

  for (const a of ACCOUNTS) {
    const email = `${a.partnerCode.toLowerCase()}@local.test`;
    await prisma.users.upsert({
      where: { partnerCode: a.partnerCode },
      update: { passwordHash, roles: a.roles, status: 'ACTIVE' },
      create: {
        id: crypto.randomUUID(),
        partnerCode: a.partnerCode,
        email,
        firstName: a.firstName,
        lastName: a.lastName,
        roles: a.roles,
        status: 'ACTIVE',
        passwordHash,
        updatedAt: new Date(),
      },
    });
  }
  fs.writeFileSync(
    out,
    JSON.stringify({ password, accounts: ACCOUNTS.map((a) => a.partnerCode) }, null, 2) + '\n',
  );
  console.log(`Seeded ${ACCOUNTS.length} local accounts → ${path.relative(process.cwd(), out)}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
