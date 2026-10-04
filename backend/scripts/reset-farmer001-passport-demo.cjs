/** One-time, explicitly authorized FARMER001 demo reset. Dry-run unless --apply. */
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const expectedUser = '82f37ee8-4969-44f5-97a9-6cd4dfa2c29e';
const expectedCodes = ['BATCH-2026-1253', 'BATCH-2026-6733', 'BATCH-2026-9463',
  'BATCH-2026-4705', 'BATCH-2026-8883', 'BATCH-2026-6011', 'BATCH-2026-3505',
  'BATCH-2026-8227', 'BATCH-2026-1203', 'BATCH-2026-5792'].sort();
const crops = [['MALINA', 'Malina'], ['KUPINA', 'Kupina'], ['JAGODA', 'Jagoda']];
const deletable = ['temperature_logs', 'location_logs', 'border_wait_times',
  'logistics_handovers', 'freshness_trackers', 'quality_entries', 'compliance_photos', 'audit_trails'];
const quote = s => '"' + s.replaceAll('"', '""') + '"';
const serialize = v => JSON.stringify(v, (_, x) => typeof x === 'bigint' ? x.toString() : x, 2);

async function main() {
  const outcome = await prisma.$transaction(async tx => {
    if (!apply) await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const users = await tx.$queryRaw`SELECT id, "partnerCode" FROM users WHERE "partnerCode" = 'FARMER001'`;
    if (users.length !== 1 || users[0].id !== expectedUser) throw Error('Unexpected account');
    const lots = await tx.$queryRaw`SELECT b.* FROM batches b JOIN estates e ON e.id=b."estateId"
      WHERE e."ownerId"=${expectedUser} OR b."harvestedByUserId"=${expectedUser} ORDER BY b."batchId"`;
    if (serialize(lots.map(b => b.batchId).sort()) !== serialize(expectedCodes)) throw Error('Lot set changed; review again');
    const batchIds = lots.map(b => b.id);
    const missions = await tx.$queryRawUnsafe('SELECT * FROM missions WHERE "batchId" = ANY($1::text[]) ORDER BY id', batchIds);
    if (missions.length !== 16 || missions.some(m => m.growerId !== expectedUser || m.orderId)) throw Error('Mission scope changed');
    if (lots.some(b => b.inventoryId || b.blockchainTxHash)) throw Error('Inventory/blockchain link requires review');
    const missionIds = missions.map(m => m.id);
    const columns = await tx.$queryRawUnsafe(`SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' AND column_name IN ('batchId','relatedBatchId','usedInBatchId','packedBatchId','missionId')`);
    const snapshot = { account: users[0], capturedAt: new Date().toISOString(), tables: { batches: lots, missions } };
    const refs = new Map();
    for (const col of columns) {
      if (['batches', 'missions'].includes(col.table_name)) continue;
      if (!refs.has(col.table_name)) refs.set(col.table_name, []);
      refs.get(col.table_name).push(col.column_name);
    }
    for (const [table, names] of refs) {
      const values = names.map(name => name === 'missionId' ? missionIds : [...batchIds, ...expectedCodes]);
      const where = names.map((name, i) => `${quote(name)} = ANY($${i + 1}::text[])`).join(' OR ');
      const rows = await tx.$queryRawUnsafe(`SELECT * FROM ${quote(table)} WHERE ${where}`, ...values);
      if (!rows.length) continue;
      if (!deletable.includes(table) && table !== 'material_inventory') throw Error(`Linked ${table} records require review (${rows.length}); no changes made`);
      if (table === 'material_inventory' && rows.some(r => r.soldToUserId !== expectedUser || r.status !== 'USED')) {
        throw Error('Material ownership/status requires review');
      }
      if (rows.some(r => (r.batchId && !batchIds.includes(r.batchId) && !expectedCodes.includes(r.batchId)) ||
          (r.missionId && !missionIds.includes(r.missionId)))) throw Error(`Shared ${table} records require review`);
      snapshot.tables[table] = rows;
    }
    // Audit entity references may exist without their optional batch foreign key.
    snapshot.tables.audit_trails = await tx.$queryRawUnsafe(
      'SELECT * FROM audit_trails WHERE "batchId" = ANY($1::text[]) OR "entityId" = ANY($2::text[])',
      batchIds, [...batchIds, ...expectedCodes, ...missionIds, ...missions.map(m => m.missionNumber)]);
    snapshot.tables.estates = await tx.$queryRawUnsafe('SELECT * FROM estates WHERE id = ANY($1::text[])', [...new Set(lots.map(b => b.estateId))]);
    const counts = Object.fromEntries(Object.entries(snapshot.tables).map(([table, rows]) => [table, rows.length]));
    const plan = { apply, account: 'FARMER001', backupCounts: counts,
      clearMaterialUsage: (snapshot.tables.material_inventory || []).length,
      create: crops.map(([code, name]) => ({
      batchId: `DEMO-FARMER001-${code}`, productName: `${name} — DEMO`, quantity: 1, unit: 'kg',
    })), note: 'Estate rows are backed up but are not deleted. Demo quantities/dates are simulated; no quality or certification is asserted.' };
    if (!apply) return plan;

    const dir = path.join(__dirname, '../tmp/farmer001-backups');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const file = path.join(dir, `before-reset-${Date.now()}.json`);
    const payload = serialize(snapshot);
    const fd = fs.openSync(file, 'wx', 0o600);
    try { fs.writeFileSync(fd, payload); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (fs.readFileSync(file, 'utf8') !== payload) throw Error('Backup verification failed');

    const materials = snapshot.tables.material_inventory || [];
    if (materials.length) await tx.$executeRawUnsafe(
      'UPDATE material_inventory SET "usedInBatchId"=NULL,"usedAt"=NULL,status=\'SOLD\',"updatedAt"=NOW() WHERE id = ANY($1::text[])',
      materials.map(r => r.id));

    for (const table of deletable) {
      const rows = snapshot.tables[table] || [];
      if (rows.length) await tx.$executeRawUnsafe(`DELETE FROM ${quote(table)} WHERE id = ANY($1::text[])`, rows.map(r => r.id));
    }
    await tx.$executeRawUnsafe('DELETE FROM missions WHERE id = ANY($1::text[])', missionIds);
    await tx.$executeRawUnsafe('DELETE FROM batches WHERE id = ANY($1::text[])', batchIds);
    const estateId = randomUUID();
    await tx.$executeRaw`INSERT INTO estates (id,name,"ownerId","polygonCoordinates","calculatedArea",status,"updatedAt")
      VALUES (${estateId},'DEMO — malina, kupina i jagoda',${expectedUser},'[]'::jsonb,0,'PENDING_SETUP',NOW())`;
    for (const [code, name] of crops) {
      const id = randomUUID();
      const history = JSON.stringify([{ demo: true, status: 'PACKED', timestamp: new Date().toISOString(),
        note: 'DEMO: simulirana količina 1 kg i datum berbe. Nije stvarna berba; kvalitet, rok, sertifikat i hladni lanac nisu potvrđeni.' }]);
      await tx.$executeRaw`INSERT INTO batches (id,"batchId","estateId","harvestedByUserId","productName",quantity,unit,"harvestDate",status,"locationHistory","updatedAt")
        VALUES (${id},${`DEMO-FARMER001-${code}`},${estateId},${expectedUser},${`${name} — DEMO`},1,'kg',NOW(),'PACKED',${history}::jsonb,NOW())`;
    }
    const remaining = await tx.$queryRaw`SELECT b."batchId",b."productName" FROM batches b JOIN estates e ON e.id=b."estateId"
      WHERE e."ownerId"=${expectedUser} OR b."harvestedByUserId"=${expectedUser} ORDER BY b."batchId"`;
    if (remaining.length !== 3 || remaining.some(b => !crops.some(([code]) => b.batchId === `DEMO-FARMER001-${code}`))) throw Error('Final account verification failed');
    return { ...plan, backup: file, backupSha256: createHash('sha256').update(payload).digest('hex'), remaining };
  }, { timeout: 60000, isolationLevel: 'Serializable' });
  console.log(serialize(outcome));
}
main().catch(e => { console.error('Reset stopped:', e.code || e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
