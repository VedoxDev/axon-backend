import * as dotenv from "dotenv";
dotenv.config();

// Set timezone to Spanish time before anything else
process.env.TZ = 'Europe/Madrid';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for production
  app.enableCors({
    origin: [
      'https://axon-app.vercel.app',           // Your production frontend
      'http://localhost:3001',                // Local development frontend
      'http://localhost:3000',                // Local development alternate
      'http://localhost:4200',                // Angular default port
      'http://localhost:5173',                // Vite default port
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
bootstrap();
