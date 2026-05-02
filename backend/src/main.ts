import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { execSync } from 'child_process';

async function bootstrap() {
  // Run Prisma migrations before starting the app; see backend/MIGRATIONS.md (squashed baseline, Railway).
  try {
    console.log('Running Prisma migrations...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('Migrations completed successfully');
    } catch (migrateError: unknown) {
      const msg = migrateError instanceof Error ? migrateError.message : String(migrateError);
      if (process.env.NODE_ENV === 'production') {
        console.error('Migration deploy failed in production:', msg);
        process.exit(1);
      }
      console.warn('Migration deploy failed, but continuing in dev:', msg);
    }

    // Create test users if database is empty (only in production for initial setup)
    if (process.env.NODE_ENV === 'production' && process.env.CREATE_TEST_USERS !== 'false') {
      try {
        console.log('Checking if test users need to be created...');
        execSync('npm run create:users', {
          stdio: 'inherit',
          env: process.env,
          cwd: process.cwd(),
        });
        console.log('Test users check completed');
      } catch (error) {
        // Script uses upsert, so it's safe to run multiple times
        console.log('Test users script completed (users may already exist)');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  /** Logistics handover sends multiple base64 images in one JSON body — keep above typical mobile photo totals. */
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for mobile app and web
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'https://www.biovera.app',
      'https://biovera.app',
      'https://bio-vera.vercel.app', // Vercel default deployment
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/, // any Vercel preview/production
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
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  const url = domain ? `https://${domain}` : (process.env.NODE_ENV === 'production' ? `port ${port}` : `http://localhost:${port}`);
  console.log(`Bio Vera Backend running on ${url}`);
}

bootstrap();
