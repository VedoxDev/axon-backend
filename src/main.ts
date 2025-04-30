import * as dotenv from "dotenv";
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true, // rechaza campos no esperados
    transform: true,             // convierte types automáticos (por ejemplo number)
  })),
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap();
