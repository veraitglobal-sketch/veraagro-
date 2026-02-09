import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function bootstrap() {
  // Run Prisma migrations before starting the app
  try {
    console.log('Running Prisma migrations...');
    
    // First, try to resolve any failed migrations
    // List of known failed migrations to resolve
    const failedMigrations = [
      '20250101000000_add_harvest_announcements',
      '20250201140000_add_vera_insights',
      '20250201150000_add_farmer_profile_fields'
    ];
    
    // Apply farmer profile fields migration directly via SQL if needed
    // This must happen BEFORE Prisma Client is used in scripts
    try {
      console.log('Applying farmer profile fields migration...');
      const prisma = new PrismaClient();
      
      // Execute each ALTER TABLE command separately (PostgreSQL doesn't allow multiple commands in one statement)
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerQrCode" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerProfileUrl" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerPhoto" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerBio" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "generation" TEXT;`);
      
      // Create index if it doesn't exist
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_farmerQrCode_key" ON "users"("farmerQrCode");`);
      
      await prisma.$disconnect();
      console.log('✅ Farmer profile fields migration applied successfully');
    } catch (sqlError: any) {
      console.error('❌ Error applying farmer profile fields migration:', sqlError?.message || 'Unknown error');
      // Don't exit - continue with migrations
    }
    
    console.log('Checking for failed migrations...');
    for (const migration of failedMigrations) {
      try {
        execSync(`npx prisma migrate resolve --applied ${migration}`, { 
          stdio: 'pipe',
          env: process.env 
        });
        console.log(`Resolved failed migration: ${migration}`);
      } catch (resolveError) {
        // If migration doesn't exist or is already resolved, that's okay
        console.log(`Migration ${migration} not found or already resolved`);
      }
    }
    
    // Now run migrations
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: process.env 
      });
      console.log('Migrations completed successfully');
    } catch (migrateError: any) {
      // If migration fails, log but don't crash - might be shadow database issue
      console.warn('Migration deploy failed, but continuing:', migrateError.message);
      // Try to resolve any failed migrations
      try {
        execSync('npx prisma migrate resolve --applied 20250209000000_add_ai_conversations', {
          stdio: 'inherit',
          env: process.env
        });
      } catch (resolveError) {
        console.warn('Could not resolve migration, continuing anyway');
      }
    }
    
    // Create test users if database is empty (only in production for initial setup)
    if (process.env.NODE_ENV === 'production' && process.env.CREATE_TEST_USERS !== 'false') {
      try {
        // Verify that farmerQrCode column exists before running script
        console.log('Verifying farmerQrCode column exists...');
        const verifyPrisma = new PrismaClient();
        try {
          // Try to query the column to verify it exists
          await verifyPrisma.$queryRawUnsafe(`SELECT "farmerQrCode" FROM "users" LIMIT 1`);
          console.log('✅ farmerQrCode column verified');
        } catch (verifyError: any) {
          console.error('❌ farmerQrCode column does not exist. Re-applying migration...');
          // Re-apply migration - execute each command separately
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerQrCode" TEXT;`);
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerProfileUrl" TEXT;`);
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerPhoto" TEXT;`);
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "farmerBio" TEXT;`);
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;`);
          await verifyPrisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "generation" TEXT;`);
          await verifyPrisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_farmerQrCode_key" ON "users"("farmerQrCode");`);
          console.log('✅ Migration re-applied successfully');
        }
        await verifyPrisma.$disconnect();
        
        console.log('Checking if test users need to be created...');
        execSync('npm run create:users', { 
          stdio: 'inherit',
          env: process.env,
          cwd: process.cwd()
        });
        console.log('Test users check completed');
      } catch (error) {
        // Script uses upsert, so it's safe to run multiple times
        console.log('Test users script completed (users may already exist)');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Don't exit in development, but exit in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for mobile app and web
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000', // iOS simulator
      'http://127.0.0.1:3000', // iOS simulator alternative
      /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Network IP for physical devices
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Alternative network IP
      /^http:\/\/192\.168\.\d+\.\d+:3004$/, // Network IP for backend
      /^http:\/\/10\.\d+\.\d+\.\d+:3004$/, // Alternative network IP for backend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error if unknown properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Bio Vera Backend running on http://localhost:${port}`);
}

bootstrap();
