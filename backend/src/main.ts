import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { execSync } from 'child_process';

async function bootstrap() {
  // Run Prisma migrations before starting the app
  try {
    console.log('Running Prisma migrations...');
    
    // First, try to resolve any failed migrations
    try {
      console.log('Checking for failed migrations...');
      execSync('npx prisma migrate resolve --applied 20250101000000_add_harvest_announcements', { 
        stdio: 'pipe',
        env: process.env 
      });
      console.log('Resolved failed migration');
    } catch (resolveError) {
      // If migration doesn't exist or is already resolved, that's okay
      console.log('No failed migration to resolve (or already resolved)');
    }
    
    // Now run migrations
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('Migrations completed successfully');
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
