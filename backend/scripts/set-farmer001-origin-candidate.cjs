/** Record the user's provisional supplier selection; no seed, purchase or certification is created. */
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const db = new PrismaClient();
const apply = process.argv.includes('--apply');
const owner = '82f37ee8-4969-44f5-97a9-6cd4dfa2c29e';
const products = { 'BATCH-2026-F001-001': 'Malina', 'BATCH-2026-F001-002': 'Kupina' };
const draft = { supplierName: 'Institut za voćarstvo Čačak', status: 'PENDING_DOCUMENTATION', verified: false,
  source: 'USER_INSTRUCTION', materialLotNumber: null, purchaseDate: null, documents: [],
  referenceUrl: 'https://institut-cacak.org/proizvodnja_sadni_materijal.php' };

async function main() {
  const result = await db.$transaction(async tx => {
    if (!apply) await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const users = await tx.$queryRaw`SELECT id FROM users WHERE "partnerCode"='FARMER001'`;
    if (users.length !== 1 || users[0].id !== owner) throw Error('Account mismatch');
    const rows = await tx.$queryRawUnsafe(`SELECT b.id,b."batchId",b."productName",e."ownerId"
      FROM batches b JOIN estates e ON e.id=b."estateId" WHERE b."batchId" = ANY($1::text[])`, Object.keys(products));
    if (rows.length !== 2 || rows.some(r => r.ownerId !== owner || products[r.batchId] !== r.productName)) throw Error('Lot scope changed');
    const previous = await tx.audit_trails.findMany({ where: {
      entityType: 'PassportOriginCandidate', entityId: { in: rows.map(r => r.id) },
    }, orderBy: { timestamp: 'desc' } });
    const pending = rows.filter(row => {
      const latest = previous.find(a => a.entityId === row.id);
      if (latest && JSON.stringify(latest.newValue) !== JSON.stringify(draft)) {
        // JSON key order is not significant in PostgreSQL jsonb.
        if (latest.newValue.supplierName !== draft.supplierName || latest.newValue.status !== draft.status || latest.newValue.verified !== false) {
          throw Error('Existing origin selection requires review');
        }
      }
      return !latest;
    });
    if (!apply || !pending.length) return { apply, lots: rows.map(r => r.batchId), draft, recordsToCreate: pending.length };
    const dir = path.join(__dirname, '../tmp/farmer001-backups');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const backup = path.join(dir, `before-origin-candidate-${Date.now()}.json`);
    const contents = JSON.stringify({ capturedAt: new Date().toISOString(), rows, previous }, null, 2);
    const fd = fs.openSync(backup, 'wx', 0o600);
    try { fs.writeFileSync(fd, contents); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (fs.readFileSync(backup, 'utf8') !== contents) throw Error('Backup verification failed');
    for (const row of pending) await tx.audit_trails.create({ data: {
      id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'PassportOriginCandidate', entityId: row.id,
      batchId: row.id, newValue: draft, isCompliant: false,
      changeReason: 'User requested a provisional supplier name. Origin, purchase and certification remain unverified.',
    } });
    const saved = await tx.audit_trails.findMany({ where: { entityType: 'PassportOriginCandidate', batchId: { in: rows.map(r => r.id) } } });
    if (saved.length !== 2 || saved.some(r => r.newValue.verified !== false || r.newValue.status !== 'PENDING_DOCUMENTATION')) throw Error('Verification failed');
    return { apply, backup, lots: rows.map(r => r.batchId), draft, created: pending.length };
  }, { isolationLevel: 'Serializable', timeout: 30000 });
  console.log(JSON.stringify(result, null, 2));
}
main().catch(e => { console.error('Origin selection stopped:', e.code || e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
