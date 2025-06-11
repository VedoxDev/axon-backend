import * as dotenv from "dotenv";
dotenv.config();

// Set timezone to Spanish time before anything else
process.env.TZ = 'Europe/Madrid';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS - ALLOW EVERYTHING (for mobile app + web + development)
  app.enableCors({
    origin: true,                             // Allow ALL origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'],                    // Allow ALL headers
    credentials: true,
    optionsSuccessStatus: 200,               // For mobile compatibility
  });
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
bootstrap();
