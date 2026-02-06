import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
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
