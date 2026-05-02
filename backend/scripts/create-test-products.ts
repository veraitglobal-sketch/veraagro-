import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Fruits
const fruits = [
  { cropType: 'Raspberries', buyPrice: 5.50, sellPrice: 8.50 },
  { cropType: 'Blackberries', buyPrice: 4.80, sellPrice: 7.20 },
  { cropType: 'Blueberries', buyPrice: 8.00, sellPrice: 12.00 },
  { cropType: 'Strawberries', buyPrice: 3.50, sellPrice: 6.50 },
  { cropType: 'Apples', buyPrice: 1.20, sellPrice: 2.50 },
  { cropType: 'Pears', buyPrice: 1.50, sellPrice: 3.00 },
  { cropType: 'Plums', buyPrice: 2.00, sellPrice: 4.00 },
  { cropType: 'Cherries', buyPrice: 4.00, sellPrice: 7.50 },
  { cropType: 'Peaches', buyPrice: 2.50, sellPrice: 5.00 },
  { cropType: 'Apricots', buyPrice: 3.00, sellPrice: 5.50 },
  { cropType: 'Grapes', buyPrice: 2.80, sellPrice: 5.50 },
  { cropType: 'Currants', buyPrice: 4.50, sellPrice: 8.00 },
];

// Vegetables
const vegetables = [
  { cropType: 'Peppers', buyPrice: 2.50, sellPrice: 4.50 },
  { cropType: 'Tomatoes', buyPrice: 1.80, sellPrice: 3.50 },
  { cropType: 'Cucumbers', buyPrice: 1.20, sellPrice: 2.50 },
  { cropType: 'Zucchini', buyPrice: 1.50, sellPrice: 3.00 },
  { cropType: 'Onions', buyPrice: 0.80, sellPrice: 1.80 },
  { cropType: 'Garlic', buyPrice: 3.00, sellPrice: 6.00 },
  { cropType: 'Carrots', buyPrice: 0.90, sellPrice: 2.00 },
  { cropType: 'Potatoes', buyPrice: 0.60, sellPrice: 1.50 },
  { cropType: 'Cabbage', buyPrice: 0.70, sellPrice: 1.80 },
  { cropType: 'Lettuce', buyPrice: 1.20, sellPrice: 2.50 },
  { cropType: 'Spinach', buyPrice: 2.00, sellPrice: 4.00 },
  { cropType: 'Broccoli', buyPrice: 2.20, sellPrice: 4.50 },
  { cropType: 'Cauliflower', buyPrice: 1.80, sellPrice: 3.50 },
  { cropType: 'Beans', buyPrice: 2.50, sellPrice: 5.00 },
  { cropType: 'Peas', buyPrice: 2.00, sellPrice: 4.00 },
  { cropType: 'Celery', buyPrice: 1.50, sellPrice: 3.00 },
  { cropType: 'Beets', buyPrice: 1.20, sellPrice: 2.50 },
];

// Grains
const grains = [
  { cropType: 'Wheat', buyPrice: 0.35, sellPrice: 0.75 },
  { cropType: 'Corn', buyPrice: 0.30, sellPrice: 0.65 },
  { cropType: 'Barley', buyPrice: 0.32, sellPrice: 0.70 },
  { cropType: 'Oats', buyPrice: 0.40, sellPrice: 0.85 },
  { cropType: 'Rye', buyPrice: 0.38, sellPrice: 0.80 },
  { cropType: 'Rice', buyPrice: 0.50, sellPrice: 1.20 },
  { cropType: 'Millet', buyPrice: 0.45, sellPrice: 1.00 },
  { cropType: 'Buckwheat', buyPrice: 0.60, sellPrice: 1.50 },
  { cropType: 'Quinoa', buyPrice: 2.50, sellPrice: 5.50 },
];

async function createTestProducts() {
  console.log('🌱 Creating test products...\n');

  const allProducts = [...fruits, ...vegetables, ...grains];
  let created = 0;
  let skipped = 0;

  for (const product of allProducts) {
    try {
      // Check if product already exists
      const existing = await prisma.market_prices.findFirst({
        where: {
          cropType: product.cropType,
          isActive: true,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${product.cropType} (already exists)`);
        skipped++;
        continue;
      }

      // Deactivate old prices for this crop type
      await prisma.market_prices.updateMany({
        where: {
          cropType: product.cropType,
          isActive: true,
        },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
      });

      // Create new price
      await prisma.market_prices.create({
        data: {
          id: crypto.randomUUID(),
          cropType: product.cropType,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          isActive: true,
          effectiveFrom: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created ${product.cropType} - Buy: €${product.buyPrice.toFixed(2)}, Sell: €${product.sellPrice.toFixed(2)}`);
      created++;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error creating ${product.cropType}:`, msg);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${allProducts.length}`);
  console.log(`\n✨ Done!`);
}

createTestProducts()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
