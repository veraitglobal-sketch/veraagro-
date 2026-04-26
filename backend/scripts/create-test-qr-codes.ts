import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createTestQRCodes() {
  console.log('🌾 Creating test QR codes for Farmer Field Management...\n');

  try {
    // 1. Create test seed
    const testSeed = await prisma.seeds.upsert({
      where: { serialNumber: 'SEED-TEST-001' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        serialNumber: 'SEED-TEST-001',
        type: 'RASPBERRY',
        name: 'Test Raspberry Seed',
        batchNumber: 'TEST-BATCH-001',
        quantity: 10,
        areaCoverage: 1.0,
        status: 'AVAILABLE',
        manufacturedAt: new Date(),
      },
    });

    console.log('✅ Test seed created:', testSeed.serialNumber);

    // 2. Add test fertilizer to Bio-White-List
    const testFertilizer = await (prisma as any).bioWhiteList.upsert({
      where: { barcode: 'TEST-FERT-001' },
      update: {},
      create: {
        id: crypto.randomUUID(),
        barcode: 'TEST-FERT-001',
        productName: 'Test Organic Fertilizer',
        manufacturer: 'Test Company',
        description: 'Test fertilizer for development and testing',
        isActive: true,
      },
    });

    console.log('✅ Test fertilizer created:', testFertilizer.barcode);

    // 3. Generate QR codes
    const seedQRData = `SEED:${testSeed.serialNumber}`;
    const fertQRData = `FERTILIZER:${testFertilizer.barcode}`;

    const seedQR = await QRCode.toDataURL(seedQRData, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });

    const fertQR = await QRCode.toDataURL(fertQRData, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });

    // 4. Save QR codes to files
    const outputDir = path.join(__dirname, '../test-qr-codes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const seedQRPath = path.join(outputDir, 'test-seed-qr.png');
    const fertQRPath = path.join(outputDir, 'test-fert-qr.png');

    // Extract base64 data and save
    const seedQRBase64 = seedQR.split(',')[1];
    const fertQRBase64 = fertQR.split(',')[1];

    fs.writeFileSync(seedQRPath, Buffer.from(seedQRBase64, 'base64'));
    fs.writeFileSync(fertQRPath, Buffer.from(fertQRBase64, 'base64'));

    console.log('\n📱 QR Codes Generated:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 Seed QR Code:');
    console.log(`   Serial Number: ${testSeed.serialNumber}`);
    console.log(`   QR Data: ${seedQRData}`);
    console.log(`   Saved to: ${seedQRPath}`);
    console.log('\n💧 Fertilizer QR Code:');
    console.log(`   Barcode: ${testFertilizer.barcode}`);
    console.log(`   QR Data: ${fertQRData}`);
    console.log(`   Saved to: ${fertQRPath}`);
    console.log('\n💡 Usage:');
    console.log('   1. Scan these QR codes with your mobile app');
    console.log('   2. Use them in field entry forms');
    console.log('   3. Test Integrity Guard validation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. Print QR codes to the console (ASCII)
    console.log('📱 QR Code Preview (ASCII):');
    console.log('\nSeed QR Code:');
    await QRCode.toString(seedQRData, { type: 'terminal', small: true });
    console.log('\nFertilizer QR Code:');
    await QRCode.toString(fertQRData, { type: 'terminal', small: true });

  } catch (error) {
    console.error('❌ Error creating test QR codes:', error);
    throw error;
  }
}

createTestQRCodes()
  .then(() => {
    console.log('\n✅ Test QR codes created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create test QR codes:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
